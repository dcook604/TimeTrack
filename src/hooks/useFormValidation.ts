import { useState, useCallback, useEffect } from 'react';
import { z, ZodSchema } from 'zod';
import { useToast } from './useToast';

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationState {
  errors: Record<string, string>;
  isValid: boolean;
  isDirty: boolean;
  touched: Record<string, boolean>;
}

interface UseFormValidationOptions {
  schema: ZodSchema;
  initialData?: any;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  showToastErrors?: boolean;
}

export function useFormValidation({
  schema,
  initialData = {},
  validateOnChange = true,
  validateOnBlur = true,
  showToastErrors = false,
}: UseFormValidationOptions) {
  const [data, setData] = useState(initialData);
  const [validationState, setValidationState] = useState<ValidationState>({
    errors: {},
    isValid: false,
    isDirty: false,
    touched: {},
  });
  const { error: showError } = useToast();

  // Validate data against schema
  const validate = useCallback((dataToValidate: any) => {
    try {
      schema.parse(dataToValidate);
      return { isValid: true, errors: {} };
    } catch (error: any) {
      const errors: Record<string, string> = {};
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach((err: any) => {
          const field = err.path?.join('.') || 'unknown';
          errors[field] = err.message || 'Validation failed';
        });
      } else {
        errors.general = 'Validation failed';
      }
      return { isValid: false, errors };
    }
  }, [schema]);

  // Update form data
  const updateField = useCallback((field: string, value: any) => {
    setData((prev: any) => {
      const newData = { ...prev };
      const fieldPath = field.split('.');
      let current: any = newData;
      
      for (let i = 0; i < fieldPath.length - 1; i++) {
        if (!current[fieldPath[i]]) {
          current[fieldPath[i]] = {};
        }
        current = current[fieldPath[i]];
      }
      
      current[fieldPath[fieldPath.length - 1]] = value;
      return newData;
    });

    setValidationState((prev: ValidationState) => ({
      ...prev,
      isDirty: true,
      touched: { ...prev.touched, [field]: true },
    }));
  }, []);

  // Update multiple fields
  const updateFields = useCallback((updates: Record<string, any>) => {
    setData((prev: any) => ({ ...prev, ...updates }));
    setValidationState((prev: ValidationState) => ({
      ...prev,
      isDirty: true,
      touched: { ...prev.touched, ...Object.keys(updates).reduce((acc, key) => ({ ...acc, [key]: true }), {}) },
    }));
  }, []);

  // Mark field as touched
  const touchField = useCallback((field: string) => {
    setValidationState((prev: ValidationState) => ({
      ...prev,
      touched: { ...prev.touched, [field]: true },
    }));
  }, []);

  // Mark multiple fields as touched
  const touchFields = useCallback((fields: string[]) => {
    setValidationState((prev: ValidationState) => ({
      ...prev,
      touched: { ...prev.touched, ...fields.reduce((acc, field) => ({ ...acc, [field]: true }), {}) },
    }));
  }, []);

  // Reset form
  const reset = useCallback((newData?: any) => {
    setData(newData || initialData);
    setValidationState({
      errors: {},
      isValid: false,
      isDirty: false,
      touched: {},
    });
  }, [initialData]);

  // Validate entire form
  const validateForm = useCallback(() => {
    const { isValid, errors } = validate(data);
    setValidationState((prev: ValidationState) => ({
      ...prev,
      isValid,
      errors,
    }));

    if (!isValid && showToastErrors) {
      const errorMessages = Object.values(errors);
      if (errorMessages.length > 0) {
        showError('Validation failed', errorMessages.join(', '));
      }
    }

    return { isValid, errors };
  }, [validate, data, showToastErrors, showError]);

  // Handle field change
  const handleFieldChange = useCallback((field: string, value: any) => {
    updateField(field, value);
    
    if (validateOnChange) {
      setTimeout(() => {
        const { errors } = validate(data);
        setValidationState((prev: ValidationState) => ({
          ...prev,
          errors: { ...prev.errors, [field]: errors[field] || '' },
        }));
      }, 100);
    }
  }, [updateField, validateOnChange, validate, data]);

  // Handle field blur
  const handleFieldBlur = useCallback((field: string) => {
    touchField(field);
    
    if (validateOnBlur) {
      const { errors } = validate(data);
      setValidationState((prev: ValidationState) => ({
        ...prev,
        errors: { ...prev.errors, [field]: errors[field] || '' },
      }));
    }
  }, [touchField, validateOnBlur, validate, data]);

  // Get field error
  const getFieldError = useCallback((field: string) => {
    return validationState.errors[field];
  }, [validationState.errors]);

  // Check if field is touched
  const isFieldTouched = useCallback((field: string) => {
    return validationState.touched[field] || false;
  }, [validationState.touched]);

  // Check if field has error
  const hasFieldError = useCallback((field: string) => {
    return !!validationState.errors[field];
  }, [validationState.errors]);

  // Get all errors
  const getAllErrors = useCallback(() => {
    return validationState.errors;
  }, [validationState.errors]);

  // Check if form is valid
  const isFormValid = useCallback(() => {
    return validationState.isValid;
  }, [validationState.isValid]);

  // Check if form is dirty
  const isFormDirty = useCallback(() => {
    return validationState.isDirty;
  }, [validationState.isDirty]);

  // Auto-validate on data change
  useEffect(() => {
    if (validationState.isDirty) {
      const { isValid, errors } = validate(data);
      setValidationState((prev: ValidationState) => ({
        ...prev,
        isValid,
        errors,
      }));
    }
  }, [data, validate, validationState.isDirty]);

  return {
    // Data
    data,
    setData,
    
    // Validation state
    validationState,
    errors: validationState.errors,
    isValid: validationState.isValid,
    isDirty: validationState.isDirty,
    touched: validationState.touched,
    
    // Actions
    updateField,
    updateFields,
    touchField,
    touchFields,
    reset,
    validateForm,
    
    // Event handlers
    handleFieldChange,
    handleFieldBlur,
    
    // Getters
    getFieldError,
    isFieldTouched,
    hasFieldError,
    getAllErrors,
    isFormValid,
    isFormDirty,
  };
} 