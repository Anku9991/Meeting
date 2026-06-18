"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getMeetings, Meeting } from "@/lib/services/meetings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Filter } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface AttendanceRecord {
  id: string;
  meetingId: string;
  guestName: string;
  employeeId: string;
  department: string;
  designation: string;
  checkInTime: any;
  status: string;
  signatureUrl: string;
}

export default function ReportsPage() {
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState<string>("ALL");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const meetingsData = await getMeetings();
        setMeetings(meetingsData);

        const q = query(collection(db, "attendances"), orderBy("checkInTime", "desc"));
        const snapshot = await getDocs(q);
        const attendancesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
        setAttendances(attendancesData);
      } catch (err) {
        console.error("Error fetching report data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredAttendances = selectedMeeting === "ALL" 
    ? attendances 
    : attendances.filter(a => a.meetingId === selectedMeeting);

  const getMeetingName = (id: string) => {
    const meeting = meetings.find(m => m.id === id);
    return meeting ? meeting.title : "Unknown Meeting";
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Attendance Report", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    const meetingName = selectedMeeting === "ALL" ? "All Meetings" : getMeetingName(selectedMeeting);
    doc.text(`Meeting: ${meetingName}`, 14, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 36);

    const tableData = filteredAttendances.map(record => [
      record.guestName,
      record.employeeId,
      record.department,
      getMeetingName(record.meetingId),
      new Date(record.checkInTime?.seconds * 1000).toLocaleString(),
      record.status
    ]);

    autoTable(doc, {
      startY: 45,
      head: [["Name", "Emp ID", "Department", "Meeting", "Time", "Status"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`Attendance_Report_${new Date().getTime()}.pdf`);
  };

  const exportCSV = () => {
    const headers = ["Name", "Emp ID", "Department", "Meeting", "Check-In Time", "Status"];
    const rows = filteredAttendances.map(record => [
      `"${record.guestName}"`,
      `"${record.employeeId}"`,
      `"${record.department}"`,
      `"${getMeetingName(record.meetingId)}"`,
      `"${new Date(record.checkInTime?.seconds * 1000).toLocaleString()}"`,
      `"${record.status}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Attendance_Report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Reports</h2>
        <div className="flex space-x-2">
          <Button onClick={exportCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={exportPDF}>
            <FileText className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
          <CardTitle>Attendance Records</CardTitle>
          <div className="flex items-center">
            <Filter className="h-4 w-4 mr-2 text-gray-500" />
            <select 
              value={selectedMeeting}
              onChange={(e) => setSelectedMeeting(e.target.value)}
              className="text-sm border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary"
            >
              <option value="ALL">All Meetings</option>
              {meetings.map(m => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
             <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredAttendances.length === 0 ? (
            <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              No attendance records found.
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Participant</th>
                    <th className="px-6 py-3">Meeting</th>
                    <th className="px-6 py-3">Time</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-center">Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendances.map((record) => (
                    <tr key={record.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{record.guestName}</div>
                        <div className="text-xs text-gray-500">{record.employeeId} • {record.department}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-700">
                        {getMeetingName(record.meetingId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.checkInTime ? new Date(record.checkInTime.seconds * 1000).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {record.signatureUrl ? (
                          <div className="inline-block p-1 border rounded bg-white">
                            <img src={record.signatureUrl} alt="Signature" className="h-8 object-contain" />
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No Sig</span>
                        )}
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
