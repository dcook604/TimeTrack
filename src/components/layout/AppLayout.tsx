"use client";

import React, { useState } from "react";
import Navigation from "@/components/layout/Navigation";
import TimesheetDashboard from "@/components/dashboard/TimesheetDashboard";
import TimesheetForm from "@/components/timesheets/TimesheetForm";
import TimesheetList from "@/components/timesheets/TimesheetList";
import VacationSummary from "@/components/vacation/VacationSummary";
import VacationManagement from "@/components/vacation/VacationManagement";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Settings, Bell } from "lucide-react";

const AppLayout = () => {
  const [currentView, setCurrentView] = useState("dashboard");

  const handleCreateTimesheet = () => {
    setCurrentView("create-timesheet");
  };

  const handleViewTimesheets = () => {
    setCurrentView("timesheets");
  };

  const handleTimesheetSubmit = (data: any) => {
    console.log("Timesheet submitted:", data);
    // Here you would typically send the data to your backend
    setCurrentView("timesheets");
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
        return (
          <TimesheetDashboard
            onCreateTimesheet={handleCreateTimesheet}
            onViewTimesheets={handleViewTimesheets}
          />
        );
      case "create-timesheet":
        return <TimesheetForm onSubmit={handleTimesheetSubmit} />;
      case "timesheets":
        return (
          <TimesheetList
            onView={handleTimesheetView}
            onEdit={handleTimesheetEdit}
            onDownload={handleTimesheetDownload}
          />
        );
      case "vacation":
        return <VacationManagement isAdmin={false} />;
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
                        <p className="text-muted-foreground">John Doe</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <p className="text-muted-foreground">
                          john.doe@company.com
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Province</label>
                        <p className="text-muted-foreground">Ontario</p>
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
                      <Button variant="outline">Update Preferences</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <TimesheetDashboard
            onCreateTimesheet={handleCreateTimesheet}
            onViewTimesheets={handleViewTimesheets}
          />
        );
    }
  };

  return (
    <div className="bg-background min-h-screen flex">
      <Navigation
        currentView={currentView}
        onViewChange={setCurrentView}
        pendingTimesheets={2}
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
  );
};

export default AppLayout;
