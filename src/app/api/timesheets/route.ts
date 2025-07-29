import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth'
import { z } from 'zod'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

const createTimesheetSchema = z.object({
  weekStarting: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format'
  }),
  entries: z.array(z.object({
    workDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format'
    }),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    breakMinutes: z.number().min(0).default(0),
    hoursWorked: z.number().min(0),
    notes: z.string().optional()
  }))
})

// GET /api/timesheets - Get user's timesheets
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticateRequest(request)
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      userId: user.id
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    // Get timesheets with entries
    const timesheets = await prisma.timesheet.findMany({
      where,
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
        }
      },
      orderBy: { weekStarting: 'desc' },
      skip,
      take: limit
    })

    // Get total count for pagination
    const total = await prisma.timesheet.count({ where })

    return NextResponse.json({
      success: true,
      data: timesheets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get timesheets error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/timesheets - Create new timesheet
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticateRequest(request)
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createTimesheetSchema.parse(body)

    const weekStarting = new Date(validatedData.weekStarting)
    
    // Check if timesheet already exists for this week
    const existingTimesheet = await prisma.timesheet.findUnique({
      where: {
        userId_weekStarting: {
          userId: user.id,
          weekStarting
        }
      }
    })

    if (existingTimesheet) {
      return NextResponse.json(
        { error: 'Timesheet already exists for this week' },
        { status: 409 }
      )
    }

    // Calculate total hours
    const totalHours = validatedData.entries.reduce((sum, entry) => sum + entry.hoursWorked, 0)

    // Create timesheet with entries
    const timesheet = await prisma.timesheet.create({
      data: {
        userId: user.id,
        weekStarting,
        status: 'DRAFT',
        totalHours,
        entries: {
          create: validatedData.entries.map(entry => ({
            workDate: new Date(entry.workDate),
            startTime: entry.startTime,
            endTime: entry.endTime,
            breakMinutes: entry.breakMinutes,
            hoursWorked: entry.hoursWorked,
            notes: entry.notes
          }))
        }
      },
      include: {
        entries: {
          orderBy: { workDate: 'asc' }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: timesheet,
      message: 'Timesheet created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Create timesheet error:', error)
    
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