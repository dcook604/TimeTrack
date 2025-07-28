import { z } from 'zod';
import { 
  validateCanadianProvince, 
  validateWorkHours, 
  validateWeekStartingDate,
  validateVacationBalance,
  validateOverlappingDates,
  validateTimesheetSubmission
} from './validation-schemas';

export interface DataIntegrityCheck {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BusinessRule {
  name: string;
  description: string;
  validate: (data: any) => boolean;
  errorMessage: string;
}

// Business rules for data integrity
export const businessRules: BusinessRule[] = [
  {
    name: 'province_validation',
    description: 'Province must be a valid Canadian province',
    validate: (data: any) => validateCanadianProvince(data.province),
    errorMessage: 'Please select a valid Canadian province',
  },
  {
    name: 'work_hours_validation',
    description: 'Work hours must be valid (start < end, max 24h)',
    validate: (data: any) => validateWorkHours(data.startTime, data.endTime, data.breakMinutes),
    errorMessage: 'Invalid work hours (start time must be before end time, max 24 hours)',
  },
  {
    name: 'week_starting_monday',
    description: 'Week starting date must be a Monday',
    validate: (data: any) => validateWeekStartingDate(data.weekStarting),
    errorMessage: 'Week must start on a Monday',
  },
  {
    name: 'vacation_balance_check',
    description: 'Vacation request cannot exceed available balance',
    validate: (data: any) => validateVacationBalance(data.daysRequested, data.availableBalance),
    errorMessage: 'Insufficient vacation balance',
  },
  {
    name: 'no_overlapping_vacation',
    description: 'Vacation requests cannot overlap with existing requests',
    validate: (data: any) => validateOverlappingDates(data.startDate, data.endDate, data.existingRequests),
    errorMessage: 'Vacation request overlaps with existing request',
  },
  {
    name: 'timesheet_submission_rules',
    description: 'Timesheet must meet submission requirements',
    validate: (data: any) => validateTimesheetSubmission(data).length === 0,
    errorMessage: 'Timesheet does not meet submission requirements',
  },
];

// Data sanitization functions
export const sanitizeUserInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const sanitizeDate = (date: string): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date format');
  }
  return d.toISOString().split('T')[0];
};

export const sanitizeTime = (time: string): string => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    throw new Error('Invalid time format');
  }
  return time;
};

export const sanitizeNumber = (value: any, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number => {
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error('Invalid number format');
  }
  if (num < min || num > max) {
    throw new Error(`Number must be between ${min} and ${max}`);
  }
  return num;
};

