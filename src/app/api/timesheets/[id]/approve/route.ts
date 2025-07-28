import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, hasRole } from '@/lib/auth'
import { z } from 'zod'
import { sendTimesheetStatusNotification } from '@/lib/email'

const approveTimesheetSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  approverComments: z.string().optional()
})

// POST /api/timesheets/[id]/approve - Approve or reject timesheet
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await authenticateRequest(request)
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has permission to approve timesheets
    if (!hasRole(user.role, 'MANAGER')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = approveTimesheetSchema.parse(body)

    // Get existing timesheet
    const existingTimesheet = await prisma.timesheet.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { fullName: true }
            }
          }
        }
      }
    })

    if (!existingTimesheet) {
      return NextResponse.json(
        { error: 'Timesheet not found' },
        { status: 404 }
      )
    }

    // Check if timesheet is in submitted status
    if (existingTimesheet.status !== 'SUBMITTED') {
      return NextResponse.json(
        { error: 'Timesheet must be submitted before approval' },
        { status: 400 }
      )
    }

    // Update timesheet based on action
    const updateData: any = {
      reviewedAt: new Date(),
      approvedById: user.id
    }

    if (validatedData.action === 'APPROVE') {
      updateData.status = 'APPROVED'
      updateData.approvedAt = new Date()
    } else {
      updateData.status = 'REJECTED'
      updateData.rejectionReason = validatedData.approverComments || 'No reason provided'
    }

    const updatedTimesheet = await prisma.timesheet.update({
      where: { id: params.id },
      data: updateData,
      include: {
        entries: {
          orderBy: { workDate: 'asc' }
        },
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { fullName: true }
            }
          }
        },
        approvedBy: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { fullName: true }
            }
          }
        }
      }
    })

    // Send email notification to employee
    try {
      await sendTimesheetStatusNotification(
        existingTimesheet.user.email,
        validatedData.action as 'APPROVED' | 'REJECTED',
        {
          weekEnding: new Date(updatedTimesheet.weekStarting).toLocaleDateString(),
          totalHours: Number(updatedTimesheet.totalHours),
          approverName: user.profile?.fullName || 'Manager',
          approvedAt: updateData.approvedAt?.toISOString(),
          reviewedAt: updateData.reviewedAt?.toISOString(),
          approverComments: validatedData.approverComments
        }
      )

      console.log(`Timesheet ${validatedData.action.toLowerCase()}d:`, {
        timesheetId: params.id,
        employee: existingTimesheet.user.email,
        approver: user.email,
        action: validatedData.action,
        rejectionReason: validatedData.approverComments
      })
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      data: updatedTimesheet,
      message: `Timesheet ${validatedData.action.toLowerCase()}d successfully`
    })

  } catch (error) {
    console.error('Approve timesheet error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}