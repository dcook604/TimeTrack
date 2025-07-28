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
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  FileText,
  AlertCircle,
  RefreshCw,
  Plus,
  X,
} from "lucide-react";
import VacationCalendar from "./VacationCalendar";
import VacationSummary from "./VacationSummary";
import VacationRequestForm from "./VacationRequestForm";
import { useVacationRequests } from "@/hooks/useVacationRequests";
import { useAuth } from "@/contexts/AuthContext";
import { VacationRequest } from "@/lib/api-client";

interface VacationManagementProps {
  isAdmin?: boolean;
}

const VacationManagement = ({
  isAdmin = false,
}: VacationManagementProps) => {
  const { user } = useAuth();
  const { 
    vacationRequests, 
    loading, 
    error, 
    getVacationRequests, 
    approveVacationRequest,
    deleteVacationRequest,
    clearError 
  } = useVacationRequests();
  
  const [activeTab, setActiveTab] = useState("calendar");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VacationRequest | null>(null);

  useEffect(() => {
    // Load vacation requests when component mounts
    getVacationRequests();
  }, [getVacationRequests]);

  const handleRefresh = () => {
    clearError();
    getVacationRequests();
  };

  const handleRequestSubmit = (data: any) => {
    console.log("New vacation request submitted:", data);
    setShowRequestForm(false);
    // Refresh the list to show the new request
    getVacationRequests();
  };

  const handleRequestSuccess = (vacationRequest: any) => {
    console.log("Vacation request created successfully:", vacationRequest);
    setShowRequestForm(false);
    // Refresh the list to show the new request
    getVacationRequests();
  };

  const handleRequestApprove = async (id: string) => {
    try {
      const response = await approveVacationRequest(id, 'APPROVE');
      if (response.success) {
        console.log('Vacation request approved successfully');
      }
    } catch (error) {
      console.error('Error approving vacation request:', error);
    }
  };

  const handleRequestReject = async (id: string, reason: string) => {
    try {
      const response = await approveVacationRequest(id, 'REJECT', reason);
      if (response.success) {
        console.log('Vacation request rejected successfully');
      }
    } catch (error) {
      console.error('Error rejecting vacation request:', error);
    }
  };

  const handleRequestDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this vacation request?')) {
      try {
        const response = await deleteVacationRequest(id);
        if (response.success) {
          console.log('Vacation request deleted successfully');
        }
      } catch (error) {
        console.error('Error deleting vacation request:', error);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusVariant = (
    status: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "pending":
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

  if (loading && vacationRequests.length === 0) {
    return (
      <div className="bg-background min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span>Loading vacation requests...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showRequestForm) {
    return (
      <div className="bg-background min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Request Time Off</h1>
              <p className="text-muted-foreground mt-1">
                Submit a new vacation request.
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowRequestForm(false)}>
              Back to Vacation Management
            </Button>
          </div>
                      <VacationRequestForm
              onSuccess={handleRequestSuccess}
              onCancel={() => setShowRequestForm(false)}
            />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Vacation Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage vacation requests and time off.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleRefresh} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => setShowRequestForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Request
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Vacation Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VacationCalendar 
                  vacationRequests={vacationRequests?.map(request => ({
                    id: request.id,
                    employeeName: request.user?.profile?.fullName || 'Unknown',
                    startDate: request.startDate,
                    endDate: request.endDate,
                    type: request.requestType.toLowerCase(),
                    status: request.status.toLowerCase() as 'pending' | 'approved' | 'rejected',
                    reason: request.reason,
                    daysRequested: request.daysRequested
                  }))} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Vacation Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vacationRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No vacation requests found</h3>
                    <p className="text-muted-foreground">
                      You haven't submitted any vacation requests yet.
                    </p>
                    <Button 
                      onClick={() => setShowRequestForm(true)} 
                      className="mt-4"
                    >
                      Create Your First Request
                    </Button>
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
                        {vacationRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {request.user?.profile?.fullName || 'Unknown'}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {request.user?.email || 'No email'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getRequestTypeColor(request.requestType)}>
                                {getRequestTypeLabel(request.requestType)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {formatDate(request.startDate)} - {formatDate(request.endDate)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {request.daysRequested} days
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{request.daysRequested}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(request.status)}
                                <Badge variant={getStatusVariant(request.status)}>
                                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                </Badge>
                              </div>
                              {request.rejectionReason && (
                                <div className="text-sm text-red-600 mt-1">
                                  {request.rejectionReason}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {formatDate(request.submittedAt)}
                                </div>
                                {request.reviewedAt && (
                                  <div className="text-sm text-muted-foreground">
                                    Reviewed: {formatDate(request.reviewedAt)}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedRequest(request)}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                {request.status === 'PENDING' && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRequestApprove(request.id)}
                                      className="text-green-600 hover:text-green-700"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRequestReject(request.id, 'Rejected by manager')}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {request.status === 'PENDING' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRequestDelete(request.id)}
                                    className="text-gray-600 hover:text-gray-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
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

          <TabsContent value="summary" className="space-y-6">
            <VacationSummary />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VacationManagement;
