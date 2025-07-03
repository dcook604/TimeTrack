"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, CalendarIcon, Clock, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TimesheetFormProps {
  onSubmit?: (data: any) => void;
  initialData?: any;
}

const TimesheetForm = ({ onSubmit, initialData }: TimesheetFormProps) => {
  const [formData, setFormData] = useState({
    weekStarting: initialData?.weekStarting || "2024-01-15",
    employee: initialData?.employee || "John Doe",
    province: initialData?.province || "Ontario",
    days: initialData?.days || [
      {
        date: "2024-01-15",
        startTime: "09:00",
        endTime: "17:00",
        breakMinutes: 60,
        hours: 7,
        notes: "",
      },
      {
        date: "2024-01-16",
        startTime: "09:00",
        endTime: "17:00",
        breakMinutes: 60,
        hours: 7,
        notes: "",
      },
      {
        date: "2024-01-17",
        startTime: "09:00",
        endTime: "17:00",
        breakMinutes: 60,
        hours: 7,
        notes: "",
      },
      {
        date: "2024-01-18",
        startTime: "09:00",
        endTime: "17:00",
        breakMinutes: 60,
        hours: 7,
        notes: "",
      },
      {
        date: "2024-01-19",
        startTime: "09:00",
        endTime: "17:00",
        breakMinutes: 60,
        hours: 7,
        notes: "",
      },
    ],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  const updateDay = (index: number, field: string, value: string | number) => {
    const newDays = [...formData.days];
    newDays[index] = { ...newDays[index], [field]: value };
    setFormData({ ...formData, days: newDays });
  };

  const totalHours = formData.days.reduce((sum, day) => sum + day.hours, 0);

  return (
    <div className="bg-background min-h-screen p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Clock className="h-6 w-6" />
              Weekly Timesheet
            </CardTitle>
            <Badge variant="outline">{formData.province}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="employee">Employee Name</Label>
                <Input
                  id="employee"
                  value={formData.employee}
                  onChange={(e) =>
                    setFormData({ ...formData, employee: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="weekStarting">Week Starting</Label>
                <Input
                  id="weekStarting"
                  type="date"
                  value={formData.weekStarting}
                  onChange={(e) =>
                    setFormData({ ...formData, weekStarting: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="province">Province</Label>
                <Select
                  value={formData.province}
                  onValueChange={(value) =>
                    setFormData({ ...formData, province: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ontario">Ontario</SelectItem>
                    <SelectItem value="Quebec">Quebec</SelectItem>
                    <SelectItem value="British Columbia">
                      British Columbia
                    </SelectItem>
                    <SelectItem value="Alberta">Alberta</SelectItem>
                    <SelectItem value="Manitoba">Manitoba</SelectItem>
                    <SelectItem value="Saskatchewan">Saskatchewan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Daily Hours</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Date</th>
                      <th className="text-left p-2 font-medium">Start Time</th>
                      <th className="text-left p-2 font-medium">End Time</th>
                      <th className="text-left p-2 font-medium">Break (min)</th>
                      <th className="text-left p-2 font-medium">Hours</th>
                      <th className="text-left p-2 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.days.map((day, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">
                          <div className="font-medium">
                            {new Date(day.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </td>
                        <td className="p-2">
                          <Input
                            type="time"
                            value={day.startTime}
                            onChange={(e) =>
                              updateDay(index, "startTime", e.target.value)
                            }
                            className="w-24"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="time"
                            value={day.endTime}
                            onChange={(e) =>
                              updateDay(index, "endTime", e.target.value)
                            }
                            className="w-24"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={day.breakMinutes}
                            onChange={(e) =>
                              updateDay(
                                index,
                                "breakMinutes",
                                parseInt(e.target.value) || 0,
                              )
                            }
                            className="w-20"
                            min="0"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={day.hours}
                            onChange={(e) =>
                              updateDay(
                                index,
                                "hours",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-20"
                            min="0"
                            step="0.5"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={day.notes}
                            onChange={(e) =>
                              updateDay(index, "notes", e.target.value)
                            }
                            placeholder="Optional notes"
                            className="min-w-32"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-semibold">
                      <td className="p-2" colSpan={4}>
                        Total Hours:
                      </td>
                      <td className="p-2">{totalHours}</td>
                      <td className="p-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline">
                Save Draft
              </Button>
              <Button type="submit" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Submit Timesheet
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimesheetForm;
