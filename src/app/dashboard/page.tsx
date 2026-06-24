"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Trophy, TrendingUp, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    totalMeetings: 0,
    participants: 0,
    attendanceRate: 0,
    upcoming: 0,
  });
  const [recentMeetings, setRecentMeetings] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<{dept: string, count: number}[]>([]);
  const [trendData, setTrendData] = useState<{date: string, attendances: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all meetings
        const meetingsSnap = await getDocs(collection(db, "meetings"));
        const allMeetings = meetingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        
        // Fetch all attendances
        const attendancesSnap = await getDocs(collection(db, "attendances"));
        const allAttendances = attendancesSnap.docs.map(doc => doc.data() as any);

        const totalMeetings = allMeetings.length;
        
        // Calculate upcoming (meetings with date >= today)
        const todayStr = new Date().toISOString().split("T")[0];
        const upcomingMeetings = allMeetings.filter(m => m.date >= todayStr).length;

        // Total expected participants (sum of expectedParticipantCount from all meetings)
        const totalExpected = allMeetings.reduce((sum, m) => sum + (Number(m.expectedParticipantCount) || 0), 0);
        const actualParticipants = allAttendances.length;

        const attendanceRate = totalExpected > 0 ? Math.round((actualParticipants / totalExpected) * 100) : 0;

        setMetrics({
          totalMeetings,
          participants: actualParticipants,
          attendanceRate,
          upcoming: upcomingMeetings,
        });

        // Calculate Leaderboard (Top Departments)
        const deptCounts: Record<string, number> = {};
        allAttendances.forEach(att => {
          const dept = att.department || "Unknown";
          deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        });
        
        const sortedDepts = Object.entries(deptCounts)
          .map(([dept, count]) => ({ dept, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setLeaderboard(sortedDepts);

        // Calculate Trend Data (Last 7 Days Attendances)
        const last7Days = Array.from({length: 7}, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toISOString().split("T")[0];
        });
        const trendCounts: Record<string, number> = {};
        last7Days.forEach(d => trendCounts[d] = 0);

        allAttendances.forEach(att => {
          if (att.checkInTime) {
            const dateStr = new Date(att.checkInTime.seconds * 1000).toISOString().split("T")[0];
            if (trendCounts[dateStr] !== undefined) {
              trendCounts[dateStr]++;
            }
          }
        });

        const formattedTrend = last7Days.map(date => ({
          date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          attendances: trendCounts[date]
        }));
        setTrendData(formattedTrend);

        // Get 5 recent meetings
        const recent = allMeetings
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
        setRecentMeetings(recent);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    {
      title: "Total Meetings",
      value: loading ? "..." : metrics.totalMeetings.toString(),
      description: "Total meetings created",
      icon: Calendar,
      href: "/dashboard/meetings"
    },
    {
      title: "Total Attendances",
      value: loading ? "..." : metrics.participants.toString(),
      description: "Total successful check-ins",
      icon: Users,
      href: "/dashboard/reports"
    },
    {
      title: "Avg. Attendance Rate",
      value: loading ? "..." : `${metrics.attendanceRate}%`,
      description: "Based on expected participants",
      icon: CheckCircle,
      href: "/dashboard/reports"
    },
    {
      title: "Upcoming Meetings",
      value: loading ? "..." : metrics.upcoming.toString(),
      description: "Meetings scheduled from today",
      icon: Clock,
      href: "/dashboard/meetings"
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Overview</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link key={i} href={stat.href} className="block group">
              <Card className="transition-all hover:shadow-md hover:border-primary/50 h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Attendance Trends (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAttendances" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ stroke: '#2563eb', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area type="monotone" dataKey="attendances" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorAttendances)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Department Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : leaderboard.length > 0 ? (
              <div className="space-y-6">
                {leaderboard.map((item, index) => (
                  <div key={item.dept} className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold mr-4">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{item.dept}</p>
                      <div className="w-full bg-gray-100 h-2 rounded-full mt-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${Math.max(10, (item.count / leaderboard[0].count) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="ml-4 flex items-center text-sm font-medium text-gray-600">
                      <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
                      {item.count} check-ins
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg text-gray-400 bg-gray-50/50">
                <p>No check-ins yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : recentMeetings.length > 0 ? (
              <div className="space-y-4">
                {recentMeetings.map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium text-sm text-foreground">{meeting.title}</p>
                      <p className="text-xs text-muted-foreground">{meeting.date} at {meeting.startTime}</p>
                    </div>
                    <Link href={`/dashboard/meetings`} className="text-xs font-medium text-primary hover:underline">
                      View
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg text-gray-400 bg-gray-50/50">
                <p>No recent meetings.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
