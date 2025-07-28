import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth'
import { sendTimesheetSubmittedNotification } from '@/lib/email'

// POST /api/timesheets/[id]/submit - Submit timesheet for approval
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

    const timesheetId = params.id

    // Get the timesheet
    const timesheet = await prisma.timesheet.findUnique({
      where: { id: timesheetId },
      include: {
        entries: {
          orderBy: { workDate: 'asc' }
        },
        user: {
          include: {
            profile: true
          }
        }
      }
    })

    if (!timesheet) {
      return NextResponse.json(
        { error: 'Timesheet not found' },
        { status: 404 }
      )
    }

    // Check if user owns this timesheet
    if (timesheet.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied. You can only submit your own timesheets.' },
        { status: 403 }
      )
    }

    // Check if timesheet is in DRAFT status
    if (timesheet.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only draft timesheets can be submitted' },
        { status: 400 }
      )
    }

    // Update timesheet status to SUBMITTED
    const updatedTimesheet = await prisma.timesheet.update({
      where: { id: timesheetId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date()
      },
      include: {
        entries: {
          orderBy: { workDate: 'asc' }
        },
        approvedBy: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { fullName: true }
            }
          }
        },
        user: {
          include: {
            profile: true
          }
        }
      }
    })

    // Send email notification to managers
    try {
      // Get all managers in the system
      const managers = await prisma.user.findMany({
        where: {
          role: { in: ['MANAGER', 'ADMIN'] }
        },
        include: {
          profile: true
        }
      })

      // Send notifications to all managers
      for (const manager of managers) {
        await sendTimesheetSubmittedNotification(
          manager.email,
          {
            employeeName: updatedTimesheet.user.profile?.fullName || 'Unknown Employee',
            employeeEmail: updatedTimesheet.user.email,
            weekEnding: new Date(updatedTimesheet.weekStarting).toLocaleDateString(),
            totalHours: Number(updatedTimesheet.totalHours),
            submittedAt: updatedTimesheet.submittedAt?.toISOString() || new Date().toISOString()
          }
        )
      }

      console.log('Timesheet submitted for approval:', {
        timesheetId: updatedTimesheet.id,
        employee: user.email,
        weekStarting: updatedTimesheet.weekStarting,
        totalHours: updatedTimesheet.totalHours,
        notificationsSent: managers.length
      })
    } catch (emailError) {
      console.error('Failed to send email notifications:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      data: updatedTimesheet,
      message: 'Timesheet submitted successfully'
    })

  } catch (error) {
    console.error('Submit timesheet error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 