"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Plane,
} from "lucide-react";

interface VacationManagementProps {
  isAdmin?: boolean;
}

const VacationManagementNew = ({ isAdmin = false }: VacationManagementProps) => {
  const { user, hasRole } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });

  // New request dialog state
  const [newRequestDialog, setNewRequestDialog] = useState({
    open: false,
    loading: false,
    formData: {
      startDate: "",
      endDate: "",
      requestType: "VACATION" as const,
      reason: ""
    }
  });

  // Approval dialog state
  const [approvalDialog, setApprovalDialog] = useState({
    open: false,
    request: null as any,
    action: "" as "APPROVE" | "REJECT",
    comments: "",
    loading: false
  });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (statusFilter !== "all") {
        params.status = statusFilter.toUpperCase();
      }

      const response = await apiClient.getVacationRequests(params);
      if (response.success) {
        setRequests(Array.isArray(response.data) ? response.data : []);
        setPagination(response.pagination || { total: 0, pages: 0 });
      } else {
        setError(response.error || "Failed to fetch vacation requests");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter]);

  const handleCreateRequest = async () => {
    setNewRequestDialog(prev => ({ ...prev, loading: true }));
    setError("");

    try {
      const response = await apiClient.createVacationRequest(newRequestDialog.formData);
      if (response.success) {
        setNewRequestDialog({
          open: false,
          loading: false,
          formData: {
            startDate: "",
            endDate: "",
            requestType: "VACATION",
            reason: ""
          }
        });
        fetchRequests(); // Refresh the list
      } else {
        setError(response.error || "Failed to create vacation request");
        setNewRequestDialog(prev => ({ ...prev, loading: false }));
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setNewRequestDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleApproval = async () => {
    if (!approvalDialog.request) return;

    setApprovalDialog(prev => ({ ...prev, loading: true }));

    try {
      const response = await apiClient.approveVacationRequest(
        approvalDialog.request.id,
        approvalDialog.action,
        approvalDialog.comments
      );

      if (response.success) {
        setApprovalDialog({
          open: false,
          request: null,
          action: "" as any,
          comments: "",
          loading: false
        });
        fetchRequests(); // Refresh the list
      } else {
        setError(response.error || "Failed to process approval");
        setApprovalDialog(prev => ({ ...prev, loading: false }));
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setApprovalDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const openApprovalDialog = (request: any, action: "APPROVE" | "REJECT") => {
    setApprovalDialog({
      open: true,
      request,
      action,
      comments: "",
      loading: false
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { variant: "default" as const, icon: Clock, color: "text-yellow-600" },
      APPROVED: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      REJECTED: { variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getRequestTypeBadge = (type: string) => {
    const typeConfig = {
      VACATION: { color: "bg-blue-100 text-blue-800" },
      SICK: { color: "bg-red-100 text-red-800" },
      PERSONAL: { color: "bg-purple-100 text-purple-800" },
      BEREAVEMENT: { color: "bg-gray-100 text-gray-800" },
      MATERNITY: { color: "bg-pink-100 text-pink-800" },
      PATERNITY: { color: "bg-green-100 text-green-800" },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.VACATION;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {type}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  if (loading && requests.length === 0) {
    return (
      <div className="bg-background min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
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
          <div className="flex items-center gap-4">
            {user?.profile?.vacationBalance !== undefined && (
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Vacation Balance</div>
                <div className="text-2xl font-bold text-green-600">
                  {user.profile.vacationBalance} days
                </div>
              </div>
            )}
            <Dialog 
              open={newRequestDialog.open} 
              onOpenChange={(open) => setNewRequestDialog(prev => ({ ...prev, open }))}
            >
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Request
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Vacation Request</DialogTitle>
                  <DialogDescription>
                    Submit a new vacation or time off request.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={newRequestDialog.formData.startDate}
                        onChange={(e) => setNewRequestDialog(prev => ({
                          ...prev,
                          formData: { ...prev.formData, startDate: e.target.value }
                        }))}
                        disabled={newRequestDialog.loading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={newRequestDialog.formData.endDate}
                        onChange={(e) => setNewRequestDialog(prev => ({
                          ...prev,
                          formData: { ...prev.formData, endDate: e.target.value }
                        }))}
                        disabled={newRequestDialog.loading}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="requestType">Request Type</Label>
                    <Select
                      value={newRequestDialog.formData.requestType}
                      onValueChange={(value: any) => setNewRequestDialog(prev => ({
                        ...prev,
                        formData: { ...prev.formData, requestType: value }
                      }))}
                      disabled={newRequestDialog.loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VACATION">Vacation</SelectItem>
                        <SelectItem value="SICK">Sick Leave</SelectItem>
                        <SelectItem value="PERSONAL">Personal Time</SelectItem>
                        <SelectItem value="BEREAVEMENT">Bereavement</SelectItem>
                        <SelectItem value="MATERNITY">Maternity Leave</SelectItem>
                        <SelectItem value="PATERNITY">Paternity Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="reason">Reason (Optional)</Label>
                    <Textarea
                      id="reason"
                      value={newRequestDialog.formData.reason}
                      onChange={(e) => setNewRequestDialog(prev => ({
                        ...prev,
                        formData: { ...prev.formData, reason: e.target.value }
                      }))}
                      placeholder="Optional reason for your request..."
                      disabled={newRequestDialog.loading}
                    />
                  </div>

                  {newRequestDialog.formData.startDate && newRequestDialog.formData.endDate && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm font-medium">
                        Days Requested: {calculateDays(newRequestDialog.formData.startDate, newRequestDialog.formData.endDate)}
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setNewRequestDialog(prev => ({ ...prev, open: false }))}
                    disabled={newRequestDialog.loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateRequest}
                    disabled={newRequestDialog.loading || !newRequestDialog.formData.startDate || !newRequestDialog.formData.endDate}
                  >
                    {newRequestDialog.loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Request"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Vacation Requests
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No vacation requests found</h3>
                <p className="text-muted-foreground">
                  {statusFilter === "all" 
                    ? "No vacation requests have been created yet."
                    : `No vacation requests with status "${statusFilter}" found.`
                  }
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request: any) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {request.user?.profile?.fullName || "Unknown"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {request.user?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getRequestTypeBadge(request.requestType)}</TableCell>
                        <TableCell>{formatDate(request.startDate)}</TableCell>
                        <TableCell>{formatDate(request.endDate)}</TableCell>
                        <TableCell>{request.daysRequested}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>{formatDate(request.submittedAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {hasRole("MANAGER") && request.status === "PENDING" && request.userId !== user?.id && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openApprovalDialog(request, "APPROVE")}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openApprovalDialog(request, "REJECT")}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Approval Dialog */}
        <Dialog open={approvalDialog.open} onOpenChange={(open) => 
          setApprovalDialog(prev => ({ ...prev, open }))
        }>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {approvalDialog.action === "APPROVE" ? "Approve" : "Reject"} Vacation Request
              </DialogTitle>
              <DialogDescription>
                {approvalDialog.action === "APPROVE" 
                  ? "Are you sure you want to approve this vacation request?"
                  : "Are you sure you want to reject this vacation request? Please provide a reason."
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="comments">Comments {approvalDialog.action === "REJECT" && "(Required)"}</Label>
                <Textarea
                  id="comments"
                  value={approvalDialog.comments}
                  onChange={(e) => setApprovalDialog(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder={approvalDialog.action === "APPROVE" 
                    ? "Optional comments..." 
                    : "Please explain why this request is being rejected..."
                  }
                  disabled={approvalDialog.loading}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setApprovalDialog(prev => ({ ...prev, open: false }))}
                disabled={approvalDialog.loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApproval}
                disabled={approvalDialog.loading || (approvalDialog.action === "REJECT" && !approvalDialog.comments.trim())}
                variant={approvalDialog.action === "APPROVE" ? "default" : "destructive"}
              >
                {approvalDialog.loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  approvalDialog.action === "APPROVE" ? "Approve" : "Reject"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default VacationManagementNew;