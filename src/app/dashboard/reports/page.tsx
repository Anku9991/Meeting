"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getMeetings, Meeting } from "@/lib/services/meetings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Filter, Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { EmptyState } from "@/components/ui/custom/empty-state";
import { LoadingSkeleton } from "@/components/ui/custom/loading-skeleton";

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

  const getMeetingDetails = (id: string) => {
    return meetings.find(m => m.id === id);
  };

  const exportAttendanceSheet = async () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;
    const meeting = selectedMeeting !== "ALL" ? getMeetingDetails(selectedMeeting) : null;

    // ── Medanta branding ───────────────────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(200, 50, 50);
    doc.text("+ medanta", margin, 12);
    doc.setTextColor(0, 0, 0);

    // ── Attendance Sheet info box ──────────────────────────────────────────
    const boxTop = 17;
    const boxLeft = margin;
    const boxRight = pageW - margin;
    const boxWidth = boxRight - boxLeft;
    const lineGap = 7.5;
    const infoLines = [
      { label: "Training Program :", value: meeting?.title || "" },
      { label: "Venue :", value: meeting?.venue || "" },
      { label: "Timings :", value: meeting ? `${meeting.startTime || ""} - ${meeting.endTime || ""}` : "" },
      { label: "Date :", value: meeting?.date || new Date().toLocaleDateString() },
      { label: "Trainer's Name :", value: "" },
    ];
    const boxHeight = 10 + infoLines.length * lineGap;

    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(boxLeft, boxTop, boxWidth, boxHeight);

    // Title row inside box
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Attendance Sheet", pageW / 2, boxTop + 6, { align: "center" });

    // Info rows with bold label + dotted value line
    doc.setFontSize(8.5);
    const labelX = boxLeft + 8;
    const valueStartX = boxLeft + 52;
    const valueEndX = boxRight - 5;
    infoLines.forEach((line, i) => {
      const y = boxTop + 11 + i * lineGap;
      doc.setFont("helvetica", "bold");
      doc.text(line.label, labelX, y);
      // dotted line
      doc.setLineDashPattern([0.8, 1.2], 0);
      doc.setLineWidth(0.2);
      doc.line(valueStartX, y + 0.5, valueEndX, y + 0.5);
      doc.setLineDashPattern([], 0);
      doc.setLineWidth(0.3);
      // value text on top of the dotted line
      if (line.value) {
        doc.setFont("helvetica", "normal");
        doc.text(line.value, valueStartX + 1, y);
      }
    });

    // ── Attendance table drawn manually (to support signature images) ──────
    const tableTop = boxTop + boxHeight + 5;
    const ROW_H = 13;
    // Column widths (must sum to boxWidth)
    const cols = [
      { header: "S. No",                 w: 12 },
      { header: "Employee ID",           w: 30 },
      { header: "Full Name(In Capital)", w: 57 },
      { header: "Department",            w: 45 },
      { header: "Signature",             w: boxWidth - 12 - 30 - 57 - 45 },
    ];
    // Calculate x positions
    const colXs: number[] = [];
    let cx = boxLeft;
    cols.forEach(c => { colXs.push(cx); cx += c.w; });

    const drawRowBorders = (rowY: number, rowH: number) => {
      colXs.forEach(x => doc.line(x, rowY, x, rowY + rowH));
      doc.line(boxLeft + boxWidth, rowY, boxLeft + boxWidth, rowY + rowH);
      doc.line(boxLeft, rowY + rowH, boxLeft + boxWidth, rowY + rowH);
    };

    // Header row
    doc.setFillColor(230, 230, 230);
    doc.rect(boxLeft, tableTop, boxWidth, 8, "F");
    doc.line(boxLeft, tableTop, boxLeft + boxWidth, tableTop); // top border
    drawRowBorders(tableTop, 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(0);
    cols.forEach((c, i) => {
      doc.text(c.header, colXs[i] + 1.5, tableTop + 5.3);
    });

    // Data rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    const records = filteredAttendances;
    const minRows = Math.max(records.length, 15);
    let curY = tableTop + 8;

    for (let i = 0; i < minRows; i++) {
      // Page break check
      if (curY + ROW_H > pageH - 15) {
        doc.addPage();
        curY = 15;
        // Redraw header on new page
        doc.setFillColor(230, 230, 230);
        doc.rect(boxLeft, curY, boxWidth, 8, "F");
        doc.line(boxLeft, curY, boxLeft + boxWidth, curY);
        drawRowBorders(curY, 8);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        cols.forEach((c, ci) => doc.text(c.header, colXs[ci] + 1.5, curY + 5.3));
        curY += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
      }

      const record = records[i] || null;
      doc.setFillColor(i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 250);
      doc.rect(boxLeft, curY, boxWidth, ROW_H, "F");
      drawRowBorders(curY, ROW_H);

      if (record) {
        const textY = curY + 5;
        doc.setTextColor(0);
        doc.text(String(i + 1), colXs[0] + 3, textY);
        doc.text(record.employeeId || "", colXs[1] + 1.5, textY, { maxWidth: cols[1].w - 3 });
        doc.text((record.guestName || "").toUpperCase(), colXs[2] + 1.5, textY, { maxWidth: cols[2].w - 3 });
        doc.text(record.department || "", colXs[3] + 1.5, textY, { maxWidth: cols[3].w - 3 });

        // Embed signature image
        if (record.signatureUrl && record.signatureUrl.startsWith("data:image")) {
          try {
            doc.addImage(
              record.signatureUrl, "PNG",
              colXs[4] + 1, curY + 1,
              cols[4].w - 2, ROW_H - 2
            );
          } catch (_) { /* skip if image fails */ }
        }
      } else {
        doc.setTextColor(160);
        doc.text(String(i + 1), colXs[0] + 3, curY + 5);
        doc.setTextColor(0);
      }

      curY += ROW_H;
    }

    // ── Footer ─────────────────────────────────────────────────────────────
    doc.setFontSize(7);
    doc.setTextColor(140);
    doc.text("HR/0220/F001", pageW - margin, pageH - 6, { align: "right" });

    const label = meeting ? meeting.title.replace(/[^a-z0-9]/gi, "_") : "All";
    doc.save(`Attendance_Sheet_${label}_${new Date().toISOString().split("T")[0]}.pdf`);
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
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Reports</h2>
        <div className="flex space-x-2">
          <Button onClick={exportCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={exportPDF} variant="outline">
            <FileText className="mr-2 h-4 w-4" /> Export PDF
          </Button>
          <Button onClick={exportAttendanceSheet}>
            <Printer className="mr-2 h-4 w-4" /> Export Attendance Sheet
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
          <CardTitle>Attendance Records</CardTitle>
          <div className="flex items-center">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
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
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <LoadingSkeleton rows={5} />
            </div>
          ) : filteredAttendances.length === 0 ? (
            <EmptyState 
              icon={FileText} 
              title="No records found" 
              description="There are no attendance records for the selected filters."
            />
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left text-muted-foreground">
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
                    <tr key={record.id} className="bg-card border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{record.guestName}</div>
                        <div className="text-xs text-muted-foreground">{record.employeeId} • {record.department}</div>
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
                          <div className="inline-block p-1 border rounded bg-card">
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
