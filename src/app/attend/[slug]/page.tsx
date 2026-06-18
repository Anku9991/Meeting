"use client";

import { useEffect, useState, useRef, use } from "react";
import { getMeetingBySlug, Meeting } from "@/lib/services/meetings";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, Timestamp } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SignatureCanvas from "react-signature-canvas";
import { MapPin, Camera, CheckCircle, AlertCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export default function AttendancePortal({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const sigCanvas = useRef<any>(null);

  const [formData, setFormData] = useState({
    guestName: "",
    employeeId: "",
    department: "",
    designation: "",
    guestPhone: "",
    guestEmail: "",
  });

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const data = await getMeetingBySlug(slug);
        if (data) {
          setMeeting(data);
        } else {
          setError("Meeting not found or link is invalid.");
        }
      } catch (err) {
        console.error("Error fetching meeting:", err);
        setError("Error loading meeting details.");
      } finally {
        setLoading(false);
      }
    };
    
    if (slug) {
      fetchMeeting();
    }
  }, [slug]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meeting || !meeting.id) return;
    
    if (sigCanvas.current?.isEmpty()) {
      alert("Please provide your digital signature.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // 1. Check for duplicates based on email/employeeId
      const q = query(
        collection(db, "attendances"), 
        where("meetingId", "==", meeting.id),
        where("guestEmail", "==", formData.guestEmail)
      );
      const duplicateCheck = await getDocs(q);
      
      if (!duplicateCheck.empty) {
        throw new Error("You have already checked in to this meeting.");
      }

      // 2. Upload Signature
      const signatureDataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
      const signatureRef = ref(storage, `signatures/${meeting.id}/${uuidv4()}.png`);
      await uploadString(signatureRef, signatureDataUrl, 'data_url');
      const signatureUrl = await getDownloadURL(signatureRef);

      // 3. Save Attendance Record
      const attendanceData = {
        meetingId: meeting.id,
        ...formData,
        signatureUrl,
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
        deviceInfo: navigator.userAgent,
        status: "PRESENT",
        checkInTime: Timestamp.now(),
      };

      await addDoc(collection(db, "attendances"), attendanceData);
      setSuccess(true);
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err.message || "Failed to submit attendance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  if (error && !meeting) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
      <p className="text-gray-600 text-center">{error}</p>
    </div>
  );

  if (success) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-green-100">
        <CardContent className="pt-10 pb-8 flex flex-col items-center text-center">
          <div className="rounded-full bg-green-100 p-3 mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Attendance Recorded!</h2>
          <p className="text-gray-500 mb-6">
            Your attendance for <strong>{meeting?.title}</strong> has been successfully submitted.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 w-full border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Check-in Reference</p>
            <p className="font-mono text-gray-900">{uuidv4().split('-')[0].toUpperCase()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-1">MeetTrack Pro</h1>
          <p className="text-sm text-gray-500">Digital Attendance System</p>
        </div>

        <Card className="shadow-lg border-t-4 border-t-primary">
          <CardHeader className="bg-white border-b border-gray-100 pb-6">
            <CardTitle className="text-xl">{meeting?.title}</CardTitle>
            <CardDescription className="flex flex-col space-y-1 mt-2">
              <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" /> {meeting?.venue}</span>
              <span>{meeting?.date} • {meeting?.startTime} - {meeting?.endTime}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4 border border-red-100">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <Input required name="guestName" value={formData.guestName} onChange={handleChange} placeholder="Full Name" className="bg-gray-50" />
                <div className="grid grid-cols-2 gap-3">
                  <Input required name="employeeId" value={formData.employeeId} onChange={handleChange} placeholder="Employee ID" className="bg-gray-50" />
                  <Input required name="department" value={formData.department} onChange={handleChange} placeholder="Department" className="bg-gray-50" />
                </div>
                <Input required name="designation" value={formData.designation} onChange={handleChange} placeholder="Designation" className="bg-gray-50" />
                <Input type="email" required name="guestEmail" value={formData.guestEmail} onChange={handleChange} placeholder="Email Address" className="bg-gray-50" />
                <Input type="tel" name="guestPhone" value={formData.guestPhone} onChange={handleChange} placeholder="Mobile Number (Optional)" className="bg-gray-50" />
              </div>



              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Digital Signature</label>
                  <button type="button" onClick={clearSignature} className="text-xs text-primary hover:underline">Clear</button>
                </div>
                <div className="border border-gray-300 rounded-md bg-white overflow-hidden">
                  <SignatureCanvas 
                    ref={sigCanvas}
                    canvasProps={{
                      className: "signature-canvas w-full h-32"
                    }}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-lg mt-6" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Attendance"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
