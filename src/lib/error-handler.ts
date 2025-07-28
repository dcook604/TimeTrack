import { ApiResponse } from './api-client';

export interface ErrorDetails {
  code?: string;
  field?: string;
  message: string;
  suggestion?: string;
}

export interface ErrorContext {
  action: string;
  component?: string;
  userId?: string;
  timestamp: string;
  [key: string]: any; // Allow additional properties
}

export class AppError extends Error {
  public readonly code: string;
  public readonly details: ErrorDetails[];
  public readonly context: ErrorContext;
  public readonly isUserError: boolean;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    details: ErrorDetails[] = [],
    context: Partial<ErrorContext> = {},
    isUserError: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.context = {
      action: context.action || 'unknown',
      component: context.component,
      userId: context.userId,
      timestamp: new Date().toISOString(),
    };
    this.isUserError = isUserError;
  }
}

export const ErrorCodes = {
  // Authentication errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_DATE: 'INVALID_DATE',
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',

  // Business logic errors
  INSUFFICIENT_VACATION_BALANCE: 'INSUFFICIENT_VACATION_BALANCE',
  OVERLAPPING_VACATION_REQUEST: 'OVERLAPPING_VACATION_REQUEST',
  TIMESHEET_ALREADY_SUBMITTED: 'TIMESHEET_ALREADY_SUBMITTED',
  CANNOT_APPROVE_OWN_REQUEST: 'CANNOT_APPROVE_OWN_REQUEST',
  CANNOT_DELETE_APPROVED_TIMESHEET: 'CANNOT_DELETE_APPROVED_TIMESHEET',

  // Resource errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  TIMESHEET_NOT_FOUND: 'TIMESHEET_NOT_FOUND',
  VACATION_REQUEST_NOT_FOUND: 'VACATION_REQUEST_NOT_FOUND',

  // Conflict errors
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',

  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',

  // Email errors
  EMAIL_SEND_FAILED: 'EMAIL_SEND_FAILED',
  EMAIL_CONFIG_ERROR: 'EMAIL_CONFIG_ERROR',
} as const;

