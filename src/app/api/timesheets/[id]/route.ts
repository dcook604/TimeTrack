import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, hasRole } from '@/lib/auth'
import { z } from 'zod'

const updateTimesheetSchema = z.object({
  entries: z.array(z.object({
    id: z.string().optional(),
    workDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format'
    }),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    breakMinutes: z.number().min(0).default(0),
    hoursWorked: z.number().min(0),
    notes: z.string().optional()
  })).optional(),
  status: z.enum(['DRAFT', 'SUBMITTED']).optional()
})

// GET /api/timesheets/[id] - Get specific timesheet
export async function GET(
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

    const timesheet = await prisma.timesheet.findUnique({
      where: { id: params.id },
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

    if (!timesheet) {
      return NextResponse.json(
        { error: 'Timesheet not found' },
        { status: 404 }
      )
    }

    // Check if user can access this timesheet
    const canAccess = timesheet.userId === user.id || hasRole(user.role, 'MANAGER')
    
    if (!canAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: timesheet
    })

  } catch (error) {
    console.error('Get timesheet error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/timesheets/[id] - Update timesheet
export async function PUT(
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

    const body = await request.json()
    const validatedData = updateTimesheetSchema.parse(body)

    // Get existing timesheet
    const existingTimesheet = await prisma.timesheet.findUnique({
      where: { id: params.id },
      include: { entries: true }
    })

    if (!existingTimesheet) {
      return NextResponse.json(
        { error: 'Timesheet not found' },
        { status: 404 }
      )
    }

    // Check if user owns this timesheet
    if (existingTimesheet.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if timesheet can be edited
    if (existingTimesheet.status === 'APPROVED') {
      return NextResponse.json(
        { error: 'Cannot edit approved timesheet' },
        { status: 400 }
      )
    }

    // Update timesheet
    const updateData: any = {}

    if (validatedData.status) {
      updateData.status = validatedData.status
      if (validatedData.status === 'SUBMITTED') {
        updateData.submittedAt = new Date()
      }
    }

    if (validatedData.entries) {
      // Calculate new total hours
      const totalHours = validatedData.entries.reduce((sum, entry) => sum + entry.hoursWorked, 0)
      updateData.totalHours = totalHours

      // Delete existing entries and create new ones
      await prisma.timesheetEntry.deleteMany({
        where: { timesheetId: params.id }
      })

      updateData.entries = {
        create: validatedData.entries.map(entry => ({
          workDate: new Date(entry.workDate),
          startTime: entry.startTime,
          endTime: entry.endTime,
          breakMinutes: entry.breakMinutes,
          hoursWorked: entry.hoursWorked,
          notes: entry.notes
        }))
      }
    }

    const updatedTimesheet = await prisma.timesheet.update({
      where: { id: params.id },
      data: updateData,
      include: {
        entries: {
          orderBy: { workDate: 'asc' }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedTimesheet,
      message: 'Timesheet updated successfully'
    })

  } catch (error) {
    console.error('Update timesheet error:', error)
    
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

// DELETE /api/timesheets/[id] - Delete timesheet
export async function DELETE(
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

    // Get existing timesheet
    const existingTimesheet = await prisma.timesheet.findUnique({
      where: { id: params.id }
    })

    if (!existingTimesheet) {
      return NextResponse.json(
        { error: 'Timesheet not found' },
        { status: 404 }
      )
    }

    // Check if user owns this timesheet
    if (existingTimesheet.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if timesheet can be deleted
    if (existingTimesheet.status === 'APPROVED') {
      return NextResponse.json(
        { error: 'Cannot delete approved timesheet' },
        { status: 400 }
      )
    }

    // Delete timesheet (entries will be deleted due to cascade)
    await prisma.timesheet.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Timesheet deleted successfully'
    })

  } catch (error) {
    console.error('Delete timesheet error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}