"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Eye,
  Edit,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useTimesheets } from "@/hooks/useTimesheets";
import { Timesheet } from "@/lib/api-client";

interface TimesheetListProps {
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDownload?: (id: string) => void;
}

const TimesheetList = ({
  onView,
  onEdit,
  onDownload,
}: TimesheetListProps) => {
  const { timesheets, loading, error, getTimesheets, clearError } = useTimesheets();

  useEffect(() => {
    // Load timesheets when component mounts
    getTimesheets();
  }, [getTimesheets]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "submitted":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
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

  const getWeekEnding = (weekStarting: string) => {
    const startDate = new Date(weekStarting);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 4); // Friday
    return endDate.toISOString().split('T')[0];
  };

  const handleRefresh = () => {
    clearError();
    getTimesheets();
  };

  if (loading && timesheets.length === 0) {
    return (
      <div className="bg-background min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span>Loading timesheets...</span>
            </div>
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
            <h1 className="text-3xl font-bold">My Timesheets</h1>
            <p className="text-muted-foreground mt-1">
              View and manage your timesheet submissions.
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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

        <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timesheet History
          </CardTitle>
        </CardHeader>
        <CardContent>
            {timesheets.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No timesheets found</h3>
                <p className="text-muted-foreground">
                  You haven't created any timesheets yet. Start by creating your first timesheet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                      <TableHead>Week</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timesheets.map((timesheet) => (
                  <TableRow key={timesheet.id}>
                    <TableCell>
                      <div>
                            <div className="font-medium">
                              {formatDate(timesheet.weekStarting)} - {formatDate(getWeekEnding(timesheet.weekStarting))}
                            </div>
                        <div className="text-sm text-muted-foreground">
                              Week of {formatDate(timesheet.weekStarting)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{timesheet.totalHours}h</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(timesheet.status)}
                        <Badge variant={getStatusVariant(timesheet.status)}>
                              {timesheet.status.charAt(0).toUpperCase() + timesheet.status.slice(1)}
                        </Badge>
                      </div>
                      {timesheet.rejectionReason && (
                            <div className="text-sm text-red-600 mt-1">
                          {timesheet.rejectionReason}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                          {timesheet.submittedAt ? (
                            <div>
                              <div className="font-medium">
                                {formatDate(timesheet.submittedAt)}
                              </div>
                              {timesheet.approvedAt && (
                                <div className="text-sm text-muted-foreground">
                                  Approved: {formatDate(timesheet.approvedAt)}
                                </div>
                              )}
                        </div>
                      ) : (
                            <span className="text-muted-foreground">Not submitted</span>
                      )}
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
                            {timesheet.status === 'DRAFT' && (
                          <Button
                                variant="ghost"
                            size="sm"
                            onClick={() => onEdit?.(timesheet.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                            {timesheet.status === 'APPROVED' && (
                          <Button
                                variant="ghost"
                            size="sm"
                            onClick={() => onDownload?.(timesheet.id)}
                          >
                            <Download className="h-4 w-4" />
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
      </div>
    </div>
  );
};

export default TimesheetList;
