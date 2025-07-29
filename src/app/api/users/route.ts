import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, hasRole } from '@/lib/auth'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(1, 'Full name is required'),
  province: z.string().min(1, 'Province is required'),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN']),
  vacationBalance: z.number().min(0, 'Vacation balance must be non-negative')
})

const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  fullName: z.string().min(1, 'Full name is required').optional(),
  province: z.string().min(1, 'Province is required').optional(),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN']).optional(),
  vacationBalance: z.number().min(0, 'Vacation balance must be non-negative').optional()
})

// GET /api/users - Get all users (Admin only)
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticateRequest(request)
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Authentication required' },
        { status: 401 }
      )
    }

    // Only admins can view all users
    if (!hasRole(user.role, 'ADMIN')) {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      )
    }

    const users = await prisma.user.findMany({
      include: {
        profile: true,
        _count: {
          select: {
            timesheets: true,
            vacationRequests: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: users
    })

  } catch (error) {
    console.error('Get users error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create new user (Admin only)
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticateRequest(request)
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Authentication required' },
        { status: 401 }
      )
    }

    // Only admins can create users
    if (!hasRole(user.role, 'ADMIN')) {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password)

    // Create user with profile
    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email.toLowerCase(),
        password: hashedPassword,
        role: validatedData.role,
        profile: {
          create: {
            fullName: validatedData.fullName,
            province: validatedData.province,
            vacationBalance: validatedData.vacationBalance,
            accruedDays: validatedData.vacationBalance,
            usedDays: 0,
            preferences: {
              emailNotifications: true,
              timeFormat: '24h',
              theme: 'light'
            }
          }
        }
      },
      include: {
        profile: true
      }
    })

    // Remove password from response
    const { password, ...userData } = newUser

    return NextResponse.json({
      success: true,
      data: userData,
      message: 'User created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Create user error:', error)
    
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