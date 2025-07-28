"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, Clock, Save, Send, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTimesheets } from "@/hooks/useTimesheets";
import { useToast } from "@/hooks/useToast";
import { handleApiError, getUserFriendlyMessage, getErrorSuggestion } from "@/lib/error-handler";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface TimesheetFormProps {
  onSubmit?: (data: any) => void;
  onSuccess?: (timesheet: any) => void;
  onCancel?: () => void;
}

interface TimesheetEntry {
  workDate: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  hoursWorked: number;
  notes: string;
}

const TimesheetForm: React.FC<TimesheetFormProps> = ({
  onSubmit,
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth();
  const { createTimesheet, submitTimesheet, loading, error, clearError } = useTimesheets();
  const { success: showSuccess, error: showError, warning: showWarning } = useToast();
  
  const [weekStarting, setWeekStarting] = useState("");
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Generate week starting date (Monday of current week)
  useEffect(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so we need 6 days back
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday);
    
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const day = String(monday.getDate()).padStart(2, '0');
    
    setWeekStarting(`${year}-${month}-${day}`);
  }, []);

  // Generate entries for the week
  useEffect(() => {
    if (weekStarting) {
      const weekEntries: TimesheetEntry[] = [];
      const startDate = new Date(weekStarting);
      
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const dateString = currentDate.toISOString().split('T')[0];
        const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
        
        weekEntries.push({
          workDate: dateString,
          startTime: "",
          endTime: "",
          breakMinutes: 0,
          hoursWorked: 0,
          notes: "",
        });
      }
      
      setEntries(weekEntries);
    }
  }, [weekStarting]);

  const calculateHours = (startTime: string, endTime: string, breakMinutes: number): number => {
    if (!startTime || !endTime) return 0;
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const breakHours = breakMinutes / 60;
    
    return Math.max(0, diffHours - breakHours);
  };

  const updateEntry = (index: number, field: keyof TimesheetEntry, value: string | number) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    
    // Recalculate hours if start/end time changed
    if (field === 'startTime' || field === 'endTime' || field === 'breakMinutes') {
      const entry = newEntries[index];
      entry.hoursWorked = calculateHours(entry.startTime, entry.endTime, entry.breakMinutes);
    }
    
    setEntries(newEntries);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!weekStarting) {
      errors.weekStarting = "Week starting date is required";
    }
    
    let hasValidEntries = false;
    entries.forEach((entry, index) => {
      if (entry.startTime && entry.endTime) {
        hasValidEntries = true;
        
        const start = new Date(`2000-01-01T${entry.startTime}`);
        const end = new Date(`2000-01-01T${entry.endTime}`);
        
        if (end <= start) {
          errors[`entry-${index}-time`] = "End time must be after start time";
        }
        
        if (entry.hoursWorked > 24) {
          errors[`entry-${index}-hours`] = "Hours cannot exceed 24 per day";
        }
      }
    });
    
    if (!hasValidEntries) {
      errors.entries = "At least one day must have start and end times";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    clearError();
    
    if (!validateForm()) {
      showError("Please fix the validation errors", "Check the highlighted fields and try again.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const validEntries = entries.filter(entry => entry.startTime && entry.endTime);
      const totalHours = validEntries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
      
      const timesheetData = {
        weekStarting,
        entries: validEntries,
        totalHours,
      };
      
      const response = await createTimesheet(timesheetData);
      
      if (response.success && response.data) {
        showSuccess("Timesheet saved successfully", "Your timesheet has been saved as a draft.");
        onSubmit?.(response.data);
        onSuccess?.(response.data);
      } else {
        const appError = handleApiError(response, { action: 'create_timesheet', component: 'TimesheetForm' });
        showError(getUserFriendlyMessage(appError), getErrorSuggestion(appError));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      showError("Failed to save timesheet", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    clearError();
    
    if (!validateForm()) {
      showError("Please fix the validation errors", "Check the highlighted fields and try again.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const validEntries = entries.filter(entry => entry.startTime && entry.endTime);
      const totalHours = validEntries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
      
      const timesheetData = {
        weekStarting,
        entries: validEntries,
        totalHours,
      };
      
      const response = await createTimesheet(timesheetData);
      
      if (response.success && response.data) {
        // Submit the timesheet for approval
        const submitResponse = await submitTimesheet(response.data.id);
        
        if (submitResponse.success && submitResponse.data) {
          showSuccess("Timesheet submitted successfully", "Your timesheet has been submitted for approval.");
          onSubmit?.(submitResponse.data);
          onSuccess?.(submitResponse.data);
        } else {
          const appError = handleApiError(submitResponse, { action: 'submit_timesheet', component: 'TimesheetForm' });
          showError(getUserFriendlyMessage(appError), getErrorSuggestion(appError));
        }
      } else {
        const appError = handleApiError(response, { action: 'create_timesheet', component: 'TimesheetForm' });
        showError(getUserFriendlyMessage(appError), getErrorSuggestion(appError));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      showError("Failed to submit timesheet", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalHours = entries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
  const daysWithHours = entries.filter(entry => entry.hoursWorked > 0).length;

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Create Timesheet</h1>
            <p className="text-muted-foreground mt-1">
              Enter your work hours for the week starting {weekStarting ? new Date(weekStarting).toLocaleDateString() : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
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

        {/* Validation Errors */}
        {Object.keys(validationErrors).length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Please fix the following errors:
              <ul className="mt-2 list-disc list-inside">
                {Object.values(validationErrors).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Weekly Summary</span>
              <div className="flex items-center gap-4">
                <Badge variant="outline">
                  {daysWithHours} days
                </Badge>
                <Badge variant="secondary">
                  {totalHours.toFixed(1)} hours
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Week Starting:</span>
                <p className="text-muted-foreground">{weekStarting ? new Date(weekStarting).toLocaleDateString() : ''}</p>
              </div>
              <div>
                <span className="font-medium">Total Hours:</span>
                <p className="text-muted-foreground">{totalHours.toFixed(1)} hours</p>
              </div>
              <div>
                <span className="font-medium">Average Daily:</span>
                <p className="text-muted-foreground">
                  {daysWithHours > 0 ? (totalHours / daysWithHours).toFixed(1) : 0} hours
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timesheet Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {entries.map((entry, index) => {
                const dayName = new Date(entry.workDate).toLocaleDateString('en-US', { weekday: 'short' });
                const isWeekend = new Date(entry.workDate).getDay() === 0 || new Date(entry.workDate).getDay() === 6;
                
                return (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg ${
                      isWeekend ? 'bg-muted/50' : 'bg-background'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{dayName}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(entry.workDate).toLocaleDateString()}
                        </span>
                        {isWeekend && (
                          <Badge variant="outline" className="text-xs">Weekend</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{entry.hoursWorked.toFixed(1)}h</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <Label htmlFor={`start-${index}`}>Start Time</Label>
                        <Input
                          id={`start-${index}`}
                          type="time"
                          value={entry.startTime}
                          onChange={(e) => updateEntry(index, 'startTime', e.target.value)}
                          className={validationErrors[`entry-${index}-time`] ? 'border-red-500' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`end-${index}`}>End Time</Label>
                        <Input
                          id={`end-${index}`}
                          type="time"
                          value={entry.endTime}
                          onChange={(e) => updateEntry(index, 'endTime', e.target.value)}
                          className={validationErrors[`entry-${index}-time`] ? 'border-red-500' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`break-${index}`}>Break (min)</Label>
                        <Input
                          id={`break-${index}`}
                          type="number"
                          min="0"
                          max="480"
                          value={entry.breakMinutes}
                          onChange={(e) => updateEntry(index, 'breakMinutes', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`notes-${index}`}>Notes</Label>
                        <Textarea
                          id={`notes-${index}`}
                          value={entry.notes}
                          onChange={(e) => updateEntry(index, 'notes', e.target.value)}
                          placeholder="Optional notes..."
                          rows={1}
                        />
                      </div>
                    </div>
                    
                    {validationErrors[`entry-${index}-time`] && (
                      <p className="text-red-600 text-sm mt-1">{validationErrors[`entry-${index}-time`]}</p>
                    )}
                    {validationErrors[`entry-${index}-hours`] && (
                      <p className="text-red-600 text-sm mt-1">{validationErrors[`entry-${index}-hours`]}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting || loading}
            variant="outline"
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </>
            )}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || loading}
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit for Approval
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TimesheetForm;
