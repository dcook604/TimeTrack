import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, hasRole } from '@/lib/auth'
import { z } from 'zod'
import { sendVacationRequestStatusNotification } from '@/lib/email'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

const approveVacationRequestSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  reviewComments: z.string().optional()
})

// POST /api/vacation/requests/[id]/approve - Approve or reject vacation request
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

    // Only managers and admins can approve vacation requests
    if (!hasRole(user.role, 'MANAGER')) {
      return NextResponse.json(
        { error: 'Access denied. Manager role required.' },
        { status: 403 }
      )
    }

    const requestId = params.id
    const body = await request.json()
    const validatedData = approveVacationRequestSchema.parse(body)

    // Get existing vacation request
    const existingRequest = await prisma.vacationRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    })

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Vacation request not found' },
        { status: 404 }
      )
    }

    // Can only approve/reject pending requests
    if (existingRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Can only approve or reject pending vacation requests' },
        { status: 400 }
      )
    }

    // Managers cannot approve their own requests
    if (existingRequest.userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot approve your own vacation request' },
        { status: 400 }
      )
    }

    const isApproval = validatedData.action === 'APPROVE'
    const newStatus = isApproval ? 'APPROVED' : 'REJECTED'

    // If approving a vacation request, deduct from vacation balance
    let updatedProfile = null
    if (isApproval && existingRequest.requestType === 'VACATION') {
      const currentBalance = existingRequest.user.profile?.vacationBalance || 0
      const newBalance = Number(currentBalance) - existingRequest.daysRequested

      if (newBalance < 0) {
        return NextResponse.json(
          { error: 'Employee has insufficient vacation balance' },
          { status: 400 }
        )
      }

      // Update user's vacation balance
      updatedProfile = await prisma.userProfile.update({
        where: { userId: existingRequest.userId },
        data: { vacationBalance: newBalance }
      })
    }

    // Update vacation request status
    const updatedRequest = await prisma.vacationRequest.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        reviewedBy: { connect: { id: user.id } },
        reviewedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { fullName: true, province: true, vacationBalance: true }
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

    // Send email notification to employee
    try {
      await sendVacationRequestStatusNotification(
        existingRequest.user.email,
        validatedData.action as 'APPROVED' | 'REJECTED',
        {
          requestType: updatedRequest.requestType,
          startDate: updatedRequest.startDate.toISOString(),
          endDate: updatedRequest.endDate.toISOString(),
          daysRequested: updatedRequest.daysRequested,
          approverName: user.profile?.fullName || 'Manager',
          approvedAt: isApproval ? updatedRequest.reviewedAt?.toISOString() : undefined,
          reviewedAt: updatedRequest.reviewedAt?.toISOString(),
          reviewComments: validatedData.reviewComments,
          newVacationBalance: updatedProfile?.vacationBalance !== undefined ? Number(updatedProfile.vacationBalance) : undefined
        }
      )

      console.log('Vacation request reviewed:', {
        requestId: updatedRequest.id,
        employee: updatedRequest.user.email,
        action: validatedData.action,
        reviewer: user.email,
        startDate: updatedRequest.startDate,
        endDate: updatedRequest.endDate,
        type: updatedRequest.requestType,
        daysRequested: updatedRequest.daysRequested,
        newVacationBalance: updatedProfile?.vacationBalance
      })
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      data: updatedRequest,
      message: `Vacation request ${validatedData.action.toLowerCase()}d successfully`
    })

  } catch (error) {
    console.error('Approve vacation request error:', error)
    
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