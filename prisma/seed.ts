import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data
  console.log('🧹 Cleaning existing data...')
  await prisma.timesheetEntry.deleteMany()
  await prisma.timesheet.deleteMany()
  await prisma.vacationRequest.deleteMany()
  await prisma.userProfile.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  console.log('👥 Creating users...')
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@timetracker.local',
      password: await bcrypt.hash('admin123', 12),
      role: 'ADMIN',
      profile: {
        create: {
          fullName: 'System Administrator',
          province: 'Ontario',
          vacationBalance: 25,
          accruedDays: 25,
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

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@timetracker.local',
      password: await bcrypt.hash('manager123', 12),
      role: 'MANAGER',
      profile: {
        create: {
          fullName: 'Jane Smith',
          province: 'Ontario',
          vacationBalance: 18,
          accruedDays: 20,
          usedDays: 2,
          preferences: {
            emailNotifications: true,
            timeFormat: '12h',
            theme: 'light'
          }
        }
      }
    },
    include: {
      profile: true
    }
  })

  const employee1 = await prisma.user.create({
    data: {
      email: 'john.doe@timetracker.local',
      password: await bcrypt.hash('employee123', 12),
      role: 'EMPLOYEE',
      profile: {
        create: {
          fullName: 'John Doe',
          province: 'Ontario',
          vacationBalance: 10,
          accruedDays: 15,
          usedDays: 5,
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

  const employee2 = await prisma.user.create({
    data: {
      email: 'mike.johnson@timetracker.local',
      password: await bcrypt.hash('employee123', 12),
      role: 'EMPLOYEE',
      profile: {
        create: {
          fullName: 'Mike Johnson',
          province: 'British Columbia',
          vacationBalance: 15,
          accruedDays: 18,
          usedDays: 3,
          preferences: {
            emailNotifications: false,
            timeFormat: '12h',
            theme: 'dark'
          }
        }
      }
    },
    include: {
      profile: true
    }
  })

  console.log('✅ Users created successfully')

  // Create timesheets
  console.log('📋 Creating timesheets...')

  // Current week timesheet for John Doe (draft)
  const currentWeekStart = new Date()
  currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay() + 1) // Monday
  
  const currentTimesheet = await prisma.timesheet.create({
    data: {
      userId: employee1.id,
      weekStarting: currentWeekStart,
      status: 'DRAFT',
      totalHours: 32.5,
      entries: {
        create: [
          {
            workDate: new Date(currentWeekStart.getTime()),
            startTime: '09:00',
            endTime: '17:00',
            breakMinutes: 60,
            hoursWorked: 7,
            notes: 'Regular workday'
          },
          {
            workDate: new Date(currentWeekStart.getTime() + 24 * 60 * 60 * 1000),
            startTime: '09:00',
            endTime: '17:00',
            breakMinutes: 60,
            hoursWorked: 7,
            notes: 'Regular workday'
          },
          {
            workDate: new Date(currentWeekStart.getTime() + 2 * 24 * 60 * 60 * 1000),
            startTime: '09:00',
            endTime: '17:00',
            breakMinutes: 60,
            hoursWorked: 7,
            notes: 'Regular workday'
          },
          {
            workDate: new Date(currentWeekStart.getTime() + 3 * 24 * 60 * 60 * 1000),
            startTime: '09:00',
            endTime: '17:00',
            breakMinutes: 60,
            hoursWorked: 7,
            notes: 'Regular workday'
          },
          {
            workDate: new Date(currentWeekStart.getTime() + 4 * 24 * 60 * 60 * 1000),
            startTime: '09:00',
            endTime: '13:30',
            breakMinutes: 30,
            hoursWorked: 4.5,
            notes: 'Half day - doctor appointment'
          }
        ]
      }
    }
  })

  // Previous week timesheet for John Doe (approved)
  const lastWeekStart = new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  const lastWeekTimesheet = await prisma.timesheet.create({
    data: {
      userId: employee1.id,
      weekStarting: lastWeekStart,
      status: 'APPROVED',
      totalHours: 40,
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      approvedById: managerUser.id,
      entries: {
        create: [
          {
            workDate: new Date(lastWeekStart.getTime()),
            startTime: '09:00',
            endTime: '17:00',
            breakMinutes: 60,
            hoursWorked: 7
          },
          {
            workDate: new Date(lastWeekStart.getTime() + 24 * 60 * 60 * 1000),
            startTime: '09:00',
            endTime: '17:00',
            breakMinutes: 60,
            hoursWorked: 7
          },
          {
            workDate: new Date(lastWeekStart.getTime() + 2 * 24 * 60 * 60 * 1000),
            startTime: '09:00',
            endTime: '17:00',
            breakMinutes: 60,
            hoursWorked: 7
          },
          {
            workDate: new Date(lastWeekStart.getTime() + 3 * 24 * 60 * 60 * 1000),
            startTime: '09:00',
            endTime: '17:00',
            breakMinutes: 60,
            hoursWorked: 7
          },
          {
            workDate: new Date(lastWeekStart.getTime() + 4 * 24 * 60 * 60 * 1000),
            startTime: '09:00',
            endTime: '18:00',
            breakMinutes: 60,
            hoursWorked: 8
          }
        ]
      }
    }
  })

  // Submitted timesheet for Mike Johnson (pending approval)
  const mikeTimesheet = await prisma.timesheet.create({
    data: {
      userId: employee2.id,
      weekStarting: lastWeekStart,
      status: 'SUBMITTED',
      totalHours: 38.5,
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      entries: {
        create: [
          {
            workDate: new Date(lastWeekStart.getTime()),
            startTime: '08:30',
            endTime: '16:30',
            breakMinutes: 60,
            hoursWorked: 7
          },
          {
            workDate: new Date(lastWeekStart.getTime() + 24 * 60 * 60 * 1000),
            startTime: '08:30',
            endTime: '16:30',
            breakMinutes: 60,
            hoursWorked: 7
          },
          {
            workDate: new Date(lastWeekStart.getTime() + 2 * 24 * 60 * 60 * 1000),
            startTime: '08:30',
            endTime: '16:30',
            breakMinutes: 60,
            hoursWorked: 7
          },
          {
            workDate: new Date(lastWeekStart.getTime() + 3 * 24 * 60 * 60 * 1000),
            startTime: '08:30',
            endTime: '16:30',
            breakMinutes: 60,
            hoursWorked: 7
          },
          {
            workDate: new Date(lastWeekStart.getTime() + 4 * 24 * 60 * 60 * 1000),
            startTime: '08:30',
            endTime: '13:00',
            breakMinutes: 30,
            hoursWorked: 4.5,
            notes: 'Early finish - family event'
          }
        ]
      }
    }
  })

  console.log('✅ Timesheets created successfully')

  // Create vacation requests
  console.log('🏖️ Creating vacation requests...')

  // Approved vacation request
  await prisma.vacationRequest.create({
    data: {
      userId: employee1.id,
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
      endDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000), // 2 days vacation
      requestType: 'VACATION',
      status: 'APPROVED',
      reason: 'Family time',
      daysRequested: 3,
      submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      reviewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      reviewedById: managerUser.id
    }
  })

  // Pending vacation request
  await prisma.vacationRequest.create({
    data: {
      userId: employee2.id,
      startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
      endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 5 days vacation
      requestType: 'VACATION',
      status: 'PENDING',
      reason: 'Spring break',
      daysRequested: 5,
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    }
  })

  // Sick leave request (approved)
  await prisma.vacationRequest.create({
    data: {
      userId: employee1.id,
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
      endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 day
      requestType: 'SICK',
      status: 'APPROVED',
      reason: 'Flu symptoms',
      daysRequested: 1,
      submittedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      reviewedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      reviewedById: managerUser.id
    }
  })

  console.log('✅ Vacation requests created successfully')

  console.log('🎉 Database seeded successfully!')
  console.log('')
  console.log('Test accounts created:')
  console.log('👑 Admin: admin@timetracker.local / admin123')
  console.log('👔 Manager: manager@timetracker.local / manager123')
  console.log('👤 Employee 1: john.doe@timetracker.local / employee123')
  console.log('👤 Employee 2: mike.johnson@timetracker.local / employee123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })