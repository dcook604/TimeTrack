import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, Calendar } from "lucide-react";

interface VacationSummaryProps {
  vacationBalance?: number;
  accruedDays?: number;
  usedDays?: number;
  upcomingHolidays?: Array<{ name: string; date: string }>;
  province?: string;
}

const VacationSummary = ({
  vacationBalance = 10,
  accruedDays = 15,
  usedDays = 5,
  upcomingHolidays = [
    { name: "Canada Day", date: "2023-07-01" },
    { name: "Civic Holiday", date: "2023-08-07" },
    { name: "Labour Day", date: "2023-09-04" },
  ],
  province = "Ontario",
}: VacationSummaryProps) => {
  return (
    <Card className="w-full max-w-md bg-card shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">
            Vacation Summary
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {province}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="text-2xl font-bold">{vacationBalance}</p>
              <p className="text-xs text-muted-foreground">days</p>
            </div>
            <div className="p-2 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">Accrued</p>
              <p className="text-2xl font-bold">{accruedDays}</p>
              <p className="text-xs text-muted-foreground">days</p>
            </div>
            <div className="p-2 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">Used</p>
              <p className="text-2xl font-bold">{usedDays}</p>
              <p className="text-xs text-muted-foreground">days</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium flex items-center gap-1 mb-2">
              <CalendarIcon className="h-4 w-4" />
              Upcoming Holidays
            </h3>
            <div className="space-y-2">
              {upcomingHolidays.map((holiday, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded-md"
                >
                  <span>{holiday.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(holiday.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VacationSummary;
