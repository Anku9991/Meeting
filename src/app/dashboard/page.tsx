import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, CheckCircle, Clock } from "lucide-react";

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Meetings",
      value: "12",
      description: "Active meetings this month",
      icon: Calendar,
      trend: "+2.5%",
    },
    {
      title: "Participants",
      value: "245",
      description: "Total expected participants",
      icon: Users,
      trend: "+12.1%",
    },
    {
      title: "Attendance Rate",
      value: "86%",
      description: "Average across all meetings",
      icon: CheckCircle,
      trend: "+4.3%",
    },
    {
      title: "Upcoming",
      value: "3",
      description: "Meetings scheduled today",
      icon: Clock,
      trend: "0%",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Overview</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600 font-medium mr-1">{stat.trend}</span>
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Attendance Trends</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
              Chart Placeholder (Recharts)
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Meetings</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
              List Placeholder
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
