"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  FileText,
} from "lucide-react";
import VacationCalendar from "./VacationCalendar";
import VacationSummary from "./VacationSummary";
import VacationRequestForm from "./VacationRequestForm";

interface VacationRequest {
  id: string;
  employeeName: string;
  employeeEmail: string;
  startDate: string;
  endDate: string;
  type: string;
  status: "pending" | "approved" | "rejected";
  reason?: string;
  daysRequested: number;
  submittedDate: string;
  reviewedDate?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  vacationBalance: number;
  accruedDays: number;
  usedDays: number;
  province: string;
}

interface VacationManagementProps {
  currentUser?: Employee;
  isAdmin?: boolean;
  employees?: Employee[];
  vacationRequests?: VacationRequest[];
}

const VacationManagement = ({
  currentUser = {
    id: "emp-001",
    name: "John Doe",
    email: "john.doe@company.com",
    vacationBalance: 10,
    accruedDays: 15,
    usedDays: 5,
    province: "Ontario",
  },
  isAdmin = false,
  employees = [
    {
      id: "emp-001",
      name: "John Doe",
      email: "john.doe@company.com",
      vacationBalance: 10,
      accruedDays: 15,
      usedDays: 5,
      province: "Ontario",
    },
    {
      id: "emp-002",
      name: "Jane Smith",
      email: "jane.smith@company.com",
      vacationBalance: 8,
      accruedDays: 20,
      usedDays: 12,
      province: "Ontario",
    },
    {
      id: "emp-003",
      name: "Mike Johnson",
      email: "mike.johnson@company.com",
      vacationBalance: 15,
      accruedDays: 18,
      usedDays: 3,
      province: "British Columbia",
    },
  ],
  vacationRequests = [
    {
      id: "VR-001",
      employeeName: "John Doe",
      employeeEmail: "john.doe@company.com",
      startDate: "2024-02-15",
      endDate: "2024-02-16",
      type: "vacation",
      status: "approved",
      reason: "Family time",
      daysRequested: 2,
      submittedDate: "2024-02-01",
      reviewedDate: "2024-02-02",
      reviewedBy: "Admin",
    },
    {
      id: "VR-002",
      employeeName: "Jane Smith",
      employeeEmail: "jane.smith@company.com",
      startDate: "2024-02-20",
      endDate: "2024-02-23",
      type: "vacation",
      status: "pending",
      reason: "Winter break",
      daysRequested: 4,
      submittedDate: "2024-02-10",
    },
    {
      id: "VR-003",
      employeeName: "Mike Johnson",
      employeeEmail: "mike.johnson@company.com",
      startDate: "2024-03-01",
      endDate: "2024-03-01",
      type: "sick",
      status: "approved",
      daysRequested: 1,
      submittedDate: "2024-02-28",
      reviewedDate: "2024-02-28",
      reviewedBy: "Admin",
    },
  ],
}: VacationManagementProps) => {
  const [activeTab, setActiveTab] = useState("calendar");
  const [requests, setRequests] = useState(vacationRequests);

  const sendEmailNotification = (
    type: string,
    request: VacationRequest,
    additionalData?: any,
  ) => {
    console.log(`Sending ${type} email notification:`, {
      to: type === "new_request" ? "admin@company.com" : request.employeeEmail,
      subject:
        type === "new_request"
          ? `New Vacation Request from ${request.employeeName}`
          : `Vacation Request ${type === "approved" ? "Approved" : "Rejected"}`,
      request,
      ...additionalData,
    });

    // In a real application, this would integrate with an email service
    // like SendGrid, AWS SES, or similar
  };

  const calculateVacationDays = (
    startDate: string,
    endDate: string,
  ): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleRequestSubmit = (data: any) => {
    const newRequest: VacationRequest = {
      id: `VR-${Date.now()}`,
      employeeName: currentUser.name,
      employeeEmail: currentUser.email,
      startDate: data.startDate,
      endDate: data.endDate,
      type: data.type,
      status: "pending",
      reason: data.reason,
      daysRequested: calculateVacationDays(data.startDate, data.endDate),
      submittedDate: new Date().toISOString(),
    };

    setRequests([...requests, newRequest]);

    // Send email notification to administrators
    sendEmailNotification("new_request", newRequest);

    console.log("New vacation request submitted:", newRequest);
  };

  const handleRequestApprove = (id: string) => {
    const updatedRequests = requests.map((request) => {
      if (request.id === id) {
        const updatedRequest = {
          ...request,
          status: "approved" as const,
          reviewedDate: new Date().toISOString(),
          reviewedBy: "Admin",
        };

        // Send approval email to employee
        sendEmailNotification("approved", updatedRequest);

        return updatedRequest;
      }
      return request;
    });

    setRequests(updatedRequests);
    console.log("Request approved:", id);
  };

  const handleRequestReject = (id: string, reason: string) => {
    const updatedRequests = requests.map((request) => {
      if (request.id === id) {
        const updatedRequest = {
          ...request,
          status: "rejected" as const,
          reviewedDate: new Date().toISOString(),
          reviewedBy: "Admin",
          rejectionReason: reason,
        };

        // Send rejection email to employee
        sendEmailNotification("rejected", updatedRequest, {
          rejectionReason: reason,
        });

        return updatedRequest;
      }
      return request;
    });

    setRequests(updatedRequests);
    console.log("Request rejected:", id, reason);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const myRequests = requests.filter(
    (r) => r.employeeName === currentUser.name,
  );

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Vacation Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage time off requests and view team schedules
            </p>
          </div>
          {isAdmin && pendingRequests.length > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {pendingRequests.length} pending approval
              {pendingRequests.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger
              value="my-requests"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              My Requests
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Summary
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Admin Panel
                {pendingRequests.length > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {pendingRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="calendar">
            <VacationCalendar
              vacationRequests={requests}
              currentUser={currentUser.name}
              isAdmin={isAdmin}
              onRequestSubmit={handleRequestSubmit}
              onRequestApprove={handleRequestApprove}
              onRequestReject={handleRequestReject}
            />
          </TabsContent>

          <TabsContent value="my-requests">
            <Card>
              <CardHeader>
                <CardTitle>My Vacation Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dates</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          {new Date(request.startDate).toLocaleDateString()} -{" "}
                          {new Date(request.endDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="capitalize">
                          {request.type}
                        </TableCell>
                        <TableCell>{request.daysRequested}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(request.status)}
                            <Badge
                              variant={
                                request.status === "approved"
                                  ? "default"
                                  : request.status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {request.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(request.submittedDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{request.reason || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VacationSummary
                vacationBalance={currentUser.vacationBalance}
                accruedDays={currentUser.accruedDays}
                usedDays={currentUser.usedDays}
                province={currentUser.province}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Team Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {employees.map((employee) => (
                      <div
                        key={employee.id}
                        className="flex justify-between items-center p-3 border rounded"
                      >
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {employee.province}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {employee.vacationBalance} days left
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {employee.usedDays}/{employee.accruedDays} used
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Pending Approvals
                    {pendingRequests.length > 0 && (
                      <Badge variant="destructive">
                        {pendingRequests.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingRequests.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Dates</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Days</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>{request.employeeName}</TableCell>
                            <TableCell>
                              {new Date(request.startDate).toLocaleDateString()}{" "}
                              - {new Date(request.endDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="capitalize">
                              {request.type}
                            </TableCell>
                            <TableCell>{request.daysRequested}</TableCell>
                            <TableCell>{request.reason || "-"}</TableCell>
                            <TableCell>
                              {new Date(
                                request.submittedDate,
                              ).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleRequestApprove(request.id)
                                  }
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    handleRequestReject(
                                      request.id,
                                      "Rejected by administrator",
                                    )
                                  }
                                >
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No pending vacation requests
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default VacationManagement;
