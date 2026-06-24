"use client";

import { useEffect, useState } from "react";
import { getMeetings, deleteMeeting, Meeting } from "@/lib/services/meetings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, QrCode, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/custom/empty-state";
import { LoadingSkeleton } from "@/components/ui/custom/loading-skeleton";

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

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this meeting?")) {
      try {
        await deleteMeeting(id);
        setMeetings(prev => prev.filter(m => m.id !== id));
        toast.success("Meeting deleted successfully");
      } catch (error) {
        console.error("Error deleting meeting:", error);
        toast.error("Failed to delete meeting");
      }
    }
  };

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
          <CardTitle>All Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSkeleton rows={5} />
          ) : meetings.length === 0 ? (
            <EmptyState 
              icon={Calendar} 
              title="No meetings found" 
              description="Get started by creating your first meeting to track attendance."
              action={
                <Link href="/dashboard/meetings/new">
                  <Button><Plus className="mr-2 h-4 w-4" /> Create Meeting</Button>
                </Link>
              }
            />
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
                        <Link href={`/dashboard/meetings/${meeting.id}/edit`}>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          onClick={() => meeting.id && handleDelete(meeting.id)}
                        >
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
