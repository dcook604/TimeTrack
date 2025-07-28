import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth'
import { z } from 'zod'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

const updateProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').optional(),
  province: z.string().min(1, 'Province is required').optional(),
  preferences: z.object({
    emailNotifications: z.boolean().optional(),
    timeFormat: z.enum(['12h', '24h']).optional(),
    theme: z.enum(['light', 'dark']).optional()
  }).optional()
})

// GET /api/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticateRequest(request)
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Authentication required' },
        { status: 401 }
      )
    }

    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true
      }
    })

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: userProfile.id,
        email: userProfile.email,
        role: userProfile.role,
        profile: userProfile.profile
      }
    })

  } catch (error) {
    console.error('Get profile error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await authenticateRequest(request)
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Get current profile
    const currentProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id }
    })

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    
    if (validatedData.fullName !== undefined) {
      updateData.fullName = validatedData.fullName
    }
    
    if (validatedData.province !== undefined) {
      updateData.province = validatedData.province
    }
    
    if (validatedData.preferences) {
      // Merge with existing preferences
      const existingPreferences = currentProfile.preferences as any || {}
      updateData.preferences = {
        ...existingPreferences,
        ...validatedData.preferences
      }
    }

    // Update profile
    const updatedProfile = await prisma.userProfile.update({
      where: { userId: user.id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: updatedProfile
      },
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Update profile error:', error)
    
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