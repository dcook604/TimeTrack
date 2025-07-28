import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, hasRole } from '@/lib/auth'

// GET /api/dashboard - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticateRequest(request)
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Authentication required' },
        { status: 401 }
      )
    }

    const isManager = hasRole(user.role, 'MANAGER')
    const isAdmin = hasRole(user.role, 'ADMIN')

    // Get user's own statistics
    const userStats = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true,
        timesheets: {
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), 0, 1) // This year
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        vacationRequests: {
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), 0, 1) // This year
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    if (!userStats) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate timesheet statistics
    const timesheetStats = await prisma.timesheet.aggregate({
      where: {
        userId: user.id,
        createdAt: {
          gte: new Date(new Date().getFullYear(), 0, 1) // This year
        }
      },
      _count: {
        id: true
      },
      _sum: {
        totalHours: true
      }
    })

    // Calculate vacation statistics
    const vacationStats = await prisma.vacationRequest.aggregate({
      where: {
        userId: user.id,
        createdAt: {
          gte: new Date(new Date().getFullYear(), 0, 1) // This year
        }
      },
      _count: {
        id: true
      },
      _sum: {
        daysRequested: true
      }
    })

    // Get pending timesheets count
    const pendingTimesheets = await prisma.timesheet.count({
      where: {
        userId: user.id,
        status: 'SUBMITTED'
      }
    })

    // Get pending vacation requests count
    const pendingVacations = await prisma.vacationRequest.count({
      where: {
        userId: user.id,
        status: 'PENDING'
      }
    })

    let managerStats = null
    let adminStats = null

    // Get manager statistics if user is manager or admin
    if (isManager || isAdmin) {
      // Get all pending timesheets for approval
      const pendingTimesheetsForApproval = await prisma.timesheet.count({
        where: {
          status: 'SUBMITTED',
          userId: { not: user.id } // Exclude own timesheets
        }
      })

      // Get all pending vacation requests for approval
      const pendingVacationsForApproval = await prisma.vacationRequest.count({
        where: {
          status: 'PENDING',
          userId: { not: user.id } // Exclude own requests
        }
      })

      // Get recent timesheets for approval
      const recentTimesheetsForApproval = await prisma.timesheet.findMany({
        where: {
          status: 'SUBMITTED',
          userId: { not: user.id }
        },
        include: {
          user: {
            select: {
              email: true,
              profile: {
                select: { fullName: true }
              }
            }
          }
        },
        orderBy: { submittedAt: 'desc' },
        take: 5
      })

      // Get recent vacation requests for approval
      const recentVacationsForApproval = await prisma.vacationRequest.findMany({
        where: {
          status: 'PENDING',
          userId: { not: user.id }
        },
        include: {
          user: {
            select: {
              email: true,
              profile: {
                select: { fullName: true }
              }
            }
          }
        },
        orderBy: { submittedAt: 'desc' },
        take: 5
      })

      managerStats = {
        pendingTimesheetsForApproval,
        pendingVacationsForApproval,
        recentTimesheetsForApproval,
        recentVacationsForApproval
      }
    }

    // Get admin statistics if user is admin
    if (isAdmin) {
      // Get total users count
      const totalUsers = await prisma.user.count()
      
      // Get total timesheets count
      const totalTimesheets = await prisma.timesheet.count()
      
      // Get total vacation requests count
      const totalVacationRequests = await prisma.vacationRequest.count()

      // Get users by role
      const usersByRole = await prisma.user.groupBy({
        by: ['role'],
        _count: {
          id: true
        }
      })

      adminStats = {
        totalUsers,
        totalTimesheets,
        totalVacationRequests,
        usersByRole
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: userStats.id,
          email: userStats.email,
          role: userStats.role,
          profile: userStats.profile
        },
        stats: {
          timesheets: {
            total: timesheetStats._count.id || 0,
            totalHours: timesheetStats._sum.totalHours || 0,
            pending: pendingTimesheets
          },
          vacations: {
            total: vacationStats._count.id || 0,
            totalDays: vacationStats._sum.daysRequested || 0,
            pending: pendingVacations
          }
        },
        recent: {
          timesheets: userStats.timesheets,
          vacationRequests: userStats.vacationRequests
        },
        manager: managerStats,
        admin: adminStats
      }
    })

  } catch (error) {
    console.error('Dashboard error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 