export const getUserFriendlyMessage = (error: AppError | Error | string): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof AppError) {
    switch (error.code) {
      case ErrorCodes.AUTH_REQUIRED:
        return 'Please log in to continue.';
      case ErrorCodes.INVALID_CREDENTIALS:
        return 'Invalid email or password. Please try again.';
      case ErrorCodes.SESSION_EXPIRED:
        return 'Your session has expired. Please log in again.';
      case ErrorCodes.INSUFFICIENT_PERMISSIONS:
        return 'You don\'t have permission to perform this action.';
      case ErrorCodes.VALIDATION_ERROR:
        return 'Please check your input and try again.';
      case ErrorCodes.INVALID_INPUT:
        return 'The information you entered is invalid.';
      case ErrorCodes.MISSING_REQUIRED_FIELD:
        return 'Please fill in all required fields.';
      case ErrorCodes.INVALID_EMAIL:
        return 'Please enter a valid email address.';
      case ErrorCodes.INVALID_DATE:
        return 'Please enter a valid date.';
      case ErrorCodes.INVALID_DATE_RANGE:
        return 'End date must be after start date.';
      case ErrorCodes.INSUFFICIENT_VACATION_BALANCE:
        return 'You don\'t have enough vacation days available.';
      case ErrorCodes.OVERLAPPING_VACATION_REQUEST:
        return 'You already have a vacation request for these dates.';
      case ErrorCodes.TIMESHEET_ALREADY_SUBMITTED:
        return 'This timesheet has already been submitted.';
      case ErrorCodes.CANNOT_APPROVE_OWN_REQUEST:
        return 'You cannot approve your own request.';
      case ErrorCodes.CANNOT_DELETE_APPROVED_TIMESHEET:
        return 'Cannot delete an approved timesheet.';
      case ErrorCodes.RESOURCE_NOT_FOUND:
        return 'The requested item was not found.';
      case ErrorCodes.USER_NOT_FOUND:
        return 'User not found.';
      case ErrorCodes.TIMESHEET_NOT_FOUND:
        return 'Timesheet not found.';
      case ErrorCodes.VACATION_REQUEST_NOT_FOUND:
        return 'Vacation request not found.';
      case ErrorCodes.EMAIL_ALREADY_EXISTS:
        return 'An account with this email already exists.';
      case ErrorCodes.DUPLICATE_RESOURCE:
        return 'This item already exists.';
      case ErrorCodes.NETWORK_ERROR:
        return 'Network error. Please check your connection and try again.';
      case ErrorCodes.TIMEOUT_ERROR:
        return 'Request timed out. Please try again.';
      case ErrorCodes.SERVER_ERROR:
        return 'Server error. Please try again later.';
      case ErrorCodes.EMAIL_SEND_FAILED:
        return 'Failed to send email notification.';
      case ErrorCodes.EMAIL_CONFIG_ERROR:
        return 'Email service is not configured properly.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }

  return error.message || 'An unexpected error occurred.';
};

export const getErrorSuggestion = (error: AppError | Error | string): string | undefined => {
  if (typeof error === 'string' || !(error instanceof AppError)) {
    return undefined;
  }

  switch (error.code) {
    case ErrorCodes.AUTH_REQUIRED:
    case ErrorCodes.SESSION_EXPIRED:
      return 'Please log in to continue.';
    case ErrorCodes.INVALID_CREDENTIALS:
      return 'Check your email and password, then try again.';
    case ErrorCodes.INSUFFICIENT_PERMISSIONS:
      return 'Contact your administrator if you need access.';
    case ErrorCodes.VALIDATION_ERROR:
    case ErrorCodes.INVALID_INPUT:
      return 'Please review your input and try again.';
    case ErrorCodes.NETWORK_ERROR:
      return 'Check your internet connection and try again.';
    case ErrorCodes.TIMEOUT_ERROR:
      return 'The request took too long. Please try again.';
    case ErrorCodes.SERVER_ERROR:
      return 'The server is experiencing issues. Please try again later.';
    default:
      return 'If the problem persists, contact support.';
  }
};

export const handleApiError = (response: ApiResponse<any>, context: Partial<ErrorContext> = {}): AppError => {
  const { error, details } = response;
  
  // Determine error code based on error message
  let code: string = ErrorCodes.SERVER_ERROR;
  if (error?.includes('Authentication required')) {
    code = ErrorCodes.AUTH_REQUIRED;
  } else if (error?.includes('Access denied')) {
    code = ErrorCodes.INSUFFICIENT_PERMISSIONS;
  } else if (error?.includes('not found')) {
    code = ErrorCodes.RESOURCE_NOT_FOUND;
  } else if (error?.includes('already exists')) {
    code = ErrorCodes.DUPLICATE_RESOURCE;
  } else if (error?.includes('Invalid input')) {
    code = ErrorCodes.VALIDATION_ERROR;
  } else if (error?.includes('Insufficient vacation balance')) {
    code = ErrorCodes.INSUFFICIENT_VACATION_BALANCE;
  } else if (error?.includes('overlapping dates')) {
    code = ErrorCodes.OVERLAPPING_VACATION_REQUEST;
  }

  // Convert validation details to ErrorDetails
  const errorDetails: ErrorDetails[] = [];
  if (details && Array.isArray(details)) {
    details.forEach((detail: any) => {
      errorDetails.push({
        field: detail.field,
        message: detail.message,
        code: detail.code,
      });
    });
  }

  return new AppError(
    error || 'An unexpected error occurred',
    code,
    errorDetails,
    context,
    true
  );
};

export const logError = (error: AppError | Error | string, context?: any) => {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  
  console.error('Application Error:', {
    message: errorObj.message,
    stack: errorObj.stack,
    context,
    timestamp: new Date().toISOString(),
    ...(error instanceof AppError && {
      code: error.code,
      details: error.details,
      errorContext: error.context,
      isUserError: error.isUserError,
    }),
  });

  // In production, you might want to send this to an error tracking service
  // like Sentry, LogRocket, or your own error logging endpoint
};

export const createError = (
  message: string,
  code: string = ErrorCodes.SERVER_ERROR,
  details: ErrorDetails[] = [],
  context: Partial<ErrorContext> = {},
  isUserError: boolean = false
): AppError => {
  const error = new AppError(message, code, details, context, isUserError);
  logError(error, context);
  return error;
}; 