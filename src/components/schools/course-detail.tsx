"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, UserPlus, Trash2, Download, FileSpreadsheet, FileText, MessageSquare, Clock, DoorOpen, BookOpen, Mail, User } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

interface CourseDetailProps {
    courseId: string;
}

interface Student {
    id: string;
    firstName: string;
    lastName: string;
    matricula: string;
    email: string | null;
}

interface Enrollment {
    id: string;
    student: Student;
}

export function CourseDetail({ courseId }: CourseDetailProps) {
    const [course, setCourse] = useState<any>(null);
    const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [isEnrollOpen, setIsEnrollOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const { toast } = useToast();

    const handleExportReportCards = async () => {
        try {
            setExporting(true);
            const res = await fetch(`/api/courses/${courseId}/export/report-cards`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `boletas_${course.name.replace(/\s+/g, "_")}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast({
                    title: "Boletas generadas",
                    description: "La descarga ha comenzado",
                });
            } else {
                toast({
                    title: "Error",
                    description: "No se pudieron generar las boletas",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Ocurrió un error",
                variant: "destructive",
            });
        } finally {
            setExporting(false);
        }
    };

    const [teachers, setTeachers] = useState<any[]>([]);

    useEffect(() => {
        fetchCourseDetail();
        fetchAvailableStudents();
        fetchTeachers();
    }, [courseId]);

    const fetchTeachers = async () => {
        try {
            const res = await fetch("/api/users?role=TEACHER");
            if (res.ok) {
                const data = await res.json();
                setTeachers(data);
            }
        } catch (error) {
            console.error("Failed to fetch teachers", error);
        }
    };

    const fetchCourseDetail = async () => {
        try {
            const res = await fetch(`/api/courses/${courseId}`);
            if (res.ok) {
                const data = await res.json();
                setCourse(data);
            }
        } catch (error) {
            console.error("Failed to fetch course", error);
        }
    };

    const fetchAvailableStudents = async () => {
        try {
            const res = await fetch("/api/students");
            if (res.ok) {
                const data = await res.json();
                setAvailableStudents(data);
            }
        } catch (error) {
            console.error("Failed to fetch students", error);
        }
    };

    const handleEnrollStudents = async () => {
        if (selectedStudents.length === 0) {
            toast({
                title: "Error",
                description: "Selecciona al menos un alumno",
                variant: "destructive",
            });
            return;
        }

        try {
            const res = await fetch("/api/enrollments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    courseId,
                    studentIds: selectedStudents,
                }),
            });

            if (res.ok) {
                toast({
                    title: "Alumnos inscritos",
                    description: `${selectedStudents.length} alumno(s) inscrito(s) exitosamente`,
                });
                setIsEnrollOpen(false);
                setSelectedStudents([]);
                fetchCourseDetail();
            } else {
                toast({
                    title: "Error",
                    description: "No se pudo inscribir a los alumnos",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Ocurrió un error",
                variant: "destructive",
            });
        }
    };

    const handleUnenroll = async (enrollmentId: string) => {
        if (!confirm("¿Desinscribir a este alumno del curso?")) return;

        try {
            const res = await fetch(`/api/enrollments?enrollmentId=${enrollmentId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast({ title: "Alumno desinscrito" });
                fetchCourseDetail();
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Ocurrió un error",
                variant: "destructive",
            });
        }
    };

    const toggleStudent = (studentId: string) => {
        setSelectedStudents((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleExportPDF = async () => {
        try {
            const res = await fetch(`/api/courses/${courseId}/export/pdf`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `lista_${course.name.replace(/\s+/g, "_")}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast({
                    title: "PDF generado",
                    description: "La descarga ha comenzado",
                });
            } else {
                toast({
                    title: "Error",
                    description: "No se pudo generar el PDF",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Ocurrió un error",
                variant: "destructive",
            });
        }
    };

    const handleExportExcel = async () => {
        try {
            const res = await fetch(`/api/courses/${courseId}/export/excel`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `lista_${course.name.replace(/\s+/g, "_")}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast({
                    title: "Excel generado",
                    description: "La descarga ha comenzado",
                });
            } else {
                toast({
                    title: "Error",
                    description: "No se pudo generar el Excel",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Ocurrió un error",
                variant: "destructive",
            });
        }
    };

    if (!course) {
        return <div>Cargando...</div>;
    }

    // Filter out already enrolled students
    const enrolledIds = course.enrollments?.map((e: Enrollment) => e.student.id) || [];
    const studentsToEnroll = availableStudents.filter(
        (s) => !enrolledIds.includes(s.id)
    );

    return (
        <div className="space-y-8 pt-6 px-6 pb-6">
            {/* Modern Info Cards - Neutral & Protagonist */}
            <div className="grid gap-8 md:grid-cols-3">
                {/* Profesor Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                            <UserPlus className="h-5 w-5" />
                        </div>
                        <h3 className="text-slate-800 font-bold text-sm uppercase tracking-wider">Profesor</h3>
                    </div>
                    <Select
                        value={course.teacherId || course.teacher?.id || "unassigned"}
                        onValueChange={async (value) => {
                            if (value === "unassigned") return;
                            try {
                                await fetch(`/api/courses/${courseId}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ teacherId: value })
                                });
                                fetchCourseDetail();
                                toast({ title: "Profesor asignado" });
                            } catch (error) {
                                toast({ title: "Error al asignar profesor", variant: "destructive" });
                            }
                        }}
                    >
                        <SelectTrigger className="w-full bg-slate-50 border-slate-200 font-bold text-slate-700 h-12 rounded-xl">
                            <SelectValue placeholder="Seleccionar profesor" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="unassigned" className="font-bold">Sin asignar</SelectItem>
                            {teachers.map((t) => (
                                <SelectItem key={t.id} value={t.id} className="font-bold">
                                    {t.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Horario Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                            <Clock size={20} />
                        </div>
                        <h3 className="text-slate-800 font-bold text-sm uppercase tracking-wider">Horario</h3>
                    </div>
                    <div className="text-slate-900 text-2xl font-black tracking-tight">{course.schedule || "No definido"}</div>
                </div>

                {/* Salón Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                            <DoorOpen size={20} />
                        </div>
                        <h3 className="text-slate-800 font-bold text-sm uppercase tracking-wider">Salón</h3>
                    </div>
                    <div className="text-slate-900 text-2xl font-black tracking-tight">{course.room || "No asignado"}</div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Alumnos Inscritos</CardTitle>
                            <CardDescription>
                                {course.enrollments?.length || 0} alumno(s) en este curso
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleExportPDF}
                                className="button-modern gradient-blue flex items-center gap-2 py-2 px-6 rounded-xl text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
                            >
                                <Download className="h-4 w-4" />
                                PDF
                            </button>
                            <button
                                onClick={handleExportExcel}
                                disabled={exporting}
                                className="button-modern gradient-blue flex items-center gap-2 py-2 px-6 rounded-xl text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
                            >
                                <FileSpreadsheet className="h-4 w-4" />
                                Excel
                            </button>
                            <button
                                onClick={handleExportReportCards}
                                disabled={exporting}
                                className="button-modern gradient-blue flex items-center gap-2 py-2 px-6 rounded-xl text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
                            >
                                <FileText className="h-4 w-4" />
                                Boletas PDF
                            </button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-2 mb-6">
                        <Dialog open={isEnrollOpen} onOpenChange={setIsEnrollOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Inscribir Alumnos
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Inscribir Alumnos</DialogTitle>
                                    <DialogDescription>
                                        Selecciona los alumnos a inscribir en este curso
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-2 py-4">
                                    {studentsToEnroll.map((student) => (
                                        <div
                                            key={student.id}
                                            className="flex items-center space-x-2 p-2 hover:bg-muted rounded"
                                        >
                                            <Checkbox
                                                checked={selectedStudents.includes(student.id)}
                                                onCheckedChange={() => toggleStudent(student.id)}
                                            />
                                            <label className="flex-1 cursor-pointer">
                                                {student.lastName}, {student.firstName} -{" "}
                                                {student.matricula}
                                            </label>
                                        </div>
                                    ))}
                                    {studentsToEnroll.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            Todos los alumnos ya están inscritos
                                        </div>
                                    )}
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleEnrollStudents}>
                                        Inscribir {selectedStudents.length} alumno(s)
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Alumno</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Matrícula</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Contacto</th>
                                    <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {course.enrollments?.map((enrollment: Enrollment, index: number) => (
                                    <tr
                                        key={enrollment.id}
                                        className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                                        style={{
                                            backgroundColor: index % 2 === 1 ? '#F8FAFC' : '#FFFFFF'
                                        }}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                                                    style={{ backgroundColor: '#EA580C' }}
                                                >
                                                    {enrollment.student.firstName[0]}{enrollment.student.lastName[0]}
                                                </div>
                                                <div className="font-semibold text-slate-900">
                                                    {enrollment.student.firstName} {enrollment.student.lastName}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className="font-mono text-slate-600 bg-slate-50">
                                                {enrollment.student.matricula}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Mail size={14} className="text-slate-400" />
                                                {enrollment.student.email || "—"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/dashboard/students/${enrollment.student.id}/notes`}>
                                                    <button
                                                        style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '10px',
                                                            backgroundColor: 'white',
                                                            border: '1px solid #E2E8F0',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                        className="hover:bg-blue-50 transition-colors"
                                                    >
                                                        <MessageSquare size={16} className="text-blue-500" />
                                                    </button>
                                                </Link>
                                                <button
                                                    onClick={() => handleUnenroll(enrollment.id)}
                                                    style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '10px',
                                                        backgroundColor: 'white',
                                                        border: '1px solid #E2E8F0',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                    className="hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 size={16} className="text-red-500" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {(!course.enrollments || course.enrollments.length === 0) && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="text-center py-12 text-slate-400"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <User size={32} className="opacity-20" />
                                                <p>No hay alumnos inscritos en este curso</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
