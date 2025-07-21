import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, hasRole } from '@/lib/auth'
import { z } from 'zod'

const approveTimesheetSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional()
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

    if (validatedData.action === 'approve') {
      updateData.status = 'APPROVED'
      updateData.approvedAt = new Date()
    } else {
      updateData.status = 'REJECTED'
      updateData.rejectionReason = validatedData.rejectionReason || 'No reason provided'
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

    // TODO: Send email notification to employee
    console.log(`Timesheet ${validatedData.action}d:`, {
      timesheetId: params.id,
      employee: existingTimesheet.user.email,
      approver: user.email,
      action: validatedData.action,
      rejectionReason: validatedData.rejectionReason
    })

    return NextResponse.json({
      success: true,
      data: updatedTimesheet,
      message: `Timesheet ${validatedData.action}d successfully`
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