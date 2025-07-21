import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, hasRole } from '@/lib/auth'
import { z } from 'zod'

const updateVacationRequestSchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid start date format'
  }).optional(),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid end date format'
  }).optional(),
  requestType: z.enum(['VACATION', 'SICK', 'PERSONAL', 'BEREAVEMENT', 'MATERNITY', 'PATERNITY']).optional(),
  reason: z.string().optional()
})

// GET /api/vacation/requests/[id] - Get specific vacation request
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

    const requestId = params.id

    const vacationRequest = await prisma.vacationRequest.findUnique({
      where: { id: requestId },
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
      }
    })

    if (!vacationRequest) {
      return NextResponse.json(
        { error: 'Vacation request not found' },
        { status: 404 }
      )
    }

    // Check permissions - users can only view their own requests unless they're managers
    if (vacationRequest.userId !== user.id && !hasRole(user.role, 'MANAGER')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: vacationRequest
    })

  } catch (error) {
    console.error('Get vacation request error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/vacation/requests/[id] - Update vacation request
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

    const requestId = params.id
    const body = await request.json()
    const validatedData = updateVacationRequestSchema.parse(body)

    // Get existing request
    const existingRequest = await prisma.vacationRequest.findUnique({
      where: { id: requestId }
    })

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Vacation request not found' },
        { status: 404 }
      )
    }

    // Check permissions - users can only update their own pending requests
    if (existingRequest.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Can only update pending requests
    if (existingRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Can only update pending vacation requests' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    if (validatedData.startDate) {
      updateData.startDate = new Date(validatedData.startDate)
    }

    if (validatedData.endDate) {
      updateData.endDate = new Date(validatedData.endDate)
    }

    if (validatedData.requestType) {
      updateData.requestType = validatedData.requestType
    }

    if (validatedData.reason !== undefined) {
      updateData.reason = validatedData.reason
    }

    // If dates are being updated, recalculate days requested
    if (validatedData.startDate || validatedData.endDate) {
      const startDate = validatedData.startDate ? new Date(validatedData.startDate) : existingRequest.startDate
      const endDate = validatedData.endDate ? new Date(validatedData.endDate) : existingRequest.endDate

      // Validate date range
      if (startDate > endDate) {
        return NextResponse.json(
          { error: 'Start date must be before end date' },
          { status: 400 }
        )
      }

      // Calculate new days requested
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
      updateData.daysRequested = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

      // Check for overlapping requests (excluding current request)
      const overlappingRequest = await prisma.vacationRequest.findFirst({
        where: {
          userId: user.id,
          id: { not: requestId },
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

      // Check vacation balance for vacation requests
      const requestType = validatedData.requestType || existingRequest.requestType
      if (requestType === 'VACATION') {
        const userProfile = await prisma.userProfile.findUnique({
          where: { userId: user.id }
        })

        if (userProfile && updateData.daysRequested > userProfile.vacationBalance) {
          return NextResponse.json(
            { error: `Insufficient vacation balance. You have ${userProfile.vacationBalance} days available.` },
            { status: 400 }
          )
        }
      }
    }

    // Update vacation request
    const updatedRequest = await prisma.vacationRequest.update({
      where: { id: requestId },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      data: updatedRequest,
      message: 'Vacation request updated successfully'
    })

  } catch (error) {
    console.error('Update vacation request error:', error)
    
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

// DELETE /api/vacation/requests/[id] - Delete vacation request
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

    const requestId = params.id

    // Get existing request
    const existingRequest = await prisma.vacationRequest.findUnique({
      where: { id: requestId }
    })

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Vacation request not found' },
        { status: 404 }
      )
    }

    // Check permissions - users can only delete their own pending requests
    if (existingRequest.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Can only delete pending requests
    if (existingRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Can only delete pending vacation requests' },
        { status: 400 }
      )
    }

    // Delete vacation request
    await prisma.vacationRequest.delete({
      where: { id: requestId }
    })

    return NextResponse.json({
      success: true,
      message: 'Vacation request deleted successfully'
    })

  } catch (error) {
    console.error('Delete vacation request error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}