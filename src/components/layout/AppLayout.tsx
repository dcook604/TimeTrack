"use client";

import React, { useState } from "react";
import Navigation from "@/components/layout/Navigation";
import TimesheetDashboard from "@/components/dashboard/TimesheetDashboard";
import TimesheetForm from "@/components/timesheets/TimesheetForm";
import TimesheetList from "@/components/timesheets/TimesheetList";
import VacationSummary from "@/components/vacation/VacationSummary";
import VacationManagement from "@/components/vacation/VacationManagement";
import ManagerDashboard from "@/components/manager/ManagerDashboard";
import UserManagement from "@/components/admin/UserManagement";
import ToastContainer from "@/components/ui/ToastContainer";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Settings, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const AppLayout = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState("dashboard");

  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  const handleCreateTimesheet = () => {
    setCurrentView("create-timesheet");
  };

  const handleViewTimesheets = () => {
    setCurrentView("timesheets");
  };

  const handleTimesheetSubmit = (data: any) => {
    console.log("Timesheet submitted:", data);
    // Navigate back to timesheets list after successful submission
    setCurrentView("timesheets");
  };

  const handleTimesheetSuccess = (timesheet: any) => {
    console.log("Timesheet created successfully:", timesheet);
    // You could show a toast notification here
    // Navigate back to timesheets list
    setCurrentView("timesheets");
  };

  const handleTimesheetCancel = () => {
    setCurrentView("dashboard");
  };

  const handleTimesheetView = (id: string) => {
    console.log("View timesheet:", id);
    // Navigate to timesheet detail view
  };

  const handleTimesheetEdit = (id: string) => {
    console.log("Edit timesheet:", id);
    setCurrentView("create-timesheet");
  };

  const handleTimesheetDownload = (id: string) => {
    console.log("Download timesheet:", id);
    // Implement download functionality
  };

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        if (isManager) {
          return <ManagerDashboard isAdmin={isAdmin} />;
        }
        return (
          <TimesheetDashboard
            onCreateTimesheet={handleCreateTimesheet}
            onViewTimesheets={handleViewTimesheets}
          />
        );
      case "create-timesheet":
        return (
          <TimesheetForm 
            onSubmit={handleTimesheetSubmit}
            onSuccess={handleTimesheetSuccess}
            onCancel={handleTimesheetCancel}
          />
        );
      case "timesheets":
        return (
          <TimesheetList
            onView={handleTimesheetView}
            onEdit={handleTimesheetEdit}
            onDownload={handleTimesheetDownload}
          />
        );
      case "vacation":
        return <VacationManagement isAdmin={isAdmin} />;
      case "manager":
        if (isManager) {
          return <ManagerDashboard isAdmin={isAdmin} />;
        }
        return (
          <div className="bg-background min-h-screen p-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-8">
                <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                <p className="text-muted-foreground">
                  You don't have permission to access the manager dashboard.
                </p>
              </div>
            </div>
          </div>
        );
      case "admin":
        if (isAdmin) {
          return <UserManagement />;
        }
        return (
          <div className="bg-background min-h-screen p-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-8">
                <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                <p className="text-muted-foreground">
                  You don't have permission to access the admin panel.
                </p>
              </div>
            </div>
          </div>
        );
      case "profile":
        return (
          <div className="bg-background min-h-screen p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold">Profile Settings</h1>
                  <p className="text-muted-foreground mt-1">
                    Manage your account and preferences.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Full Name</label>
                        <p className="text-muted-foreground">{user?.profile?.fullName || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <p className="text-muted-foreground">{user?.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Role</label>
                        <p className="text-muted-foreground capitalize">{user?.role?.toLowerCase()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Province</label>
                        <p className="text-muted-foreground">{user?.profile?.province || 'Not set'}</p>
                      </div>
                      <Button variant="outline">Edit Profile</Button>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">
                          Notifications
                        </label>
                        <p className="text-muted-foreground text-sm">
                          Email reminders for timesheet deadlines
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Time Format
                        </label>
                        <p className="text-muted-foreground text-sm">
                          24-hour format
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Vacation Balance
                        </label>
                        <p className="text-muted-foreground text-sm">
                          {user?.profile?.vacationBalance || 0} days remaining
                        </p>
                      </div>
                      <Button variant="outline">Update Preferences</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );
      default:
        if (isManager) {
          return <ManagerDashboard isAdmin={isAdmin} />;
        }
        return (
          <TimesheetDashboard
            onCreateTimesheet={handleCreateTimesheet}
            onViewTimesheets={handleViewTimesheets}
          />
        );
    }
  };

  return (
    <ErrorBoundary>
      <div className="bg-background min-h-screen flex">
        <Navigation
          currentView={currentView}
          onViewChange={setCurrentView}
          pendingTimesheets={2}
          isManager={isManager}
          isAdmin={isAdmin}
        />
        <div className="flex-1">
          <header className="bg-card border-b border-border p-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-lg font-semibold capitalize">
                  {currentView.replace("-", " ")}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString("en-CA", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1">{renderContent()}</main>
        </div>
      </div>
      <ToastContainer />
    </ErrorBoundary>
  );
};

export default AppLayout;
