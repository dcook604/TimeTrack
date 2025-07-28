import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, hasRole } from '@/lib/auth'
import { z } from 'zod'

const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  fullName: z.string().min(1, 'Full name is required').optional(),
  province: z.string().min(1, 'Province is required').optional(),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN']).optional(),
  vacationBalance: z.number().min(0, 'Vacation balance must be non-negative').optional()
})

// GET /api/users/[id] - Get specific user (Admin only)
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

    // Only admins can view user details
    if (!hasRole(user.role, 'ADMIN')) {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      )
    }

    const userId = params.id

    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        _count: {
          select: {
            timesheets: true,
            vacationRequests: true
          }
        }
      }
    })

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Remove password from response
    const { password, ...safeUserData } = userData

    return NextResponse.json({
      success: true,
      data: safeUserData
    })

  } catch (error) {
    console.error('Get user error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update user (Admin only)
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

    // Only admins can update users
    if (!hasRole(user.role, 'ADMIN')) {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      )
    }

    const userId = params.id
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if email is being changed and if it's already taken
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email.toLowerCase() }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 409 }
        )
      }
    }

    // Update user data
    const updateData: any = {}
    const profileUpdateData: any = {}

    if (validatedData.email) {
      updateData.email = validatedData.email.toLowerCase()
    }

    if (validatedData.role) {
      updateData.role = validatedData.role
    }

    if (validatedData.fullName) {
      profileUpdateData.fullName = validatedData.fullName
    }

    if (validatedData.province) {
      profileUpdateData.province = validatedData.province
    }

    if (validatedData.vacationBalance !== undefined) {
      profileUpdateData.vacationBalance = validatedData.vacationBalance
    }

    // Update user and profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        profile: {
          update: profileUpdateData
        }
      },
      include: {
        profile: true,
        _count: {
          select: {
            timesheets: true,
            vacationRequests: true
          }
        }
      }
    })

    // Remove password from response
    const { password, ...safeUserData } = updatedUser

    return NextResponse.json({
      success: true,
      data: safeUserData,
      message: 'User updated successfully'
    })

  } catch (error) {
    console.error('Update user error:', error)
    
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

// DELETE /api/users/[id] - Delete user (Admin only)
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

    // Only admins can delete users
    if (!hasRole(user.role, 'ADMIN')) {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      )
    }

    const userId = params.id

    // Prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete user (profile will be deleted due to cascade)
    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Delete user error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 