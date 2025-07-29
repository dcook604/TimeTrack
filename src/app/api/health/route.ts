import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    let dbStatus = 'unknown'
    let userCount = 0
    
    try {
      await prisma.$connect()
      dbStatus = 'connected'
      
      // Count users
      userCount = await prisma.user.count()
    } catch (dbError) {
      dbStatus = 'error'
      console.error('Database connection error:', dbError)
    }

    // Check environment variables
    const envVars = {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'not set',
      DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
    }

    // Check cookies
    const cookies = request.cookies.getAll()
    const authCookie = cookies.find(cookie => cookie.name === 'auth-token')

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        userCount
      },
      environment: envVars,
      cookies: {
        total: cookies.length,
        authToken: authCookie ? 'present' : 'missing'
      },
      headers: {
        host: request.headers.get('host'),
        userAgent: request.headers.get('user-agent'),
        origin: request.headers.get('origin')
      }
    }

    return NextResponse.json(healthData)

  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        environment: process.env.NODE_ENV
      },
      { status: 500 }
    )
  }
} 