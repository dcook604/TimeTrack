import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticateRequest } from '@/lib/auth';
import { sendVacationRequestSubmittedNotification } from '@/lib/email';
import { validateVacationRequest, getValidatedData } from '@/middleware/validation';
import { validateOverlappingDates, validateVacationBalance } from '@/lib/validation-schemas';
import { handleApiError, createError, ErrorCodes } from '@/lib/error-handler';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    let whereClause: any = {};

    // Filter by status if provided
    if (status) {
      whereClause.status = status;
    }

    // Filter by user ID if provided, or show user's own requests
    if (userId) {
      whereClause.userId = userId;
    } else {
      whereClause.userId = user.id;
    }

    const vacationRequests = await prisma.vacationRequest.findMany({
      where: whereClause,
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: vacationRequests,
    });
  } catch (error) {
    console.error('Error fetching vacation requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vacation requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    const user = authResult.user;

    // Apply validation middleware
    const validationResponse = await validateVacationRequest(request);
    if (validationResponse.status !== 200) {
      return validationResponse;
    }

    const validatedData = getValidatedData(request);

    // Get user's current vacation balance
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    if (!userProfile) {
      throw createError(
        'User profile not found',
        ErrorCodes.USER_NOT_FOUND,
        [],
        { action: 'create_vacation_request', userId: user.id }
      );
    }

    // Calculate days requested
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);
    const daysRequested = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Check vacation balance
    if (!validateVacationBalance(daysRequested, Number(userProfile.vacationBalance))) {
      throw createError(
        'Insufficient vacation balance',
        ErrorCodes.INSUFFICIENT_VACATION_BALANCE,
        [],
        { 
          action: 'create_vacation_request', 
          userId: user.id, 
          availableBalance: userProfile.vacationBalance 
        }
      );
    }

    // Check for overlapping requests
    const existingRequests = await prisma.vacationRequest.findMany({
      where: {
        userId: user.id,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (!validateOverlappingDates(validatedData.startDate, validatedData.endDate, existingRequests)) {
      throw createError(
        'Vacation request overlaps with existing request',
        ErrorCodes.OVERLAPPING_VACATION_REQUEST,
        [],
        { action: 'create_vacation_request', userId: user.id }
      );
    }

    // Create vacation request
    const vacationRequest = await prisma.vacationRequest.create({
      data: {
        userId: user.id,
        requestType: validatedData.requestType,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        reason: validatedData.reason,
        daysRequested,
        status: 'PENDING',
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    // Send email notification to managers and admins
    try {
      const managersAndAdmins = await prisma.user.findMany({
        where: {
          role: { in: ['MANAGER', 'ADMIN'] },
        },
        include: {
          profile: true,
        },
      });

      for (const manager of managersAndAdmins) {
        await sendVacationRequestSubmittedNotification(
          manager.email,
          {
            employeeName: userProfile.fullName,
            employeeEmail: user.email,
            requestType: validatedData.requestType,
            startDate: validatedData.startDate,
            endDate: validatedData.endDate,
            daysRequested,
            submittedAt: vacationRequest.submittedAt.toISOString(),
            reason: validatedData.reason,
          }
        );
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      data: vacationRequest,
    });
  } catch (error) {
    console.error('Error creating vacation request:', error);
    
    if (error instanceof Error && 'code' in error) {
      const appError = error as any;
      return NextResponse.json(
        { 
          success: false, 
          error: appError.message,
          code: appError.code,
          details: appError.details || []
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create vacation request' },
      { status: 500 }
    );
  }
}