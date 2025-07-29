import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  validateUserData, 
  validateTimesheetData, 
  validateVacationRequestData,
  transformUserData,
  transformTimesheetData,
  transformVacationRequestData,
  sanitizeUserInput,
  sanitizeEmail,
  sanitizeDate,
  sanitizeTime,
  sanitizeNumber,
  validateBusinessRules
} from '@/lib/data-integrity';
import { 
  createUserSchema, 
  updateUserSchema, 
  createTimesheetSchema, 
  vacationRequestSchema,
  updateProfileSchema
} from '@/lib/validation-schemas';

export interface ValidationMiddlewareOptions {
  schema: z.ZodSchema;
  transformData?: (data: any) => any;
  validateBusinessRules?: boolean;
}

export function createValidationMiddleware(options: ValidationMiddlewareOptions) {
  return async (request: NextRequest) => {
    try {
      const body = await request.json();
      
      // Sanitize input data
      const sanitizedData = sanitizeInputData(body);
      
      // Validate against schema
      const validatedData = options.schema.parse(sanitizedData);
      
      // Transform data if needed
      let transformedData = validatedData;
      if (options.transformData) {
        transformedData = options.transformData(validatedData);
      }
      
      // Additional business rule validation
      if (options.validateBusinessRules) {
        const businessRuleCheck = validateBusinessRules(validatedData, []);
        if (!businessRuleCheck.isValid) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Business rule validation failed',
              details: businessRuleCheck.errors 
            },
            { status: 400 }
          );
        }
      }
      
      // Add validated data to request
      (request as any).validatedData = transformedData;
      
      return NextResponse.next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'Validation failed',
            details: errors 
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data' 
        },
        { status: 400 }
      );
    }
  };
}

// Sanitize input data
function sanitizeInputData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Apply specific sanitization based on field name
      if (key.toLowerCase().includes('email')) {
        sanitized[key] = sanitizeEmail(value);
      } else if (key.toLowerCase().includes('date')) {
        try {
          sanitized[key] = sanitizeDate(value);
        } catch {
          sanitized[key] = value; // Keep original if sanitization fails
        }
      } else if (key.toLowerCase().includes('time')) {
        try {
          sanitized[key] = sanitizeTime(value);
        } catch {
          sanitized[key] = value; // Keep original if sanitization fails
        }
      } else {
        sanitized[key] = sanitizeUserInput(value);
      }
    } else if (typeof value === 'number') {
      sanitized[key] = sanitizeNumber(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => sanitizeInputData(item));
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeInputData(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// Predefined validation middlewares
export const validateCreateUser = createValidationMiddleware({
  schema: createUserSchema,
  transformData: transformUserData,
  validateBusinessRules: true,
});

export const validateUpdateUser = createValidationMiddleware({
  schema: updateUserSchema,
  transformData: transformUserData,
  validateBusinessRules: true,
});

export const validateCreateTimesheet = createValidationMiddleware({
  schema: createTimesheetSchema,
  transformData: transformTimesheetData,
  validateBusinessRules: true,
});

export const validateVacationRequest = createValidationMiddleware({
  schema: vacationRequestSchema,
  transformData: transformVacationRequestData,
  validateBusinessRules: true,
});

export const validateUpdateProfile = createValidationMiddleware({
  schema: updateProfileSchema,
  validateBusinessRules: false,
});

// Helper function to get validated data from request
export function getValidatedData(request: NextRequest): any {
  return (request as any).validatedData;
} 