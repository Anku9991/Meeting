"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, UploadCloud, Users, CheckCircle } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import { collection, addDoc, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EmptyState } from "@/components/ui/custom/empty-state";
import { LoadingSkeleton } from "@/components/ui/custom/loading-skeleton";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setSuccessMsg("");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const batch = writeBatch(db);
          let count = 0;

          results.data.forEach((row: any) => {
            // Expected headers: Name, Employee ID, Department, Designation, Email
            if (row["Name"] || row["name"]) {
              const newEmpRef = doc(collection(db, "users"));
              batch.set(newEmpRef, {
                displayName: row["Name"] || row["name"] || "Unknown",
                employeeId: row["Employee ID"] || row["employeeId"] || row["employee_id"] || "",
                department: row["Department"] || row["department"] || "General",
                designation: row["Designation"] || row["designation"] || "Staff",
                email: row["Email"] || row["email"] || "",
                role: "USER",
                createdAt: new Date().toISOString()
              });
              count++;
            }
          });

          if (count > 0) {
            await batch.commit();
            setSuccessMsg(`Successfully imported ${count} employees!`);
            toast.success(`Successfully imported ${count} employees!`);
            // Update local state temporarily for UX
            setEmployees(results.data.map((row: any) => ({
              id: Math.random().toString(),
              displayName: row["Name"] || row["name"],
              employeeId: row["Employee ID"] || row["employeeId"],
              department: row["Department"] || row["department"],
              designation: row["Designation"] || row["designation"],
            })));
          } else {
            toast.error("No valid employee data found in CSV. Please ensure headers are correct.");
          }
        } catch (error) {
          console.error("Error importing CSV:", error);
          toast.error("Failed to import CSV");
        } finally {
          setLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      },
      error: (error) => {
        console.error("PapaParse error:", error);
        toast.error("Failed to parse CSV file");
        setLoading(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-foreground dark:text-white">Employees</h2>
        <div className="flex gap-2">
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            <UploadCloud className="mr-2 h-4 w-4" /> 
            {loading ? "Importing..." : "Import CSV"}
          </Button>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" /> Add Employee
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-md flex items-center border border-green-100 dark:border-green-800">
          <CheckCircle className="mr-2 h-5 w-5" />
          {successMsg}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Employee Directory</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSkeleton rows={5} />
          ) : employees.length === 0 ? (
            <EmptyState 
              icon={Users} 
              title="No employees found" 
              description="Import your employees using a CSV file to get started."
            />
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left text-muted-foreground dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-300">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Employee ID</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Designation</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="bg-card dark:bg-card border-b dark:border-gray-800">
                      <td className="px-6 py-4 font-medium text-foreground dark:text-white">{emp.displayName}</td>
                      <td className="px-6 py-4">{emp.employeeId}</td>
                      <td className="px-6 py-4">{emp.department}</td>
                      <td className="px-6 py-4">{emp.designation}</td>
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
