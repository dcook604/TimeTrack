"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Calendar, Clock, User, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useVacationRequests } from "@/hooks/useVacationRequests";
import { useToast } from "@/hooks/useToast";
import { useFormValidation } from "@/hooks/useFormValidation";
import { vacationRequestSchema } from "@/lib/validation-schemas";
import { validateVacationRequestData, transformVacationRequestData } from "@/lib/data-integrity";
import FormField from "@/components/ui/FormField";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface VacationRequestFormProps {
  onSuccess?: (request: any) => void;
  onCancel?: () => void;
}

const VacationRequestForm: React.FC<VacationRequestFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth();
  const { createVacationRequest, loading, error, clearError } = useVacationRequests();
  const { success: showSuccess, error: showError, warning: showWarning } = useToast();

  const {
    data,
    errors,
    isValid,
    isDirty,
    touched,
    updateField,
    touchField,
    validateForm,
    handleFieldChange,
    handleFieldBlur,
    getFieldError,
    isFieldTouched,
    hasFieldError,
    reset,
  } = useFormValidation({
    schema: vacationRequestSchema,
    initialData: {
      requestType: 'VACATION',
      startDate: '',
      endDate: '',
      reason: '',
    },
    validateOnChange: true,
    validateOnBlur: true,
    showToastErrors: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataIntegrityErrors, setDataIntegrityErrors] = useState<string[]>([]);
  const [dataIntegrityWarnings, setDataIntegrityWarnings] = useState<string[]>([]);

  // Calculate days requested
  const calculateDaysRequested = () => {
    if (!data.startDate || !data.endDate) return 0;
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysDiff + 1); // Include both start and end dates
  };

  const daysRequested = calculateDaysRequested();
  const availableBalance = user?.profile?.vacationBalance || 0;

  // Validate data integrity
  useEffect(() => {
    if (isDirty) {
      const integrityCheck = validateVacationRequestData(data);
      setDataIntegrityErrors(integrityCheck.errors);
      setDataIntegrityWarnings(integrityCheck.warnings);
    }
  }, [data, isDirty]);

  // Show warnings as toast notifications
  useEffect(() => {
    dataIntegrityWarnings.forEach(warning => {
      showWarning('Warning', warning);
    });
  }, [dataIntegrityWarnings, showWarning]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Validate form
    const { isValid: formValid, errors: formErrors } = validateForm();
    
    if (!formValid) {
      showError('Please fix the validation errors', Object.values(formErrors).join(', '));
      return;
    }

    // Check data integrity
    if (dataIntegrityErrors.length > 0) {
      showError('Data validation failed', dataIntegrityErrors.join(', '));
      return;
    }

    // Check vacation balance
    if (daysRequested > availableBalance) {
      showError('Insufficient vacation balance', `You have ${availableBalance} days available, but requested ${daysRequested} days.`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Transform and sanitize data
      const transformedData = transformVacationRequestData({
        ...data,
        daysRequested,
        availableBalance,
      });

      const response = await createVacationRequest(transformedData);

      if (response.success && response.data) {
        showSuccess('Vacation request submitted successfully', 'Your request has been submitted for approval.');
        onSuccess?.(response.data);
        reset();
      } else {
        const errorMessage = response.error || 'Failed to submit vacation request';
        showError('Submission failed', errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      showError('Submission failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      if (confirm('Are you sure you want to cancel? Your changes will be lost.')) {
        reset();
        onCancel?.();
      }
    } else {
      onCancel?.();
    }
  };

  const requestTypeOptions = [
    { value: 'VACATION', label: 'Vacation' },
    { value: 'SICK', label: 'Sick Leave' },
    { value: 'PERSONAL', label: 'Personal Leave' },
    { value: 'BEREAVEMENT', label: 'Bereavement' },
    { value: 'MATERNITY', label: 'Maternity Leave' },
    { value: 'PATERNITY', label: 'Paternity Leave' },
  ];

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case 'VACATION': return 'bg-blue-100 text-blue-800';
      case 'SICK': return 'bg-red-100 text-red-800';
      case 'PERSONAL': return 'bg-purple-100 text-purple-800';
      case 'BEREAVEMENT': return 'bg-gray-100 text-gray-800';
      case 'MATERNITY': return 'bg-pink-100 text-pink-800';
      case 'PATERNITY': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Request Vacation</h1>
            <p className="text-muted-foreground mt-1">
              Submit a vacation request for approval
            </p>
          </div>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Data Integrity Errors */}
        {dataIntegrityErrors.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <ul className="list-disc list-inside space-y-1">
                {dataIntegrityErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Employee Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                  <label className="text-sm font-medium">Employee</label>
                  <p className="text-muted-foreground">{user?.profile?.fullName || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Available Balance</label>
                  <p className="text-muted-foreground">{availableBalance} days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Request Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Request Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Request Type"
                name="requestType"
                type="select"
                value={data.requestType}
                onChange={(value) => handleFieldChange('requestType', value)}
                onBlur={() => handleFieldBlur('requestType')}
                required
                error={getFieldError('requestType')}
                touched={isFieldTouched('requestType')}
                options={requestTypeOptions}
                helpText="Select the type of leave you are requesting"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Start Date"
                  name="startDate"
                  type="date"
                  value={data.startDate}
                  onChange={(value) => handleFieldChange('startDate', value)}
                  onBlur={() => handleFieldBlur('startDate')}
                  required
                  error={getFieldError('startDate')}
                  touched={isFieldTouched('startDate')}
                  helpText="Select the first day of your leave"
                />

                <FormField
                  label="End Date"
                  name="endDate"
                  type="date"
                  value={data.endDate}
                  onChange={(value) => handleFieldChange('endDate', value)}
                  onBlur={() => handleFieldBlur('endDate')}
                  required
                  error={getFieldError('endDate')}
                  touched={isFieldTouched('endDate')}
                  helpText="Select the last day of your leave"
              />
            </div>

              <FormField
                label="Reason"
                name="reason"
                type="textarea"
                value={data.reason}
                onChange={(value) => handleFieldChange('reason', value)}
                onBlur={() => handleFieldBlur('reason')}
                required
                error={getFieldError('reason')}
                touched={isFieldTouched('reason')}
                placeholder="Please provide a detailed reason for your request..."
                rows={4}
                helpText="Provide a clear explanation for your leave request"
              />
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Request Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{daysRequested}</div>
                  <div className="text-sm text-muted-foreground">Days Requested</div>
          </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{availableBalance}</div>
                  <div className="text-sm text-muted-foreground">Available Balance</div>
          </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{availableBalance - daysRequested}</div>
                  <div className="text-sm text-muted-foreground">Remaining After</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="font-medium">Request Type:</span>
                <Badge className={getRequestTypeColor(data.requestType)}>
                  {requestTypeOptions.find(opt => opt.value === data.requestType)?.label}
                </Badge>
            </div>

              {daysRequested > availableBalance && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    You are requesting more days than your available balance.
                  </AlertDescription>
                </Alert>
              )}

              {daysRequested > 0 && daysRequested <= availableBalance && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Your request is within your available balance.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            <Button
              type="submit"
              disabled={isSubmitting || loading || !isValid || daysRequested > availableBalance}
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
              Submit Request
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VacationRequestForm;
