"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, Trash2, Users, Mail, User } from "lucide-react";
import { SimpleDropdown } from "@/components/ui/simple-dropdown";
import { useBranch } from "@/context/branch-context";
import { useToast } from "@/components/ui/use-toast";

interface Student {
    id: string;
    firstName: string;
    lastName: string;
    matricula?: string;
    email?: string;
}

interface CourseStudentsManagerProps {
    courseId: string;
    onUpdate?: () => void;
}

export function CourseStudentsManager({ courseId, onUpdate }: CourseStudentsManagerProps) {
    const { selectedBranch } = useBranch();
    const [students, setStudents] = useState<Student[]>([]);
    const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (selectedBranch) {
            fetchStudents();
        }
        fetchEnrollments();
    }, [courseId, selectedBranch]);

    const fetchStudents = async () => {
        if (!selectedBranch?.id) return;
        try {
            const res = await fetch(`/api/students?branchId=${selectedBranch.id}`);
            const data = await res.json();
            setStudents(data);
        } catch (error) {
            console.error("Error fetching students:", error);
        }
    };

    const fetchEnrollments = async () => {
        try {
            const res = await fetch(`/api/enrollments?courseId=${courseId}`);
            const data = await res.json();
            setEnrolledStudents(data.map((e: any) => e.student));
        } catch (error) {
            console.error("Error fetching enrollments:", error);
        }
    };

    const handleEnroll = async (studentId: string) => {
        setLoading(true);
        try {
            const res = await fetch("/api/enrollments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentIds: [studentId], courseId })
            });

            if (!res.ok) throw new Error("Failed to enroll");

            fetchEnrollments();
            toast({
                title: "Alumno inscrito",
                description: "Se ha inscrito al alumno correctamente.",
            });
            onUpdate?.(); // Refresh parent KPI cards
        } catch (error) {
            console.error("Error enrolling student:", error);
            toast({
                title: "Error",
                description: "No se pudo inscribir al alumno.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUnenroll = async (studentId: string) => {
        if (!confirm("¿Desinscribir alumno?")) return;

        try {
            const res = await fetch(`/api/enrollments?courseId=${courseId}`);
            const data = await res.json();
            const enrollment = data.find((e: any) => e.student.id === studentId);

            if (enrollment) {
                const deleteRes = await fetch(`/api/enrollments?enrollmentId=${enrollment.id}`, {
                    method: "DELETE"
                });

                if (!deleteRes.ok) throw new Error("Failed to unenroll");

                fetchEnrollments();
                toast({
                    title: "Alumno desinscrito",
                    description: "Se ha eliminado la inscripción.",
                });
                onUpdate?.(); // Refresh parent KPI cards
            }
        } catch (error) {
            console.error("Error unenrolling student:", error);
            toast({
                title: "Error",
                description: "No se pudo desinscribir al alumno.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-6 pt-6 px-6 pb-6">
            {/* Action Bar Section */}
            <div className="flex justify-end items-center mb-8">
                <SimpleDropdown
                    trigger={
                        <button className="button-modern flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-sm py-2 px-6">
                            <UserPlus className="h-4 w-4" />
                            Inscribir Alumno
                        </button>
                    }
                    options={students
                        .filter(s => !enrolledStudents.find(e => e.id === s.id))
                        .map(student => ({
                            value: student.id,
                            label: `${student.firstName} ${student.lastName}`
                        }))}
                    onSelect={handleEnroll}
                    searchPlaceholder="Buscar alumno..."
                    emptyMessage="No hay alumnos disponibles"
                    searchable={true}
                />
            </div>

            {/* Student List based on User's Reference */}
            {enrolledStudents.length === 0 ? (
                <div className="bg-white rounded-lg border border-slate-200">
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
                            <tr>
                                <td colSpan={4} className="text-center py-12 text-slate-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <User size={32} className="opacity-20" />
                                        <p>No hay alumnos inscritos todavía</p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            ) : (
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
                            {enrolledStudents.map((student, index) => (
                                <tr
                                    key={student.id}
                                    className="border-b border-gray-100 transition-colors hover:bg-slate-50"
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
                                                {student.firstName[0]}{student.lastName[0]}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-900">
                                                    {student.firstName} {student.lastName}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-block px-2 py-1 rounded bg-slate-100 font-mono text-sm text-slate-600 border border-slate-200">
                                            {student.matricula || "—"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Mail size={14} className="text-slate-400" />
                                            {student.email || "—"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleUnenroll(student.id)}
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
                                                title="Eliminar inscripción"
                                            >
                                                <Trash2 size={16} className="text-red-500" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Footer Summary */}
            {enrolledStudents.length > 0 && (
                <div className="text-right text-gray-500 text-sm mt-4">
                    Total: <span className="font-semibold text-gray-900">{enrolledStudents.length} alumnos</span>
                </div>
            )}
        </div>
    );
}
