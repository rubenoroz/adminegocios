"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PremiumSelect } from "@/components/ui/premium-select";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Save, User, BookOpen, Plus, X, Check } from "lucide-react";
import { useRouter } from "next/navigation";

// Sub-component for managing authorized teachers
function AuthorizedTeachersSection({ courseId }: { courseId: string }) {
    const [authorizedTeachers, setAuthorizedTeachers] = useState<any[]>([]);
    const [allEmployees, setAllEmployees] = useState<any[]>([]);
    const [showSelector, setShowSelector] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchAuthorizedTeachers();
        fetchEmployees();
    }, [courseId]);

    const fetchAuthorizedTeachers = async () => {
        try {
            const res = await fetch(`/api/courses/${courseId}/teachers`);
            if (res.ok) {
                const data = await res.json();
                setAuthorizedTeachers(data);
            }
        } catch (error) {
            console.error("Failed to fetch authorized teachers", error);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await fetch("/api/employees?role=TEACHER");
            if (res.ok) {
                const data = await res.json();
                setAllEmployees(data);
            }
        } catch (error) {
            console.error("Failed to fetch employees", error);
        }
    };

    const handleAddTeacher = async (employeeId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/courses/${courseId}/teachers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ employeeIds: [employeeId] })
            });
            if (res.ok) {
                toast({ title: "Profesor agregado" });
                fetchAuthorizedTeachers();
            }
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setLoading(false);
            setShowSelector(false);
        }
    };

    const handleRemoveTeacher = async (employeeId: string) => {
        try {
            const res = await fetch(`/api/courses/${courseId}/teachers?employeeId=${employeeId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                toast({ title: "Profesor removido" });
                fetchAuthorizedTeachers();
            }
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        }
    };

    // Filter out already-added teachers
    const availableEmployees = allEmployees.filter(
        emp => !authorizedTeachers.some(at => at.employeeId === emp.id)
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Teacher Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {authorizedTeachers.map((at) => (
                    <div
                        key={at.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            border: '2px solid #E5E7EB',
                            backgroundColor: '#F9FAFB',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {/* Avatar */}
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: at.employee?.color || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '12px'
                        }}>
                            {at.employee?.firstName?.[0]}{at.employee?.lastName?.[0]}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '14px', color: '#1F2937' }}>
                            {at.employee?.firstName} {at.employee?.lastName}
                        </span>
                        {/* Remove Button */}
                        <button
                            type="button"
                            onClick={() => handleRemoveTeacher(at.employeeId)}
                            style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: '#FEE2E2',
                                color: '#DC2626',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}

                {/* Add Button */}
                <button
                    type="button"
                    onClick={() => setShowSelector(!showSelector)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        border: '2px dashed #D1D5DB',
                        backgroundColor: showSelector ? '#F3F4F6' : '#FFFFFF',
                        color: '#6B7280',
                        fontWeight: 600,
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <Plus size={18} />
                    Agregar Profesor
                </button>
            </div>

            {/* Selector Dropdown */}
            {showSelector && availableEmployees.length > 0 && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#FFFFFF',
                    maxHeight: '200px',
                    overflowY: 'auto'
                }}>
                    {availableEmployees.map((emp) => (
                        <div
                            key={emp.id}
                            onClick={() => handleAddTeacher(emp.id)}
                            style={{
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 12px',
                                borderRadius: '10px',
                                border: '2px solid #D1D5DB',
                                backgroundColor: '#FFFFFF',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{
                                width: '24px',
                                height: '24px',
                                minWidth: '24px',
                                borderRadius: '6px',
                                border: '2px solid #6B7280',
                                backgroundColor: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }} />
                            <span style={{ fontWeight: 600, fontSize: '14px', color: '#1F2937' }}>
                                {emp.firstName} {emp.lastName}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {showSelector && availableEmployees.length === 0 && (
                <p style={{ fontSize: '13px', color: '#6B7280', fontStyle: 'italic' }}>
                    No hay más profesores disponibles para agregar.
                </p>
            )}
        </div>
    );
}

interface CourseDetailProps {
    courseId: string;
}

export function CourseDetail({ courseId }: CourseDetailProps) {
    const [course, setCourse] = useState<any>(null);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        teacherId: "unassigned"
    });

    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        fetchCourseDetail();
        fetchTeachers();
    }, [courseId]);

    useEffect(() => {
        if (course) {
            setFormData({
                name: course.name || "",
                description: course.description || "",
                teacherId: course.teacherId || course.teacher?.id || "unassigned"
            });
        }
    }, [course]);

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

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/courses/${courseId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    teacherId: formData.teacherId === "unassigned" ? null : formData.teacherId
                })
            });

            if (res.ok) {
                toast({ title: "Curso actualizado", description: "Los cambios se han guardado." });
                fetchCourseDetail();
            } else {
                throw new Error("Failed to update");
            }
        } catch (error) {
            toast({ title: "Error", description: "No se pudo actualizar el curso.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("¿ESTÁS SEGURO? Esta acción eliminará el curso permanentemente y no se puede deshacer.")) return;

        try {
            const res = await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
            if (res.ok) {
                toast({ title: "Curso eliminado" });
                router.push("/dashboard/courses");
            } else {
                throw new Error("Failed to delete");
            }
        } catch (error) {
            toast({ title: "Error", description: "No se pudo eliminar el curso.", variant: "destructive" });
        }
    };

    if (!course) return <div className="p-8 text-center text-slate-500">Cargando configuración...</div>;

    return (
        <div className="space-y-8 max-w-4xl mx-auto pt-6">

            {/* Header Section */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Propiedades del Curso</h2>
                <p className="text-slate-500">Administra la información básica, asignaciones y configuración general.</p>
            </div>

            {/* General Settings Card */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        Información General
                    </CardTitle>
                    <CardDescription>
                        Detalles básicos visibles para estudiantes y profesores.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre del Curso</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej. Matemáticas Avanzadas"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe los objetivos y contenido del curso..."
                            className="min-h-[100px]"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Authorized Teachers Section */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-purple-600" />
                        Profesores Autorizados
                    </CardTitle>
                    <CardDescription>
                        Profesores habilitados para impartir grupos de este curso.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AuthorizedTeachersSection courseId={courseId} />
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <div className="pt-8">
                <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                    <h3 className="text-red-900 font-bold mb-2 flex items-center gap-2">
                        <Trash2 className="h-5 w-5" />
                        Zona de Peligro
                    </h3>
                    <p className="text-red-700 text-sm mb-4">
                        Eliminar este curso borrará permanentemente todos los datos asociados, incluyendo calificaciones y asistencias. Esta acción no se puede deshacer.
                    </p>
                    <button
                        type="button"
                        onClick={handleDelete}
                        style={{
                            height: '44px',
                            padding: '0 24px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                            color: '#FFFFFF',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Trash2 size={16} color="#FFFFFF" />
                        Eliminar Curso Permanentemente
                    </button>
                </div>
            </div>

        </div>
    );
}
