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
import { Calendar, Send, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VacationRequestFormProps {
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
  availableDays?: number;
}

const VacationRequestForm = ({
  onSubmit,
  onCancel,
  availableDays = 10,
}: VacationRequestFormProps) => {
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    type: "vacation",
    reason: "",
    notes: "",
  });

  const [calculatedDays, setCalculatedDays] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({
      ...formData,
      daysRequested: calculatedDays,
      submittedDate: new Date().toISOString(),
      status: "pending",
    });
  };

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setCalculatedDays(diffDays);
    }
  };

  React.useEffect(() => {
    calculateDays();
  }, [formData.startDate, formData.endDate]);

  const vacationTypes = [
    { value: "vacation", label: "Annual Vacation" },
    { value: "personal", label: "Personal Day" },
    { value: "sick", label: "Sick Leave" },
    { value: "emergency", label: "Emergency Leave" },
    { value: "bereavement", label: "Bereavement Leave" },
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Request Time Off
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{availableDays} days available</Badge>
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="type">Type of Leave</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {vacationTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Input
              id="reason"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              placeholder="Brief reason for time off"
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Any additional information for your manager"
              rows={3}
            />
          </div>

          {calculatedDays > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">
                    Days Requested: {calculatedDays}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Remaining after approval: {availableDays - calculatedDays}{" "}
                    days
                  </p>
                </div>
                {calculatedDays > availableDays && (
                  <Badge variant="destructive">Exceeds available days</Badge>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              className="flex items-center gap-2"
              disabled={calculatedDays > availableDays || calculatedDays === 0}
            >
              <Send className="h-4 w-4" />
              Submit Request
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default VacationRequestForm;
