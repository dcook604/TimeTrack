import { z } from 'zod';

// Base validation schemas
export const emailSchema = z.string().email('Please enter a valid email address');
export const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
export const nameSchema = z.string().min(1, 'Name is required').max(100, 'Name is too long');
export const provinceSchema = z.string().min(1, 'Province is required');

// Date validation helpers
export const isValidDate = (date: string) => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

export const isFutureDate = (date: string) => {
  return new Date(date) > new Date();
};

export const isPastDate = (date: string) => {
  return new Date(date) < new Date();
};

export const isValidDateRange = (startDate: string, endDate: string) => {
  return new Date(endDate) >= new Date(startDate);
};

// Time validation helpers
export const isValidTime = (time: string) => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

export const isValidTimeRange = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return false;
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  return end > start;
};

// Timesheet validation schemas
export const timesheetEntrySchema = z.object({
  workDate: z.string().refine(isValidDate, 'Invalid date format'),
  startTime: z.string().refine(isValidTime, 'Invalid time format'),
  endTime: z.string().refine(isValidTime, 'Invalid time format'),
  breakMinutes: z.number().min(0, 'Break minutes cannot be negative').max(480, 'Break cannot exceed 8 hours'),
  hoursWorked: z.number().min(0, 'Hours cannot be negative').max(24, 'Hours cannot exceed 24 per day'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
}).refine((data) => isValidTimeRange(data.startTime, data.endTime), {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export const createTimesheetSchema = z.object({
  weekStarting: z.string().refine(isValidDate, 'Invalid week starting date'),
  entries: z.array(timesheetEntrySchema).min(1, 'At least one entry is required'),
  totalHours: z.number().min(0, 'Total hours cannot be negative').max(168, 'Total hours cannot exceed 168 per week'),
});

export const submitTimesheetSchema = z.object({
  timesheetId: z.string().uuid('Invalid timesheet ID'),
});

export const approveTimesheetSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  approverComments: z.string().max(1000, 'Comments cannot exceed 1000 characters').optional(),
});

// Vacation request validation schemas
export const vacationRequestSchema = z.object({
  requestType: z.enum(['VACATION', 'SICK', 'PERSONAL', 'BEREAVEMENT', 'MATERNITY', 'PATERNITY']),
  startDate: z.string().refine(isValidDate, 'Invalid start date'),
  endDate: z.string().refine(isValidDate, 'Invalid end date'),
  reason: z.string().min(1, 'Reason is required').max(1000, 'Reason cannot exceed 1000 characters'),
}).refine((data) => isValidDateRange(data.startDate, data.endDate), {
  message: 'End date must be after or equal to start date',
  path: ['endDate'],
}).refine((data) => !isPastDate(data.startDate), {
  message: 'Start date cannot be in the past',
  path: ['startDate'],
});

export const approveVacationRequestSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  reviewComments: z.string().max(1000, 'Comments cannot exceed 1000 characters').optional(),
});

// User management validation schemas
export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: nameSchema,
  province: provinceSchema,
  role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN']),
  vacationBalance: z.number().min(0, 'Vacation balance cannot be negative').max(365, 'Vacation balance cannot exceed 365 days'),
});

export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  fullName: nameSchema.optional(),
  province: provinceSchema.optional(),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN']).optional(),
  vacationBalance: z.number().min(0, 'Vacation balance cannot be negative').max(365, 'Vacation balance cannot exceed 365 days').optional(),
});

// Profile validation schemas
export const updateProfileSchema = z.object({
  fullName: nameSchema.optional(),
  province: provinceSchema.optional(),
  preferences: z.object({
    emailNotifications: z.boolean().optional(),
    timeFormat: z.enum(['12h', '24h']).optional(),
    theme: z.enum(['light', 'dark']).optional(),
  }).optional(),
});

// Authentication validation schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  fullName: nameSchema,
  province: provinceSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Business logic validation helpers
export const validateVacationBalance = (requestedDays: number, availableBalance: number) => {
  return requestedDays <= availableBalance;
};

export const validateOverlappingDates = (startDate: string, endDate: string, existingRequests: any[]) => {
  const requestStart = new Date(startDate);
  const requestEnd = new Date(endDate);
  
  return !existingRequests.some(request => {
    const existingStart = new Date(request.startDate);
    const existingEnd = new Date(request.endDate);
    
    return (
      (requestStart >= existingStart && requestStart <= existingEnd) ||
      (requestEnd >= existingStart && requestEnd <= existingEnd) ||
      (requestStart <= existingStart && requestEnd >= existingEnd)
    );
  });
};

export const validateTimesheetSubmission = (timesheet: any) => {
  const errors: string[] = [];
  
  if (timesheet.status !== 'DRAFT') {
    errors.push('Only draft timesheets can be submitted');
  }
  
  if (!timesheet.entries || timesheet.entries.length === 0) {
    errors.push('Timesheet must have at least one entry');
  }
  
  const totalHours = timesheet.entries.reduce((sum: number, entry: any) => sum + entry.hoursWorked, 0);
  if (totalHours <= 0) {
    errors.push('Timesheet must have at least some hours worked');
  }
  
  return errors;
};

// Custom validation functions
export const validateCanadianProvince = (province: string) => {
  const validProvinces = [
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
    'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia',
    'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec',
    'Saskatchewan', 'Yukon'
  ];
  
  return validProvinces.includes(province);
};

export const validateWorkHours = (startTime: string, endTime: string, breakMinutes: number) => {
  if (!startTime || !endTime) return false;
  
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  const diffMs = end.getTime() - start.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const breakHours = breakMinutes / 60;
  
  const actualHours = diffHours - breakHours;
  return actualHours >= 0 && actualHours <= 24;
};

export const validateWeekStartingDate = (date: string) => {
  const selectedDate = new Date(date);
  const dayOfWeek = selectedDate.getDay();
  
  // Check if it's a Monday (1)
  return dayOfWeek === 1;
};

// Export all schemas
export const validationSchemas = {
  timesheetEntry: timesheetEntrySchema,
  createTimesheet: createTimesheetSchema,
  submitTimesheet: submitTimesheetSchema,
  approveTimesheet: approveTimesheetSchema,
  vacationRequest: vacationRequestSchema,
  approveVacationRequest: approveVacationRequestSchema,
  createUser: createUserSchema,
  updateUser: updateUserSchema,
  updateProfile: updateProfileSchema,
  login: loginSchema,
  register: registerSchema,
}; 