// Data validation functions
export const validateUserData = (userData: any): DataIntegrityCheck => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!userData.email) errors.push('Email is required');
  if (!userData.fullName) errors.push('Full name is required');
  if (!userData.province) errors.push('Province is required');
  if (!userData.role) errors.push('Role is required');

  // Email format
  if (userData.email && !userData.email.includes('@')) {
    errors.push('Invalid email format');
  }

  // Province validation
  if (userData.province && !validateCanadianProvince(userData.province)) {
    errors.push('Invalid Canadian province');
  }

  // Role validation
  const validRoles = ['EMPLOYEE', 'MANAGER', 'ADMIN'];
  if (userData.role && !validRoles.includes(userData.role)) {
    errors.push('Invalid role');
  }

  // Vacation balance validation
  if (userData.vacationBalance !== undefined) {
    if (userData.vacationBalance < 0) {
      errors.push('Vacation balance cannot be negative');
    }
    if (userData.vacationBalance > 365) {
      warnings.push('Vacation balance seems unusually high');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

export const validateTimesheetData = (timesheetData: any): DataIntegrityCheck => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!timesheetData.weekStarting) errors.push('Week starting date is required');
  if (!timesheetData.entries || timesheetData.entries.length === 0) {
    errors.push('At least one timesheet entry is required');
  }

  // Week starting validation
  if (timesheetData.weekStarting && !validateWeekStartingDate(timesheetData.weekStarting)) {
    errors.push('Week must start on a Monday');
  }

  // Entries validation
  if (timesheetData.entries) {
    let totalHours = 0;
    timesheetData.entries.forEach((entry: any, index: number) => {
      if (!entry.startTime || !entry.endTime) {
        errors.push(`Entry ${index + 1}: Start and end times are required`);
      } else if (!validateWorkHours(entry.startTime, entry.endTime, entry.breakMinutes || 0)) {
        errors.push(`Entry ${index + 1}: Invalid work hours`);
      } else {
        totalHours += entry.hoursWorked || 0;
      }
    });

    // Total hours validation
    if (totalHours > 168) {
      errors.push('Total hours cannot exceed 168 per week');
    }
    if (totalHours > 80) {
      warnings.push('Total hours seem unusually high');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

export const validateVacationRequestData = (requestData: any): DataIntegrityCheck => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!requestData.requestType) errors.push('Request type is required');
  if (!requestData.startDate) errors.push('Start date is required');
  if (!requestData.endDate) errors.push('End date is required');
  if (!requestData.reason) errors.push('Reason is required');

  // Date validation
  if (requestData.startDate && requestData.endDate) {
    const startDate = new Date(requestData.startDate);
    const endDate = new Date(requestData.endDate);
    
    if (startDate >= endDate) {
      errors.push('End date must be after start date');
    }
    
    if (startDate < new Date()) {
      errors.push('Start date cannot be in the past');
    }
  }

  // Request type validation
  const validTypes = ['VACATION', 'SICK', 'PERSONAL', 'BEREAVEMENT', 'MATERNITY', 'PATERNITY'];
  if (requestData.requestType && !validTypes.includes(requestData.requestType)) {
    errors.push('Invalid request type');
  }

  // Duration validation
  if (requestData.startDate && requestData.endDate) {
    const startDate = new Date(requestData.startDate);
    const endDate = new Date(requestData.endDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 30) {
      warnings.push('Vacation request is for more than 30 days');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

// Data transformation functions
export const transformTimesheetData = (data: any) => {
  return {
    ...data,
    weekStarting: sanitizeDate(data.weekStarting),
    entries: data.entries?.map((entry: any) => ({
      ...entry,
      workDate: sanitizeDate(entry.workDate),
      startTime: sanitizeTime(entry.startTime),
      endTime: sanitizeTime(entry.endTime),
      breakMinutes: sanitizeNumber(entry.breakMinutes, 0, 480),
      hoursWorked: sanitizeNumber(entry.hoursWorked, 0, 24),
      notes: entry.notes ? sanitizeUserInput(entry.notes) : '',
    })),
    totalHours: sanitizeNumber(data.totalHours, 0, 168),
  };
};

export const transformVacationRequestData = (data: any) => {
  return {
    ...data,
    requestType: data.requestType?.toUpperCase(),
    startDate: sanitizeDate(data.startDate),
    endDate: sanitizeDate(data.endDate),
    reason: sanitizeUserInput(data.reason),
  };
};

export const transformUserData = (data: any) => {
  return {
    ...data,
    email: sanitizeEmail(data.email),
    fullName: sanitizeUserInput(data.fullName),
    province: sanitizeUserInput(data.province),
    role: data.role?.toUpperCase(),
    vacationBalance: sanitizeNumber(data.vacationBalance, 0, 365),
  };
};

// Data consistency checks
export const checkDataConsistency = (data: any, type: 'user' | 'timesheet' | 'vacation'): DataIntegrityCheck => {
  const errors: string[] = [];
  const warnings: string[] = [];

  switch (type) {
    case 'user':
      return validateUserData(data);
    case 'timesheet':
      return validateTimesheetData(data);
    case 'vacation':
      return validateVacationRequestData(data);
    default:
      errors.push('Unknown data type');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

// Business rule validation
export const validateBusinessRules = (data: any, applicableRules: string[]): DataIntegrityCheck => {
  const errors: string[] = [];
  const warnings: string[] = [];

  applicableRules.forEach(ruleName => {
    const rule = businessRules.find(r => r.name === ruleName);
    if (rule && !rule.validate(data)) {
      errors.push(rule.errorMessage);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}; 