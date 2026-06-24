"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { updateMeeting, getMeetingById } from "@/lib/services/meetings";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { v4 as uuidv4 } from "uuid";

export default function EditMeetingPage() {
  const router = useRouter();
  const params = useParams();
  const meetingId = params.id as string;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "HR",
    venue: "",
    date: "",
    startTime: "",
    endTime: "",
    expectedParticipantCount: 0,
    requireLocation: false,
    requirePhoto: false,
  });

  useEffect(() => {
    if (!meetingId) return;
    const fetchMeeting = async () => {
      try {
        const meeting = await getMeetingById(meetingId);
        if (meeting) {
          setFormData({
            title: meeting.title,
            description: meeting.description,
            category: meeting.category,
            venue: meeting.venue,
            date: meeting.date,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            expectedParticipantCount: meeting.expectedParticipantCount,
            requireLocation: meeting.requireLocation,
            requirePhoto: meeting.requirePhoto,
          });
        }
      } catch (error) {
        console.error("Error fetching meeting:", error);
      } finally {
        setFetching(false);
      }
    };
    fetchMeeting();
  }, [meetingId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !meetingId) return;
    
    setLoading(true);
    try {
      await updateMeeting(meetingId, {
        ...formData,
        expectedParticipantCount: Number(formData.expectedParticipantCount),
      });
      
      // Redirect to meetings list
      router.push(`/dashboard/meetings`);
    } catch (error) {
      console.error("Error updating meeting:", error);
      alert("Failed to update meeting.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Edit Meeting</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meeting Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input required name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Q3 Marketing Review" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select 
                name="category" 
                value={formData.category} 
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="HR">HR</option>
                <option value="MARKETING">Marketing</option>
                <option value="OPERATIONS">Operations</option>
                <option value="TRAINING">Training</option>
                <option value="MANAGEMENT">Management</option>
                <option value="REVIEW">Review</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Venue / Link</label>
              <Input required name="venue" value={formData.venue} onChange={handleChange} placeholder="Room 402 or Zoom link" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input required type="date" name="date" value={formData.date} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Expected Participants</label>
                <Input required type="number" name="expectedParticipantCount" value={formData.expectedParticipantCount} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time</label>
                <Input required type="time" name="startTime" value={formData.startTime} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Time</label>
                <Input required type="time" name="endTime" value={formData.endTime} onChange={handleChange} />
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium">Security Options</h3>
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="requireLocation" 
                  name="requireLocation" 
                  checked={formData.requireLocation} 
                  onChange={handleChange} 
                  className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="requireLocation" className="text-sm">Require Geolocation Verification</label>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="requirePhoto" 
                  name="requirePhoto" 
                  checked={formData.requirePhoto} 
                  onChange={handleChange} 
                  className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="requirePhoto" className="text-sm">Require Selfie Photo Capture</label>
              </div>
            </div>

            <div className="pt-6">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Updating..." : "Update Meeting"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
