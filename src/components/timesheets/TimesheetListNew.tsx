"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Clock,
  Download,
  Edit,
  Eye,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface TimesheetListProps {
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDownload?: (id: string) => void;
}

const TimesheetListNew = ({ onView, onEdit, onDownload }: TimesheetListProps) => {
  const { user, hasRole } = useAuth();
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  
  // Approval dialog state
  const [approvalDialog, setApprovalDialog] = useState({
    open: false,
    timesheet: null as any,
    action: "" as "APPROVE" | "REJECT",
    comments: "",
    loading: false
  });

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (statusFilter !== "all") {
        params.status = statusFilter.toUpperCase();
      }

      const response = await apiClient.getTimesheets(params);
      if (response.success) {
        setTimesheets(Array.isArray(response.data) ? response.data : []);
        setPagination(response.pagination || { total: 0, pages: 0 });
      } else {
        setError(response.error || "Failed to fetch timesheets");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheets();
  }, [page, statusFilter]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { variant: "secondary" as const, icon: Edit, color: "text-gray-600" },
      SUBMITTED: { variant: "default" as const, icon: Clock, color: "text-blue-600" },
      APPROVED: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      REJECTED: { variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const handleApproval = async () => {
    if (!approvalDialog.timesheet) return;

    setApprovalDialog(prev => ({ ...prev, loading: true }));

    try {
      const response = await apiClient.approveTimesheet(
        approvalDialog.timesheet.id,
        approvalDialog.action,
        approvalDialog.comments
      );

      if (response.success) {
        setApprovalDialog({
          open: false,
          timesheet: null,
          action: "" as any,
          comments: "",
          loading: false
        });
        fetchTimesheets(); // Refresh the list
      } else {
        setError(response.error || "Failed to process approval");
        setApprovalDialog(prev => ({ ...prev, loading: false }));
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setApprovalDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const openApprovalDialog = (timesheet: any, action: "APPROVE" | "REJECT") => {
    setApprovalDialog({
      open: true,
      timesheet,
      action,
      comments: "",
      loading: false
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading && timesheets.length === 0) {
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
            <h1 className="text-3xl font-bold">Timesheets</h1>
            <p className="text-muted-foreground mt-1">
              Manage and review timesheet submissions.
            </p>
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
                <FileText className="h-5 w-5" />
                Timesheet List
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {timesheets.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No timesheets found</h3>
                <p className="text-muted-foreground">
                  {statusFilter === "all" 
                    ? "No timesheets have been created yet."
                    : `No timesheets with status "${statusFilter}" found.`
                  }
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Week Ending</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timesheets.map((timesheet: any) => (
                      <TableRow key={timesheet.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {timesheet.user?.profile?.fullName || "Unknown"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {timesheet.user?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(timesheet.weekEnding)}</TableCell>
                        <TableCell>{timesheet.totalHours}h</TableCell>
                        <TableCell>{getStatusBadge(timesheet.status)}</TableCell>
                        <TableCell>
                          {timesheet.submittedAt ? formatDate(timesheet.submittedAt) : "Not submitted"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onView?.(timesheet.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {timesheet.status === "DRAFT" && timesheet.userId === user?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit?.(timesheet.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}

                            {hasRole("MANAGER") && timesheet.status === "SUBMITTED" && timesheet.userId !== user?.id && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openApprovalDialog(timesheet, "APPROVE")}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openApprovalDialog(timesheet, "REJECT")}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDownload?.(timesheet.id)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
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
                {approvalDialog.action === "APPROVE" ? "Approve" : "Reject"} Timesheet
              </DialogTitle>
              <DialogDescription>
                {approvalDialog.action === "APPROVE" 
                  ? "Are you sure you want to approve this timesheet?"
                  : "Are you sure you want to reject this timesheet? Please provide a reason."
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
                    : "Please explain why this timesheet is being rejected..."
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

export default TimesheetListNew;