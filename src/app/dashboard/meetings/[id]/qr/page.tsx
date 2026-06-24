"use client";

import { useEffect, useState, use } from "react";
import { getMeetingById, Meeting } from "@/lib/services/meetings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Download, Share2, Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function MeetingQRPage({ params }: { params: Promise<{ id: string }> }) {
  // Extract id from the resolved params promise
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceUrl, setAttendanceUrl] = useState("");

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const data = await getMeetingById(id);
        if (data) {
          setMeeting(data);
          // Set the attendance URL based on the current origin and meeting slug
          const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';
          setAttendanceUrl(`${origin}/attend/${data.uniqueUrlSlug}`);
        }
      } catch (error) {
        console.error("Error fetching meeting:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchMeeting();
    }
  }, [id]);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!meeting) {
    return <div className="text-center py-12 text-red-500">Meeting not found.</div>;
  }

  const handleDownload = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `meeting-qr-${meeting.uniqueUrlSlug}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center">
          <Link href="/dashboard/meetings">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Meeting QR Code</h2>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <CardHeader className="pb-4 pt-0">
            <CardTitle className="text-xl">Scan to Attend</CardTitle>
            <CardDescription>Participants should scan this to mark attendance</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="bg-card p-4 rounded-xl shadow-sm border mb-6">
              <QRCodeSVG 
                id="qr-code-svg"
                value={attendanceUrl} 
                size={250}
                level="H"
                includeMargin={true}
              />
            </div>
            
            <p className="text-sm text-muted-foreground break-all mb-6 px-4">
              {attendanceUrl}
            </p>

            <div className="flex space-x-3 print:hidden">
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" /> Download
              </Button>
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" /> Print
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                navigator.clipboard.writeText(attendanceUrl);
                toast.success("Link copied to clipboard!");
              }}>
                <Share2 className="h-4 w-4 mr-2" /> Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meeting Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Title</h4>
              <p className="text-base font-semibold">{meeting.title}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Date & Time</h4>
              <p className="text-base">{meeting.date} ({meeting.startTime} - {meeting.endTime})</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Venue</h4>
              <p className="text-base">{meeting.venue}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Category</h4>
              <p className="text-base">{meeting.category}</p>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Security Requirements</h4>
              <ul className="text-sm space-y-1">
                <li className="flex items-center text-gray-700">
                  <span className={`w-2 h-2 rounded-full mr-2 ${meeting.requireLocation ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  Geolocation Verification: {meeting.requireLocation ? "Required" : "Not Required"}
                </li>
                <li className="flex items-center text-gray-700">
                  <span className={`w-2 h-2 rounded-full mr-2 ${meeting.requirePhoto ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  Selfie Photo Capture: {meeting.requirePhoto ? "Required" : "Not Required"}
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
