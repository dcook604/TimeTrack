"use client";

import React from "react";
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
import {
  Eye,
  Edit,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface Timesheet {
  id: string;
  weekStarting: string;
  weekEnding: string;
  totalHours: number;
  status: "draft" | "submitted" | "approved" | "rejected";
  submittedDate?: string;
  approvedDate?: string;
  rejectionReason?: string;
}

interface TimesheetListProps {
  timesheets?: Timesheet[];
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDownload?: (id: string) => void;
}

const TimesheetList = ({
  timesheets = [
    {
      id: "TS-001",
      weekStarting: "2024-01-15",
      weekEnding: "2024-01-19",
      totalHours: 40,
      status: "approved",
      submittedDate: "2024-01-22",
      approvedDate: "2024-01-23",
    },
    {
      id: "TS-002",
      weekStarting: "2024-01-22",
      weekEnding: "2024-01-26",
      totalHours: 38.5,
      status: "submitted",
      submittedDate: "2024-01-29",
    },
    {
      id: "TS-003",
      weekStarting: "2024-01-29",
      weekEnding: "2024-02-02",
      totalHours: 42,
      status: "rejected",
      submittedDate: "2024-02-05",
      rejectionReason: "Missing break times for Tuesday",
    },
    {
      id: "TS-004",
      weekStarting: "2024-02-05",
      weekEnding: "2024-02-09",
      totalHours: 35,
      status: "draft",
    },
  ],
  onView,
  onEdit,
  onDownload,
}: TimesheetListProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
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
    switch (status) {
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

  return (
    <div className="bg-background min-h-screen p-6">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6" />
            My Timesheets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Badge variant="outline">Total: {timesheets.length}</Badge>
                <Badge variant="default">
                  Approved:{" "}
                  {timesheets.filter((t) => t.status === "approved").length}
                </Badge>
                <Badge variant="secondary">
                  Pending:{" "}
                  {timesheets.filter((t) => t.status === "submitted").length}
                </Badge>
                <Badge variant="destructive">
                  Rejected:{" "}
                  {timesheets.filter((t) => t.status === "rejected").length}
                </Badge>
              </div>
              <Button>Create New Timesheet</Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
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
                        <div className="font-medium">{timesheet.id}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(
                            timesheet.weekStarting,
                          ).toLocaleDateString()}{" "}
                          -{" "}
                          {new Date(timesheet.weekEnding).toLocaleDateString()}
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
                          {timesheet.status.charAt(0).toUpperCase() +
                            timesheet.status.slice(1)}
                        </Badge>
                      </div>
                      {timesheet.rejectionReason && (
                        <div className="text-xs text-red-600 mt-1">
                          {timesheet.rejectionReason}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {timesheet.submittedDate ? (
                        <div className="text-sm">
                          {new Date(
                            timesheet.submittedDate,
                          ).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Not submitted
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onView?.(timesheet.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(timesheet.status === "draft" ||
                          timesheet.status === "rejected") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit?.(timesheet.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {timesheet.status === "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
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
        </CardContent>
      </Card>
    </div>
  );
};

export default TimesheetList;
