"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import VacationSummary from "@/components/vacation/VacationSummary";
import {
  Clock,
  Plus,
  FileText,
  Calendar,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

interface DashboardStats {
  currentWeekHours?: number;
  monthlyHours?: number;
  pendingTimesheets?: number;
  overdueTimesheets?: number;
}

interface TimesheetDashboardProps {
  stats?: DashboardStats;
  onCreateTimesheet?: () => void;
  onViewTimesheets?: () => void;
}

const TimesheetDashboard = ({
  stats = {
    currentWeekHours: 32.5,
    monthlyHours: 156,
    pendingTimesheets: 2,
    overdueTimesheets: 1,
  },
  onCreateTimesheet,
  onViewTimesheets,
}: TimesheetDashboardProps) => {
  const quickActions = [
    {
      title: "Create New Timesheet",
      description: "Start tracking your weekly hours",
      icon: Plus,
      action: onCreateTimesheet,
      variant: "default" as const,
    },
    {
      title: "View All Timesheets",
      description: "Review your submission history",
      icon: FileText,
      action: onViewTimesheets,
      variant: "outline" as const,
    },
  ];

  const recentActivity = [
    {
      action: "Timesheet Approved",
      description: "Week of Jan 15-19, 2024 (40 hours)",
      time: "2 hours ago",
      status: "success",
    },
    {
      action: "Timesheet Submitted",
      description: "Week of Jan 22-26, 2024 (38.5 hours)",
      time: "1 day ago",
      status: "pending",
    },
    {
      action: "Timesheet Rejected",
      description: "Week of Jan 29-Feb 2, 2024 - Missing break times",
      time: "3 days ago",
      status: "error",
    },
  ];

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Time Tracking Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's your timesheet overview.
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            Week of {new Date().toLocaleDateString()}
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Current Week
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.currentWeekHours || 0}h
              </div>
              <p className="text-xs text-muted-foreground">
                {40 - (stats.currentWeekHours || 0)}h remaining
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthlyHours || 0}h</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Review
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.pendingTimesheets || 0}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.overdueTimesheets || 0}
              </div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <div
                        key={index}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-md">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{action.title}</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                              {action.description}
                            </p>
                            <Button
                              size="sm"
                              variant={action.variant}
                              onClick={action.action}
                            >
                              Get Started
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 pb-3 border-b last:border-b-0"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          activity.status === "success"
                            ? "bg-green-500"
                            : activity.status === "pending"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{activity.action}</p>
                            <p className="text-sm text-muted-foreground">
                              {activity.description}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {activity.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vacation Summary */}
          <div>
            <VacationSummary />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimesheetDashboard;
