"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AttendanceTracker({ courseId }: { courseId: string }) {
    const [date, setDate] = useState<Date>(new Date());
    const [students, setStudents] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchEnrollments();
    }, [courseId]);

    useEffect(() => {
        if (date) {
            fetchAttendance();
        }
    }, [date, courseId]);

    const fetchEnrollments = async () => {
        const res = await fetch(`/api/enrollments?courseId=${courseId}`);
        const data = await res.json();
        setStudents(data.map((e: any) => e.student));
    };

    const fetchAttendance = async () => {
        const res = await fetch(`/api/attendance?courseId=${courseId}&date=${date.toISOString()}`);
        const data = await res.json();
        const acc: Record<string, string> = {};
        data.forEach((r: any) => {
            acc[r.studentId] = r.status;
        });
        setAttendance(acc);
    };

    const handleSave = async () => {
        setLoading(true);
        const attendanceData = Object.entries(attendance).map(([studentId, status]) => ({
            studentId,
            status
        }));

        await fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                courseId,
                date: date.toISOString(),
                attendanceData
            })
        });
        setLoading(false);
    };

    const markAll = (status: string) => {
        const newAttendance = { ...attendance };
        students.forEach(s => {
            newAttendance[s.id] = status;
        });
        setAttendance(newAttendance);
    };

    return (
        <div className="space-y-4 mt-6 border-t pt-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Asistencia</h3>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                    </PopoverContent>
                </Popover>
            </div>

            <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => markAll("PRESENT")}>Todos Presentes</Button>
                <Button size="sm" variant="outline" onClick={() => markAll("ABSENT")}>Todos Ausentes</Button>
            </div>

            <div className="border rounded-md">
                {students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 border-b last:border-0">
                        <span>{student.firstName} {student.lastName}</span>
                        <div className="flex gap-1">
                            <Button
                                size="sm"
                                variant={attendance[student.id] === "PRESENT" ? "default" : "ghost"}
                                className={cn("h-8 w-8 p-0", attendance[student.id] === "PRESENT" && "bg-green-600 hover:bg-green-700")}
                                onClick={() => setAttendance({ ...attendance, [student.id]: "PRESENT" })}
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant={attendance[student.id] === "LATE" ? "default" : "ghost"}
                                className={cn("h-8 w-8 p-0", attendance[student.id] === "LATE" && "bg-yellow-600 hover:bg-yellow-700")}
                                onClick={() => setAttendance({ ...attendance, [student.id]: "LATE" })}
                            >
                                <Clock className="h-4 w-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant={attendance[student.id] === "ABSENT" ? "default" : "ghost"}
                                className={cn("h-8 w-8 p-0", attendance[student.id] === "ABSENT" && "bg-red-600 hover:bg-red-700")}
                                onClick={() => setAttendance({ ...attendance, [student.id]: "ABSENT" })}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <Button onClick={handleSave} disabled={loading} className="w-full">
                {loading ? "Guardando..." : "Guardar Asistencia"}
            </Button>
        </div>
    );
}
