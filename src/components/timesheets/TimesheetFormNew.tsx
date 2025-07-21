"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Save, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TimesheetFormProps {
  onSubmit?: (data: any) => void;
  initialData?: any;
}

interface TimesheetEntry {
  date: string;
  hoursWorked: number;
  description: string;
}

const TimesheetFormNew = ({ onSubmit, initialData }: TimesheetFormProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Get current week ending date (Sunday)
  const getCurrentWeekEnding = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const weekEnding = new Date(today);
    weekEnding.setDate(today.getDate() + daysUntilSunday);
    return weekEnding.toISOString().split('T')[0];
  };

  // Generate week dates from Monday to Friday
  const generateWeekDates = (weekEndingDate: string) => {
    const weekEnding = new Date(weekEndingDate);
    const dates = [];
    
    // Start from Monday (6 days before Sunday)
    for (let i = 6; i >= 2; i--) {
      const date = new Date(weekEnding);
      date.setDate(weekEnding.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  const [formData, setFormData] = useState({
    weekEnding: initialData?.weekEnding || getCurrentWeekEnding(),
    entries: initialData?.entries || generateWeekDates(getCurrentWeekEnding()).map(date => ({
      date,
      hoursWorked: 0,
      description: ""
    }))
  });

  const handleWeekEndingChange = (weekEnding: string) => {
    const newEntries = generateWeekDates(weekEnding).map(date => {
      // Try to preserve existing data for the same dates
      const existingEntry = formData.entries.find((entry: TimesheetEntry) => entry.date === date);
      return existingEntry || {
        date,
        hoursWorked: 0,
        description: ""
      };
    });

    setFormData({
      weekEnding,
      entries: newEntries
    });
  };

  const updateEntry = (index: number, field: keyof TimesheetEntry, value: string | number) => {
    const newEntries = [...formData.entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setFormData({ ...formData, entries: newEntries });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Filter out entries with 0 hours
      const validEntries = formData.entries.filter((entry: TimesheetEntry) => entry.hoursWorked > 0);
      
      if (validEntries.length === 0) {
        setError("Please add at least one entry with hours worked.");
        setLoading(false);
        return;
      }

      const response = await apiClient.createTimesheet({
        weekEnding: formData.weekEnding,
        entries: validEntries
      });

      if (response.success) {
        setSuccess("Timesheet created successfully!");
        onSubmit?.(response.data);
        
        // Reset form
        setFormData({
          weekEnding: getCurrentWeekEnding(),
          entries: generateWeekDates(getCurrentWeekEnding()).map(date => ({
            date,
            hoursWorked: 0,
            description: ""
          }))
        });
      } else {
        setError(response.error || "Failed to create timesheet");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const totalHours = formData.entries.reduce((sum: number, entry: TimesheetEntry) => sum + entry.hoursWorked, 0);

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-background min-h-screen p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Clock className="h-6 w-6" />
              Weekly Timesheet
            </CardTitle>
            <Badge variant="outline">{user?.profile?.province}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="employee">Employee Name</Label>
                <Input
                  id="employee"
                  value={user?.profile?.fullName || ""}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="weekEnding">Week Ending (Sunday)</Label>
                <Input
                  id="weekEnding"
                  type="date"
                  value={formData.weekEnding}
                  onChange={(e) => handleWeekEndingChange(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="province">Province</Label>
                <Input
                  id="province"
                  value={user?.profile?.province || ""}
                  disabled
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Daily Hours</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Date</th>
                      <th className="text-left p-2 font-medium">Hours Worked</th>
                      <th className="text-left p-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.entries.map((entry: TimesheetEntry, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">
                          <div className="font-medium">
                            {getDayName(entry.date)}
                          </div>
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={entry.hoursWorked}
                            onChange={(e) =>
                              updateEntry(index, "hoursWorked", parseFloat(e.target.value) || 0)
                            }
                            className="w-24"
                            min="0"
                            max="24"
                            step="0.25"
                            disabled={loading}
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={entry.description}
                            onChange={(e) =>
                              updateEntry(index, "description", e.target.value)
                            }
                            placeholder="Work description"
                            className="min-w-48"
                            disabled={loading}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-semibold">
                      <td className="p-2">Total Hours:</td>
                      <td className="p-2">{totalHours}</td>
                      <td className="p-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button 
                type="submit" 
                className="flex items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Create Timesheet
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimesheetFormNew;