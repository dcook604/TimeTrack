"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Calendar as CalendarIcon,
  Users,
  Filter,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import VacationRequestForm from "./VacationRequestForm";

interface VacationRequest {
  id: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  type: string;
  status: "pending" | "approved" | "rejected";
  reason?: string;
  daysRequested: number;
}

interface VacationCalendarProps {
  vacationRequests?: VacationRequest[];
  currentUser?: string;
  isAdmin?: boolean;
  onRequestSubmit?: (data: any) => void;
  onRequestApprove?: (id: string) => void;
  onRequestReject?: (id: string, reason: string) => void;
}

const VacationCalendar = ({
  vacationRequests = [
    {
      id: "VR-001",
      employeeName: "John Doe",
      startDate: "2024-02-15",
      endDate: "2024-02-16",
      type: "vacation",
      status: "approved",
      reason: "Family time",
      daysRequested: 2,
    },
    {
      id: "VR-002",
      employeeName: "Jane Smith",
      startDate: "2024-02-20",
      endDate: "2024-02-23",
      type: "vacation",
      status: "pending",
      reason: "Winter break",
      daysRequested: 4,
    },
    {
      id: "VR-003",
      employeeName: "Mike Johnson",
      startDate: "2024-03-01",
      endDate: "2024-03-01",
      type: "sick",
      status: "approved",
      daysRequested: 1,
    },
    {
      id: "VR-004",
      employeeName: "Sarah Wilson",
      startDate: "2024-03-15",
      endDate: "2024-03-22",
      type: "vacation",
      status: "rejected",
      reason: "Spring vacation",
      daysRequested: 8,
    },
  ],
  currentUser = "John Doe",
  isAdmin = false,
  onRequestSubmit,
  onRequestApprove,
  onRequestReject,
}: VacationCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterEmployee, setFilterEmployee] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] =
    useState<VacationRequest | null>(null);

  // Get unique employees for filter
  const employees = Array.from(
    new Set(vacationRequests.map((req) => req.employeeName)),
  );

  // Filter requests based on selected filters
  const filteredRequests = vacationRequests.filter((request) => {
    const statusMatch =
      filterStatus === "all" || request.status === filterStatus;
    const employeeMatch =
      filterEmployee === "all" || request.employeeName === filterEmployee;
    return statusMatch && employeeMatch;
  });

  // Get vacation dates for calendar highlighting
  const getVacationDates = () => {
    const dates: Date[] = [];
    filteredRequests.forEach((request) => {
      if (request.status === "approved") {
        const start = new Date(request.startDate);
        const end = new Date(request.endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          dates.push(new Date(d));
        }
      }
    });
    return dates;
  };

  const getRequestsForDate = (date: Date) => {
    return filteredRequests.filter((request) => {
      const start = new Date(request.startDate);
      const end = new Date(request.endDate);
      return date >= start && date <= end;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-3 w-3" />;
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "rejected":
        return <XCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const handleRequestSubmit = (data: any) => {
    // Send email notification to administrators
    console.log(
      "Sending email notification to administrators for new vacation request:",
      data,
    );
    onRequestSubmit?.(data);
    setShowRequestForm(false);
  };

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CalendarIcon className="h-8 w-8" />
              Vacation Calendar
            </h1>
            <p className="text-muted-foreground mt-1">
              View team vacation schedules and submit requests
            </p>
          </div>
          <Button
            onClick={() => setShowRequestForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Request Time Off
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Employee
                </label>
                <Select
                  value={filterEmployee}
                  onValueChange={setFilterEmployee}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee} value={employee}>
                        {employee}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Calendar View</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  modifiers={{
                    vacation: getVacationDates(),
                  }}
                  modifiersStyles={{
                    vacation: {
                      backgroundColor: "hsl(var(--primary))",
                      color: "hsl(var(--primary-foreground))",
                    },
                  }}
                  className="rounded-md border"
                />

                {/* Selected Date Details */}
                {selectedDate && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">
                      {selectedDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </h4>
                    {getRequestsForDate(selectedDate).length > 0 ? (
                      <div className="space-y-2">
                        {getRequestsForDate(selectedDate).map((request) => (
                          <div
                            key={request.id}
                            className={`p-2 rounded border ${getStatusColor(request.status)}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(request.status)}
                                <span className="font-medium">
                                  {request.employeeName}
                                </span>
                              </div>
                              <Badge variant="outline">{request.type}</Badge>
                            </div>
                            {request.reason && (
                              <p className="text-xs mt-1">{request.reason}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        No vacation requests for this date
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Requests List */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recent Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredRequests.slice(0, 10).map((request) => (
                    <div
                      key={request.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {request.employeeName}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {request.daysRequested}d
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(request.startDate).toLocaleDateString()} -{" "}
                            {new Date(request.endDate).toLocaleDateString()}
                          </p>
                          {request.reason && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {request.reason}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(request.status)}
                          <Badge
                            variant={
                              request.status === "approved"
                                ? "default"
                                : request.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="text-xs"
                          >
                            {request.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Request Form Modal */}
        {showRequestForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <VacationRequestForm
                onSubmit={handleRequestSubmit}
                onCancel={() => setShowRequestForm(false)}
              />
            </div>
          </div>
        )}

        {/* Request Details Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Vacation Request Details</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRequest(null)}
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Employee</label>
                    <p className="text-muted-foreground">
                      {selectedRequest.employeeName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Dates</label>
                    <p className="text-muted-foreground">
                      {new Date(selectedRequest.startDate).toLocaleDateString()}{" "}
                      - {new Date(selectedRequest.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Days Requested
                    </label>
                    <p className="text-muted-foreground">
                      {selectedRequest.daysRequested} days
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <p className="text-muted-foreground capitalize">
                      {selectedRequest.type}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedRequest.status)}
                      <Badge
                        variant={
                          selectedRequest.status === "approved"
                            ? "default"
                            : selectedRequest.status === "rejected"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {selectedRequest.status}
                      </Badge>
                    </div>
                  </div>
                  {selectedRequest.reason && (
                    <div>
                      <label className="text-sm font-medium">Reason</label>
                      <p className="text-muted-foreground">
                        {selectedRequest.reason}
                      </p>
                    </div>
                  )}

                  {isAdmin && selectedRequest.status === "pending" && (
                    <div className="flex gap-2 pt-4">
                      <Button
                        size="sm"
                        onClick={() => {
                          onRequestApprove?.(selectedRequest.id);
                          setSelectedRequest(null);
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          onRequestReject?.(
                            selectedRequest.id,
                            "Rejected by administrator",
                          );
                          setSelectedRequest(null);
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default VacationCalendar;
