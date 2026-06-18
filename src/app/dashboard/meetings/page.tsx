"use client";

import { useEffect, useState } from "react";
import { getMeetings, Meeting } from "@/lib/services/meetings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, QrCode } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const data = await getMeetings();
        setMeetings(data);
      } catch (error) {
        console.error("Error fetching meetings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Meetings</h2>
        <Link href="/dashboard/meetings/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Meeting
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Scheduled Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No meetings found. Create one to get started.
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left text-muted-foreground">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Title</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Time</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.map((meeting) => (
                    <tr key={meeting.id} className="bg-card border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                        {meeting.title}
                      </td>
                      <td className="px-6 py-4">
                        {meeting.date}
                      </td>
                      <td className="px-6 py-4">
                        {meeting.startTime} - {meeting.endTime}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium
                          ${meeting.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' : ''}
                          ${meeting.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : ''}
                          ${meeting.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' : ''}
                          ${meeting.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''}
                        `}>
                          {meeting.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link href={`/dashboard/meetings/${meeting.id}/qr`}>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <QrCode className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
