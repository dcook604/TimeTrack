"use client";

import React, { useState, useEffect } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  FileText,
  Calendar,
  TrendingUp,
  UserCheck,
  UserX,
} from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { useTimesheets } from "@/hooks/useTimesheets";
import { useVacationRequests } from "@/hooks/useVacationRequests";
import { Timesheet, VacationRequest } from "@/lib/api-client";

interface ManagerDashboardProps {
  isAdmin?: boolean;
}

const ManagerDashboard = ({ isAdmin = false }: ManagerDashboardProps) => {
  const { user } = useAuth();
  const { dashboardData, loading, error, getDashboard } = useDashboard();
  const { approveTimesheet } = useTimesheets();
  const { approveVacationRequest } = useVacationRequests();
  const [activeTab, setActiveTab] = useState("overview");
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  useEffect(() => {
    getDashboard();
  }, [getDashboard]);

  const handleTimesheetApprove = async (timesheetId: string, action: 'APPROVE' | 'REJECT', comments?: string) => {
    setProcessingAction(`timesheet-${timesheetId}-${action}`);
    try {
      await approveTimesheet(timesheetId, action, comments);
      await getDashboard(); // Refresh dashboard data
    } catch (error) {
      console.error('Error approving timesheet:', error);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleVacationApprove = async (requestId: string, action: 'APPROVE' | 'REJECT', comments?: string) => {
    setProcessingAction(`vacation-${requestId}-${action}`);
    try {
      await approveVacationRequest(requestId, action, comments);
      await getDashboard(); // Refresh dashboard data
    } catch (error) {
      console.error('Error approving vacation request:', error);
    } finally {
      setProcessingAction(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
      case "submitted":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "pending":
      case "submitted":
        return "secondary";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRequestTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'VACATION': 'Annual Vacation',
      'SICK': 'Sick Leave',
      'PERSONAL': 'Personal Day',
      'BEREAVEMENT': 'Bereavement Leave',
      'MATERNITY': 'Maternity Leave',
      'PATERNITY': 'Paternity Leave'
    };
    return typeMap[type] || type;
  };

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case 'VACATION':
        return 'bg-blue-100 text-blue-800';
      case 'SICK':
        return 'bg-red-100 text-red-800';
      case 'PERSONAL':
        return 'bg-purple-100 text-purple-800';
      case 'BEREAVEMENT':
        return 'bg-gray-100 text-gray-800';
      case 'MATERNITY':
      case 'PATERNITY':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="bg-background min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span>Loading manager dashboard...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Manager Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage team timesheets and vacation requests
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={getDashboard} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
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

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Timesheets</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData?.manager?.pendingTimesheetsForApproval || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting your approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Vacation Requests</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData?.manager?.pendingVacationsForApproval || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Time off requests to review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData?.admin?.usersByRole?.find((r: any) => r.role === 'EMPLOYEE')?._count || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Active employees
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours This Year</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData?.stats?.timesheets?.totalHours || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Team hours tracked
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
            <TabsTrigger value="vacations">Vacations</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Timesheets for Approval */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Recent Timesheets for Approval
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData?.manager?.recentTimesheetsForApproval?.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No pending timesheets
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {dashboardData?.manager?.recentTimesheetsForApproval?.slice(0, 5).map((timesheet: any) => (
                        <div key={timesheet.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{timesheet.user.profile.fullName}</p>
                            <p className="text-sm text-muted-foreground">
                              Week of {formatDate(timesheet.weekStarting)} • {timesheet.totalHours}h
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusVariant(timesheet.status)}>
                              {timesheet.status}
                            </Badge>
                            <Button
                              size="sm"
                              onClick={() => handleTimesheetApprove(timesheet.id, 'APPROVE')}
                              disabled={processingAction === `timesheet-${timesheet.id}-APPROVE`}
                            >
                              {processingAction === `timesheet-${timesheet.id}-APPROVE` ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleTimesheetApprove(timesheet.id, 'REJECT')}
                              disabled={processingAction === `timesheet-${timesheet.id}-REJECT`}
                            >
                              {processingAction === `timesheet-${timesheet.id}-REJECT` ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Vacation Requests for Approval */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recent Vacation Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData?.manager?.recentVacationsForApproval?.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No pending vacation requests
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {dashboardData?.manager?.recentVacationsForApproval?.slice(0, 5).map((request: any) => (
                        <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{request.user.profile.fullName}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(request.startDate)} - {formatDate(request.endDate)} • {request.daysRequested} days
                            </p>
                            <Badge className={`mt-1 ${getRequestTypeColor(request.requestType)}`}>
                              {getRequestTypeLabel(request.requestType)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusVariant(request.status)}>
                              {request.status}
                            </Badge>
                            <Button
                              size="sm"
                              onClick={() => handleVacationApprove(request.id, 'APPROVE')}
                              disabled={processingAction === `vacation-${request.id}-APPROVE`}
                            >
                              {processingAction === `vacation-${request.id}-APPROVE` ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleVacationApprove(request.id, 'REJECT')}
                              disabled={processingAction === `vacation-${request.id}-REJECT`}
                            >
                              {processingAction === `vacation-${request.id}-REJECT` ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timesheets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  All Timesheets for Approval
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData?.manager?.recentTimesheetsForApproval?.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No timesheets pending approval</h3>
                    <p className="text-muted-foreground">
                      All timesheets have been reviewed or there are no submissions.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Week</TableHead>
                          <TableHead>Hours</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboardData?.manager?.recentTimesheetsForApproval?.map((timesheet: any) => (
                          <TableRow key={timesheet.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{timesheet.user.profile.fullName}</div>
                                <div className="text-sm text-muted-foreground">{timesheet.user.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(timesheet.weekStarting)}</TableCell>
                            <TableCell>{timesheet.totalHours}h</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(timesheet.status)}
                                <Badge variant={getStatusVariant(timesheet.status)}>
                                  {timesheet.status}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(timesheet.submittedAt)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleTimesheetApprove(timesheet.id, 'APPROVE')}
                                  disabled={processingAction === `timesheet-${timesheet.id}-APPROVE`}
                                >
                                  {processingAction === `timesheet-${timesheet.id}-APPROVE` ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleTimesheetApprove(timesheet.id, 'REJECT')}
                                  disabled={processingAction === `timesheet-${timesheet.id}-REJECT`}
                                >
                                  {processingAction === `timesheet-${timesheet.id}-REJECT` ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vacations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  All Vacation Requests for Approval
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData?.manager?.recentVacationsForApproval?.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No vacation requests pending approval</h3>
                    <p className="text-muted-foreground">
                      All vacation requests have been reviewed or there are no submissions.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Dates</TableHead>
                          <TableHead>Days</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboardData?.manager?.recentVacationsForApproval?.map((request: any) => (
                          <TableRow key={request.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{request.user.profile.fullName}</div>
                                <div className="text-sm text-muted-foreground">{request.user.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getRequestTypeColor(request.requestType)}>
                                {getRequestTypeLabel(request.requestType)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatDate(request.startDate)} - {formatDate(request.endDate)}
                            </TableCell>
                            <TableCell>{request.daysRequested}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(request.status)}
                                <Badge variant={getStatusVariant(request.status)}>
                                  {request.status}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(request.submittedAt)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleVacationApprove(request.id, 'APPROVE')}
                                  disabled={processingAction === `vacation-${request.id}-APPROVE`}
                                >
                                  {processingAction === `vacation-${request.id}-APPROVE` ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleVacationApprove(request.id, 'REJECT')}
                                  disabled={processingAction === `vacation-${request.id}-REJECT`}
                                >
                                  {processingAction === `vacation-${request.id}-REJECT` ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* System Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      System Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Total Users</span>
                        <Badge variant="outline">{dashboardData?.admin?.totalUsers || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Total Timesheets</span>
                        <Badge variant="outline">{dashboardData?.admin?.totalTimesheets || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Total Vacation Requests</span>
                        <Badge variant="outline">{dashboardData?.admin?.totalVacationRequests || 0}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Users by Role */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Users by Role
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData?.admin?.usersByRole?.map((roleGroup: any) => (
                        <div key={roleGroup.role} className="flex justify-between items-center">
                          <span className="capitalize">{roleGroup.role.toLowerCase()}</span>
                          <Badge variant="outline">{roleGroup._count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default ManagerDashboard; 