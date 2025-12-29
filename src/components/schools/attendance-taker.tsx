"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, X, Clock, AlertCircle, Save, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface Student {
    id: string;
    firstName: string;
    lastName: string;
    matricula: string;
}

interface AttendanceTakerProps {
    courseId: string;
    date: string;
}

type Status = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export function AttendanceTaker({ courseId, date }: AttendanceTakerProps) {
    const { toast } = useToast();
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Record<string, Status>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Fetch students and existing attendance
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // 1. Get Students
                const studentsRes = await fetch(`/api/courses/${courseId}/students`);
                if (!studentsRes.ok) throw new Error("Failed to load students");
                const studentsData = await studentsRes.json();
                setStudents(studentsData);

                // 2. Get Existing Attendance
                const attendanceRes = await fetch(`/api/attendance?courseId=${courseId}&date=${date}`);
                if (attendanceRes.ok) {
                    const existingRecords = await attendanceRes.json();
                    const statusMap: Record<string, Status> = {};

                    // Pre-fill with existing data
                    existingRecords.forEach((r: any) => {
                        statusMap[r.studentId] = r.status as Status;
                    });

                    // Default everyone else to PRESENT if new day (optional, but requested behavior implies ease of use)
                    // Let's only default if there are NO records for this day yet.
                    if (existingRecords.length === 0) {
                        studentsData.forEach((s: Student) => {
                            statusMap[s.id] = "PRESENT";
                        });
                    } else {
                        // Ensure any new students also have a default status if partially filled
                        studentsData.forEach((s: Student) => {
                            if (!statusMap[s.id]) statusMap[s.id] = "PRESENT";
                        });
                    }

                    setAttendance(statusMap);
                }
            } catch (error) {
                console.error(error);
                toast({ title: "Error al cargar datos", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        if (courseId && date) {
            loadData();
        }
    }, [courseId, date]);

    const handleStatusChange = (studentId: string, status: Status) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const records = Object.entries(attendance).map(([studentId, status]) => ({
                studentId,
                status
            }));

            const res = await fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    courseId,
                    date,
                    attendanceRecords: records
                })
            });

            if (!res.ok) throw new Error("Failed to save");

            toast({ title: "Asistencia guardada correctamente" });
        } catch (error) {
            console.error(error);
            toast({ title: "Error al guardar", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const getStatusColor = (status: Status) => {
        switch (status) {
            case "PRESENT": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "ABSENT": return "bg-red-100 text-red-700 border-red-200";
            case "LATE": return "bg-amber-100 text-amber-700 border-amber-200";
            case "EXCUSED": return "bg-blue-100 text-blue-700 border-blue-200";
            default: return "bg-slate-100 text-slate-700";
        }
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
    }

    if (students.length === 0) {
        return <div className="text-center p-8 text-slate-500">No hay alumnos inscritos en este curso.</div>;
    }

    // Stats
    const stats = {
        present: Object.values(attendance).filter(s => s === "PRESENT").length,
        absent: Object.values(attendance).filter(s => s === "ABSENT").length,
        total: students.length
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm sticky top-4 z-10">
                <div className="flex gap-4 text-sm">
                    <span className="text-emerald-600 font-medium">{stats.present} Presentes</span>
                    <span className="text-red-600 font-medium">{stats.absent} Ausentes</span>
                    <span className="text-slate-400">/ {stats.total} Total</span>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-slate-900 text-white rounded-xl shadow-md min-w-[120px]">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Guardar
                </Button>
            </div>

            <div className="grid gap-3">
                {students.map(student => (
                    <div
                        key={student.id}
                        className={cn(
                            "flex items-center justify-between p-4 rounded-xl border bg-white transition-all",
                            attendance[student.id] === 'ABSENT' ? "border-red-100 bg-red-50/30" : "border-slate-100"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-slate-100">
                                <AvatarFallback className="bg-slate-100 text-slate-600 font-medium">
                                    {student.firstName[0]}{student.lastName[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-slate-800">{student.firstName} {student.lastName}</p>
                                <p className="text-xs text-slate-500">{student.matricula}</p>
                            </div>
                        </div>

                        <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStatusChange(student.id, "PRESENT")}
                                className={cn(
                                    "h-8 px-3 rounded-md transition-all",
                                    attendance[student.id] === "PRESENT"
                                        ? "bg-white text-emerald-600 shadow-sm font-bold"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                <Check className="w-4 h-4 mr-1" /> Presente
                            </Button>

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStatusChange(student.id, "LATE")}
                                className={cn(
                                    "h-8 px-3 rounded-md transition-all",
                                    attendance[student.id] === "LATE"
                                        ? "bg-white text-amber-600 shadow-sm font-bold"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                <Clock className="w-4 h-4" />
                            </Button>

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStatusChange(student.id, "EXCUSED")}
                                className={cn(
                                    "h-8 px-3 rounded-md transition-all",
                                    attendance[student.id] === "EXCUSED"
                                        ? "bg-white text-blue-600 shadow-sm font-bold"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                <AlertCircle className="w-4 h-4" />
                            </Button>

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStatusChange(student.id, "ABSENT")}
                                className={cn(
                                    "h-8 px-3 rounded-md transition-all",
                                    attendance[student.id] === "ABSENT"
                                        ? "bg-white text-red-600 shadow-sm font-bold"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                <X className="w-4 h-4 mr-1" /> Ausente
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
