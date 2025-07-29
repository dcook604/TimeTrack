import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'
import { z } from 'zod'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(1, 'Full name is required'),
  province: z.string().min(1, 'Province is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = registerSchema.parse(body)
    const { email, password, fullName, province } = validatedData

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user with profile
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'EMPLOYEE', // Default role
        profile: {
          create: {
            fullName,
            province,
            vacationBalance: 15, // Default vacation balance
            accruedDays: 15,
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

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    // Create response with user data (excluding password)
    const userData = {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile
    }

    // Set HTTP-only cookie with token
    const response = NextResponse.json({
      success: true,
      user: userData,
      token,
      message: 'Account created successfully'
    }, { status: 201 })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response

  } catch (error) {
    console.error('Registration error:', error)
    
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