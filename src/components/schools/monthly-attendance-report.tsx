"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, parseISO, isWeekend } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Course {
    id: string;
    name: string;
}

interface AttendanceReport {
    courseName: string;
    days: string[];
    report: {
        student: {
            id: string;
            name: string;
            matricula: string;
        };
        attendance: Record<string, string>;
        stats: {
            present: number;
            absent: number;
            late: number;
            excused: number;
        };
    }[];
}

export function MonthlyAttendanceReport() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>("");
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [reportData, setReportData] = useState<AttendanceReport | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (selectedCourse) {
            fetchReport();
        }
    }, [selectedCourse, currentMonth]);

    const fetchCourses = async () => {
        try {
            const res = await fetch("/api/courses");
            if (res.ok) {
                const data = await res.json();
                setCourses(data);
            }
        } catch (error) {
            console.error("Error fetching courses:", error);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const monthStr = format(currentMonth, "yyyy-MM");
            const res = await fetch(`/api/reports/attendance/monthly?courseId=${selectedCourse}&month=${monthStr}`);
            if (res.ok) {
                const data = await res.json();
                setReportData(data);
            }
        } catch (error) {
            console.error("Error fetching report:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const monthStr = format(currentMonth, "yyyy-MM");
            const res = await fetch(`/api/reports/attendance/monthly/pdf?courseId=${selectedCourse}&month=${monthStr}`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `asistencia_${monthStr}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error("Error downloading PDF:", error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PRESENT": return "bg-green-100 text-green-700";
            case "ABSENT": return "bg-red-100 text-red-700";
            case "LATE": return "bg-yellow-100 text-yellow-700";
            case "EXCUSED": return "bg-blue-100 text-blue-700";
            default: return "";
        }
    };

    const getStatusSymbol = (status: string) => {
        switch (status) {
            case "PRESENT": return "•";
            case "ABSENT": return "✗";
            case "LATE": return "L";
            case "EXCUSED": return "J";
            default: return "";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Reporte Mensual de Asistencia</h2>
                    <p className="text-muted-foreground">Vista general de asistencia por grupo</p>
                </div>
                <div className="flex gap-2 items-center">
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Seleccionar curso" />
                        </SelectTrigger>
                        <SelectContent>
                            {courses.map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                    {course.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {selectedCourse && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-lg font-semibold w-40 text-center capitalize">
                                    {format(currentMonth, "MMMM yyyy", { locale: es })}
                                </span>
                                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex gap-4 text-sm text-muted-foreground">
                                <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Descargar PDF
                                </Button>
                                <div className="flex items-center gap-1"><span className="text-green-600 font-bold">•</span> Presente</div>
                                <div className="flex items-center gap-1"><span className="text-red-600 font-bold">✗</span> Ausente</div>
                                <div className="flex items-center gap-1"><span className="text-yellow-600 font-bold">L</span> Retardo</div>
                                <div className="flex items-center gap-1"><span className="text-blue-600 font-bold">J</span> Justificado</div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : reportData ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[200px] sticky left-0 bg-background z-10">Alumno</TableHead>
                                            {reportData.days.map((day) => {
                                                const date = parseISO(day);
                                                const isWeekendDay = isWeekend(date);
                                                return (
                                                    <TableHead
                                                        key={day}
                                                        className={cn(
                                                            "text-center min-w-[30px] p-1 text-xs",
                                                            isWeekendDay && "bg-muted/50 text-muted-foreground"
                                                        )}
                                                    >
                                                        <div className="flex flex-col items-center">
                                                            <span>{format(date, "EEEEE", { locale: es })}</span>
                                                            <span>{format(date, "d")}</span>
                                                        </div>
                                                    </TableHead>
                                                );
                                            })}
                                            <TableHead className="text-center font-bold text-red-600">Faltas</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reportData.report.map((row) => (
                                            <TableRow key={row.student.id}>
                                                <TableCell className="font-medium sticky left-0 bg-background z-10 border-r">
                                                    <div className="truncate w-[180px]" title={row.student.name}>
                                                        {row.student.name}
                                                    </div>
                                                </TableCell>
                                                {reportData.days.map((day) => {
                                                    const status = row.attendance[day];
                                                    const date = parseISO(day);
                                                    const isWeekendDay = isWeekend(date);
                                                    return (
                                                        <TableCell
                                                            key={day}
                                                            className={cn(
                                                                "text-center p-1 border-x",
                                                                isWeekendDay && "bg-muted/50"
                                                            )}
                                                        >
                                                            {status && (
                                                                <div
                                                                    className={cn(
                                                                        "w-6 h-6 mx-auto rounded-full flex items-center justify-center text-xs font-bold",
                                                                        getStatusColor(status)
                                                                    )}
                                                                >
                                                                    {getStatusSymbol(status)}
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                    );
                                                })}
                                                <TableCell className="text-center font-bold text-red-600 bg-red-50">
                                                    {row.stats.absent}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                Selecciona un curso para ver el reporte
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
