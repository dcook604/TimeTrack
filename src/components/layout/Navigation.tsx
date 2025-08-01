"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Clock, 
  FileText, 
  Calendar, 
  Settings, 
  User, 
  Users, 
  Shield,
  BarChart3
} from "lucide-react";

interface NavigationProps {
  currentView?: string;
  onViewChange?: (view: string) => void;
  pendingTimesheets?: number;
  isManager?: boolean;
  isAdmin?: boolean;
}

const Navigation = ({
  currentView = "dashboard",
  onViewChange,
  pendingTimesheets = 2,
  isManager = false,
  isAdmin = false,
}: NavigationProps) => {
  const baseNavItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      description: "Overview and quick actions",
    },
    {
      id: "create-timesheet",
      label: "New Timesheet",
      icon: Clock,
      description: "Create weekly timesheet",
    },
    {
      id: "timesheets",
      label: "My Timesheets",
      icon: FileText,
      description: "View submission history",
      badge: pendingTimesheets > 0 ? pendingTimesheets : undefined,
    },
    {
      id: "vacation",
      label: "Vacation",
      icon: Calendar,
      description: "Manage time off",
    },
  ];

  const managerNavItems = [
    {
      id: "manager",
      label: "Manager Dashboard",
      icon: BarChart3,
      description: "Team management and approvals",
    },
  ];

  const adminNavItems = [
    {
      id: "admin",
      label: "User Management",
      icon: Users,
      description: "Manage system users",
    },
  ];

  const profileNavItem = {
    id: "profile",
    label: "Profile",
    icon: User,
    description: "Account settings",
  };

  // Build navigation items based on user role
  let navItems = [...baseNavItems];
  
  if (isManager) {
    navItems = [...navItems, ...managerNavItems];
  }
  
  if (isAdmin) {
    navItems = [...navItems, ...adminNavItems];
  }
  
  navItems.push(profileNavItem);

  return (
    <div className="bg-card border-r border-border w-64 min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-2">TimeTracker</h2>
        <p className="text-sm text-muted-foreground">
          Canadian Labour Compliance
        </p>
        {isAdmin && (
          <div className="mt-2">
            <Badge className="bg-red-100 text-red-800 text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          </div>
        )}
        {isManager && !isAdmin && (
          <div className="mt-2">
            <Badge className="bg-blue-100 text-blue-800 text-xs">
              <BarChart3 className="h-3 w-3 mr-1" />
              Manager
            </Badge>
          </div>
        )}
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className="w-full justify-start h-auto p-3"
              onClick={() => onViewChange?.(item.id)}
            >
              <div className="flex items-center gap-3 w-full">
                <Icon className="h-5 w-5" />
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            </Button>
          );
        })}
      </nav>

      <div className="mt-8 p-3 bg-muted rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-4 w-4" />
          <span className="text-sm font-medium">Quick Stats</span>
        </div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>This Week:</span>
            <span>32.5h</span>
          </div>
          <div className="flex justify-between">
            <span>Vacation Days:</span>
            <span>10 left</span>
          </div>
          <div className="flex justify-between">
            <span>Province:</span>
            <span>Ontario</span>
          </div>
          {isManager && (
            <div className="flex justify-between">
              <span>Pending Approvals:</span>
              <span className="text-orange-600 font-medium">5</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navigation;
