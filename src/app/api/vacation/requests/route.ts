import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, hasRole } from '@/lib/auth'
import { z } from 'zod'

const createVacationRequestSchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid start date format'
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid end date format'
  }),
  requestType: z.enum(['VACATION', 'SICK', 'PERSONAL', 'BEREAVEMENT', 'MATERNITY', 'PATERNITY']),
  reason: z.string().optional()
})

// GET /api/vacation/requests - Get vacation requests
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
    const userId = searchParams.get('userId')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    // If user is not admin/manager, only show their own requests
    if (!hasRole(user.role, 'MANAGER')) {
      where.userId = user.id
    } else if (userId) {
      where.userId = userId
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    // Get vacation requests
    const requests = await prisma.vacationRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { fullName: true, province: true }
            }
          }
        },
        reviewedBy: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { fullName: true }
            }
          }
        }
      },
      orderBy: { submittedAt: 'desc' },
      skip,
      take: limit
    })

    // Get total count for pagination
    const total = await prisma.vacationRequest.count({ where })

    return NextResponse.json({
      success: true,
      data: requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get vacation requests error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/vacation/requests - Create new vacation request
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
    const validatedData = createVacationRequestSchema.parse(body)

    const startDate = new Date(validatedData.startDate)
    const endDate = new Date(validatedData.endDate)

    // Validate date range
    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      )
    }

    // Calculate days requested
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const daysRequested = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    // Check for overlapping requests
    const overlappingRequest = await prisma.vacationRequest.findFirst({
      where: {
        userId: user.id,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: startDate } }
            ]
          },
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: endDate } }
            ]
          },
          {
            AND: [
              { startDate: { gte: startDate } },
              { endDate: { lte: endDate } }
            ]
          }
        ]
      }
    })

    if (overlappingRequest) {
      return NextResponse.json(
        { error: 'You already have a vacation request for overlapping dates' },
        { status: 409 }
      )
    }

    // Check vacation balance for vacation requests (not sick leave)
    if (validatedData.requestType === 'VACATION') {
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId: user.id }
      })

      if (userProfile && daysRequested > userProfile.vacationBalance) {
        return NextResponse.json(
          { error: `Insufficient vacation balance. You have ${userProfile.vacationBalance} days available.` },
          { status: 400 }
        )
      }
    }

    // Create vacation request
    const vacationRequest = await prisma.vacationRequest.create({
      data: {
        userId: user.id,
        startDate,
        endDate,
        requestType: validatedData.requestType,
        status: 'PENDING',
        reason: validatedData.reason,
        daysRequested,
        submittedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { fullName: true, province: true }
            }
          }
        }
      }
    })

    // TODO: Send email notification to managers
    console.log('New vacation request submitted:', {
      requestId: vacationRequest.id,
      employee: user.email,
      startDate: validatedData.startDate,
      endDate: validatedData.endDate,
      type: validatedData.requestType,
      daysRequested
    })

    return NextResponse.json({
      success: true,
      data: vacationRequest,
      message: 'Vacation request submitted successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Create vacation request error:', error)
    
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