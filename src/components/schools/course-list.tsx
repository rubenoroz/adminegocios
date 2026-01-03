"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, BookOpen, Users, Trash2, Eye, Clock, MapPin, User, TrendingUp, Check, X, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ModernPageHeader } from "@/components/ui/modern-page-header";
import { StatsCard } from "@/components/ui/stats-card";
import { ModernFilterBar } from "@/components/ui/modern-filter-bar";
import { ModernInput } from "@/components/ui/modern-components";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CourseScheduleSelector } from "@/components/schools/course-schedule-selector";
import { useBranch } from "@/context/branch-context";
import { Checkbox } from "@/components/ui/checkbox";
import { BranchMultiSelector } from "@/components/shared/branch-multi-selector";
import { ClassroomManager } from "@/components/schools/classroom-manager";
import Link from "next/link";
import { CourseCard } from "@/components/schools/course-card";

interface Course {
    id: string;
    name: string;
    description: string | null;
    schedule: string | null;
    room: string | null;
    teacher: {
        id: string;
        name: string;
    } | null;
    _count: {
        enrollments: number;
    };
    branches?: { id: string; name: string }[];
}

interface Teacher {
    id: string;
    name: string;
    email: string;
}

export function CourseList() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [filterCourse, setFilterCourse] = useState<string[]>([]);
    const { toast } = useToast();
    const { branches, selectedBranch } = useBranch();

    // Form states
    const [newName, setNewName] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [newTeacherId, setNewTeacherId] = useState("");
    const [newSchedules, setNewSchedules] = useState<any[]>([]);
    const [newClassroomId, setNewClassroomId] = useState("");
    const [newBranchIds, setNewBranchIds] = useState<string[]>([]);

    // Edit states
    const [editOpen, setEditOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<any>(null);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const url = selectedBranch
                ? `/api/courses?branchId=${selectedBranch.id}`
                : "/api/courses";
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setCourses(data);
            }
        } catch (error) {
            console.error("Failed to fetch courses", error);
        } finally {
            setLoading(false);
        }
    };

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

    const fetchClassrooms = async () => {
        try {
            const res = await fetch("/api/classrooms");
            if (res.ok) {
                const data = await res.json();
                setClassrooms(data);
            }
        } catch (error) {
            console.error("Error fetching classrooms:", error);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, [selectedBranch]);

    useEffect(() => {
        fetchTeachers();
        fetchClassrooms();
    }, []);

    const handleConflictCheck = async (schedule: any) => {
        if (!newClassroomId) return { hasConflict: false };

        for (const localSchedule of newSchedules) {
            const commonDays = schedule.days.filter((d: number) => localSchedule.days.includes(d));
            if (commonDays.length > 0) {
                const overlap = (
                    (schedule.startTime >= localSchedule.startTime && schedule.startTime < localSchedule.endTime) ||
                    (schedule.endTime > localSchedule.startTime && schedule.endTime <= localSchedule.endTime) ||
                    (schedule.startTime <= localSchedule.startTime && schedule.endTime >= localSchedule.endTime)
                );

                if (overlap) {
                    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
                    return {
                        hasConflict: true,
                        conflictingCourse: `Conflicto local con ${dayNames[commonDays[0]]}`
                    };
                }
            }
        }

        try {
            const res = await fetch("/api/courses/validate-schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    classroomId: newClassroomId,
                    days: schedule.days,
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                }),
            });
            if (res.ok) return await res.json();
        } catch (error) {
            console.error("Error checking conflicts:", error);
        }
        return { hasConflict: false };
    };

    const toggleSelection = (id: string) => {
        console.log("Toggling selection for:", id);
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectionMode = () => {
        const nextMode = !isSelectionMode;
        console.log("Setting Selection Mode to:", nextMode);
        setIsSelectionMode(nextMode);
        if (!nextMode) setSelectedIds([]);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`¿Eliminar ${selectedIds.length} cursos permanentemente?`)) return;

        setIsDeletingBulk(true);
        try {
            const res = await fetch("/api/courses", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: selectedIds }),
            });

            if (res.ok) {
                toast({ title: "Cursos eliminados exitosamente" });
                setSelectedIds([]);
                setIsSelectionMode(false);
                fetchCourses();
            }
        } catch (error) {
            toast({ title: "Error al eliminar cursos", variant: "destructive" });
        } finally {
            setIsDeletingBulk(false);
        }
    };

    const handleCreate = async () => {
        try {
            const res = await fetch("/api/courses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newName,
                    description: newDescription,
                    teacherId: newTeacherId === "none" ? null : newTeacherId || null,
                    classroomId: newClassroomId === "none" ? null : newClassroomId || null,
                    schedules: newSchedules,
                    branchIds: newBranchIds
                }),
            });

            if (res.ok) {
                toast({ title: "Curso creado exitosamente" });
                setIsCreateOpen(false);
                fetchCourses();
                setNewName("");
                setNewDescription("");
                setNewTeacherId("");
                setNewSchedules([]);
                setNewClassroomId("");
                setNewBranchIds([]);
            }
        } catch (error) {
            toast({ title: "Error al crear curso", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este curso?")) return;
        try {
            const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast({ title: "Curso eliminado" });
                fetchCourses();
            }
        } catch (error) {
            toast({ title: "Error al eliminar", variant: "destructive" });
        }
    };

    // EDIT FUNCTIONALITY
    const handleEdit = (course: Course) => {
        setEditingCourse({
            ...course,
            branchIds: course.branches?.map(b => b.id) || []
        });
        setEditOpen(true);
    };

    const handleUpdateCourse = async () => {
        if (!editingCourse) return;
        try {
            const res = await fetch(`/api/courses/${editingCourse.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editingCourse.name,
                    description: editingCourse.description,
                    teacherId: editingCourse.teacher?.id || null,
                    classroomId: editingCourse.classroom?.id || null
                })
            });

            if (res.ok) {
                toast({ title: "Curso actualizado" });
                setEditOpen(false);
                setEditingCourse(null);
                fetchCourses();
            } else {
                toast({ title: "Error al actualizar", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error al actualizar", variant: "destructive" });
        }
    };

    const filteredCourses = courses.filter(course => {
        const matchesSearch = searchValue === "" ||
            course.name.toLowerCase().includes(searchValue.toLowerCase()) ||
            course.teacher?.name.toLowerCase().includes(searchValue.toLowerCase());

        const matchesFilter = filterCourse.length === 0 ||
            (filterCourse.includes("WITH_TEACHER") && course.teacher) ||
            (filterCourse.includes("NO_TEACHER") && !course.teacher) ||
            (filterCourse.includes("WITH_STUDENTS") && course._count.enrollments > 0);

        return matchesSearch && matchesFilter;
    });

    const totalCourses = courses.length;
    const totalStudents = courses.reduce((sum, c) => sum + c._count.enrollments, 0);
    const avgStudentsPerCourse = totalCourses > 0 ? Math.round(totalStudents / totalCourses) : 0;
    const coursesWithTeacher = courses.filter(c => c.teacher).length;

    const cardGradients = [
        "from-blue-600 to-blue-500",
        "from-purple-600 to-purple-500",
        "from-pink-600 to-pink-500",
        "from-orange-600 to-orange-500",
        "from-green-600 to-green-500",
        "from-teal-600 to-teal-500",
    ];

    return (
        <div className="bg-slate-100 pb-16">
            {/* HEADER - MISMO PATRÓN QUE EMPLEADOS/ALUMNOS */}
            <div style={{
                padding: 'var(--spacing-lg)',
                marginBottom: '64px',
                position: 'relative',
                zIndex: 10
            }}>
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
                        Cursos
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Gestiona tus cursos y asignaturas
                    </p>
                </div>
            </div>

            {/* KPIS - MISMO PATRÓN QUE EMPLEADOS */}
            <motion.div
                style={{ padding: '0 var(--spacing-lg)', marginBottom: '48px' }}
                initial="hidden"
                animate="show"
                variants={{
                    hidden: { opacity: 0 },
                    show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.1 }
                    }
                }}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                    <ModernKpiCard
                        title="Total Cursos"
                        value={totalCourses.toString()}
                        icon={BookOpen}
                        gradientClass="gradient-courses"
                        subtitle="Cursos activos"
                    />
                    <ModernKpiCard
                        title="Total Estudiantes"
                        value={totalStudents.toString()}
                        icon={Users}
                        gradientClass="gradient-students"
                        subtitle="Inscritos en cursos"
                    />
                    <ModernKpiCard
                        title="Promedio"
                        value={avgStudentsPerCourse.toString()}
                        icon={TrendingUp}
                        gradientClass="gradient-employees"
                        subtitle="Alumnos por curso"
                    />
                    <ModernKpiCard
                        title="Con Profesor"
                        value={coursesWithTeacher.toString()}
                        icon={User}
                        gradientClass="gradient-finance"
                        subtitle="Cursos asignados"
                    />
                </div>
            </motion.div>

            {/* SECCIÓN SALONES - BLOQUE INTERMEDIO */}
            <section style={{ padding: '0 var(--spacing-lg)' }} className="mt-8 mb-8">
                <div className="bg-white rounded-2xl shadow-sm px-6 py-5">
                    <ClassroomManager />
                </div>
            </section>

            {/* FILTROS Y BOTONES DE ACCIÓN */}
            <div style={{ padding: '0 var(--spacing-lg)', marginBottom: '24px', marginTop: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    {/* BARRA DE BÚSQUEDA */}
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <ModernFilterBar
                            searchValue={searchValue}
                            onSearchChange={setSearchValue}
                            placeholder="Buscar cursos..."
                            filters={[
                                { label: "Con Profesor", value: "WITH_TEACHER", color: "green" },
                                { label: "Sin Profesor", value: "NO_TEACHER", color: "orange" },
                                { label: "Con Alumnos", value: "WITH_STUDENTS", color: "blue" }
                            ]}
                            activeFilters={filterCourse}
                            onFilterToggle={(value) => {
                                setFilterCourse(prev =>
                                    prev.includes(value)
                                        ? prev.filter(v => v !== value)
                                        : [...prev, value]
                                );
                            }}
                        />
                    </div>

                    {/* BOTONES DE ACCIÓN */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button
                            onClick={toggleSelectionMode}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 20px',
                                borderRadius: '12px',
                                border: isSelectionMode ? 'none' : '1px solid #e2e8f0',
                                backgroundColor: isSelectionMode ? '#1e293b' : 'white',
                                color: isSelectionMode ? 'white' : '#475569',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                            }}
                        >
                            {isSelectionMode ? <X size={18} /> : <Trash2 size={18} />}
                            {isSelectionMode ? 'Cancelar' : 'Gestionar'}
                        </button>

                        <Dialog open={isCreateOpen} onOpenChange={(open) => {
                            setIsCreateOpen(open);
                            if (open) fetchClassrooms();
                        }}>
                            <DialogTrigger asChild>
                                <button style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 20px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                                }}>
                                    <Plus size={18} />
                                    Nuevo Curso
                                </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                                        Crear Nuevo Curso
                                    </DialogTitle>
                                    <DialogDescription className="sr-only">
                                        Formulario para crear un nuevo curso
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-6 py-4">
                                    <ModernInput label="Nombre del Curso" value={newName} onChange={setNewName} />
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Descripción</label>
                                        <textarea
                                            value={newDescription}
                                            onChange={(e) => setNewDescription(e.target.value)}
                                            placeholder="Descripción del curso..."
                                            className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-blue-600 focus:outline-none transition-colors resize-none"
                                            rows={3}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Profesor</label>
                                            <Select value={newTeacherId} onValueChange={setNewTeacherId}>
                                                <SelectTrigger className="w-full bg-white border-2 border-border h-12 rounded-xl">
                                                    <SelectValue placeholder="Seleccionar profesor..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Sin asignar</SelectItem>
                                                    {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Salón</label>
                                            <Select value={newClassroomId} onValueChange={setNewClassroomId}>
                                                <SelectTrigger className="w-full bg-white border-2 border-border h-12 rounded-xl">
                                                    <SelectValue placeholder="Seleccionar salón..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Sin asignar</SelectItem>
                                                    {classrooms.map((c) => (
                                                        <SelectItem key={c.id} value={c.id}>
                                                            {c.name} {c.branch ? `(${c.branch.name})` : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <CourseScheduleSelector
                                        value={newSchedules}
                                        onChange={setNewSchedules}
                                        classroomId={newClassroomId}
                                        classroomName={classrooms.find(c => c.id === newClassroomId)?.name}
                                        onConflictCheck={handleConflictCheck}
                                    />

                                </div>
                                <DialogFooter>
                                    <button
                                        onClick={handleCreate}
                                        disabled={!newName}
                                        style={{
                                            padding: '12px 24px',
                                            borderRadius: '12px',
                                            border: 'none',
                                            backgroundColor: '#2563eb',
                                            color: 'white',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            opacity: !newName ? 0.5 : 1
                                        }}
                                    >
                                        Crear Curso
                                    </button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div >

            {/* BARRA DE ACCIONES DE GESTIÓN - ARRIBA DE LAS CARDS */}
            {
                isSelectionMode && (
                    <div style={{
                        padding: '0 var(--spacing-lg)',
                        marginBottom: '24px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px 24px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '16px',
                            border: '2px dashed #cbd5e1'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '16px'
                                }}>
                                    {selectedIds.length}
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                                    {selectedIds.length === 0 ? 'Haz clic en los cursos para seleccionarlos' : 'cursos seleccionados'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setSelectedIds(filteredCourses.map(c => c.id))}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '10px',
                                        border: '1px solid #e2e8f0',
                                        backgroundColor: 'white',
                                        color: '#475569',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Seleccionar todos
                                </button>
                                {selectedIds.length > 0 && (
                                    <button
                                        onClick={handleBulkDelete}
                                        disabled={isDeletingBulk}
                                        style={{
                                            padding: '10px 20px',
                                            borderRadius: '10px',
                                            border: 'none',
                                            backgroundColor: '#ef4444',
                                            color: 'white',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <Trash2 size={16} />
                                        Eliminar seleccionados
                                    </button>
                                )}
                                <button
                                    onClick={toggleSelectionMode}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '10px',
                                        border: '1px solid #e2e8f0',
                                        backgroundColor: 'white',
                                        color: '#64748b',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* COURSE CARDS GRID */}
            <section style={{ padding: '0 var(--spacing-lg)', minHeight: '400px' }} className="pb-8">
                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="animate-spin w-12 h-12 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-slate-500">Cargando cursos...</p>
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">📚</div>
                        <p className="text-slate-500 text-lg">No hay cursos disponibles</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '32px' }}>
                        {filteredCourses.map((course, index) => {
                            const isSelected = selectedIds.includes(course.id);
                            const courseColors: Record<number, { bg: string; accent: string }> = {
                                0: { bg: '#DBEAFE', accent: '#2563EB' },
                                1: { bg: '#EDE9FE', accent: '#7C3AED' },
                                2: { bg: '#FCE7F3', accent: '#DB2777' },
                                3: { bg: '#FFEDD5', accent: '#EA580C' },
                                4: { bg: '#D1FAE5', accent: '#059669' },
                                5: { bg: '#CCFBF1', accent: '#0D9488' },
                            };
                            const colors = courseColors[index % 6];

                            return (
                                <div
                                    key={course.id}
                                    className={`course-card ${isSelectionMode ? 'cursor-pointer' : ''}`}
                                    style={{
                                        backgroundColor: colors.bg,
                                        borderRadius: '20px',
                                        padding: '28px',
                                        minHeight: '280px',
                                        boxShadow: isSelected ? '0 0 0 3px #2563EB' : '0 10px 40px rgba(0,0,0,0.12)',
                                        display: 'flex',
                                        flexDirection: 'column' as const,
                                        position: 'relative' as const
                                    }}
                                    onClick={() => isSelectionMode && toggleSelection?.(course.id)}
                                >
                                    {isSelectionMode && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: '16px',
                                                right: '16px',
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '6px',
                                                backgroundColor: isSelected ? colors.accent : 'white',
                                                border: isSelected ? 'none' : '2px solid #E2E8F0',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            onClick={(e) => { e.stopPropagation(); toggleSelection(course.id); }}
                                        >
                                            {isSelected && <Check size={14} color="white" />}
                                        </div>
                                    )}

                                    {/* ICONO */}
                                    <div
                                        style={{
                                            width: '72px',
                                            height: '72px',
                                            borderRadius: '16px',
                                            backgroundColor: colors.accent,
                                            color: 'white',
                                            fontSize: '28px',
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '20px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                        }}
                                    >
                                        <BookOpen size={32} />
                                    </div>

                                    {/* NOMBRE */}
                                    <h3 style={{
                                        fontSize: '22px',
                                        fontWeight: 'bold',
                                        color: '#1E293B',
                                        marginBottom: '8px'
                                    }}>
                                        {course.name}
                                    </h3>

                                    {/* PROFESOR (como rol) */}
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '6px 14px',
                                            backgroundColor: 'rgba(255,255,255,0.8)',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            color: colors.accent,
                                        }}>
                                            {course.teacher?.name || 'Sin profesor'}
                                        </span>
                                        {/* INDICADOR SUCURSAL */}
                                        {course.branches && course.branches.length > 0 ? (
                                            course.branches.map(b => (
                                                <span key={b.id} style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    padding: '6px 12px',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                                                    borderRadius: '20px',
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    color: '#475569',
                                                }}>
                                                    📍 {b.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '6px 12px',
                                                backgroundColor: 'rgba(255, 255, 255, 0.6)',
                                                borderRadius: '20px',
                                                fontSize: '11px',
                                                fontWeight: '600',
                                                color: '#475569',
                                            }}>
                                                🌐 Global
                                            </span>
                                        )}
                                    </div>

                                    {/* INFO (flex-1 para empujar el footer) */}
                                    <div style={{ flex: 1, fontSize: '14px', color: '#475569' }}>
                                        {course.schedule && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Clock size={14} /> {course.schedule}
                                            </div>
                                        )}
                                    </div>

                                    {/* FOOTER - MISMO PATRÓN: VALOR DESTACADO + BOTONES */}
                                    {!isSelectionMode && (
                                        <div style={{
                                            marginTop: '16px',
                                            paddingTop: '16px',
                                            borderTop: '2px solid rgba(255,255,255,0.5)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}>
                                            <div>
                                                <div style={{ fontSize: '28px', fontWeight: '900', color: '#0F172A' }}>
                                                    {course._count.enrollments}
                                                </div>
                                                <div style={{ fontSize: '10px', fontWeight: 'bold', color: colors.accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    Alumnos
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <Link href={`/dashboard/courses/${course.id}`}>
                                                    <button style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '10px',
                                                        backgroundColor: 'white',
                                                        border: 'none',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <Eye size={18} color={colors.accent} />
                                                    </button>
                                                </Link>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(course); }}
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '10px',
                                                        backgroundColor: 'white',
                                                        border: 'none',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                    title="Editar curso"
                                                >
                                                    <Edit size={18} color={colors.accent} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(course.id); }}
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '10px',
                                                        backgroundColor: 'white',
                                                        border: 'none',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    <Trash2 size={18} color="#EF4444" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Floating Bulk Action Bar */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-3xl px-6"
                    >
                        <div className="bg-slate-900 text-white p-4 rounded-[2rem] shadow-2xl flex items-center justify-between gap-6 border border-white/10 backdrop-blur-2xl bg-slate-900/90 ring-1 ring-white/10">
                            <div className="flex items-center gap-5 pl-2">
                                <div className="w-16 h-16 rounded-[1.2rem] bg-indigo-600 flex items-center justify-center font-black text-3xl shadow-lg shadow-indigo-500/30 text-white">
                                    {selectedIds.length}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-white text-lg leading-tight">CURSOS SELECCIONADOS</span>
                                    <span className="text-xs text-indigo-300 font-medium">Gestionar selección múltiple</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 pr-2">
                                <button
                                    onClick={() => setSelectedIds(filteredCourses.map(c => c.id))}
                                    className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                >
                                    Todos
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={isDeletingBulk}
                                    className="h-14 px-8 bg-red-600 hover:bg-red-500 text-white rounded-[1.2rem] font-bold flex items-center gap-3 shadow-lg shadow-red-600/20 active:scale-95 transition-all ml-2"
                                >
                                    {isDeletingBulk ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 size={20} />}
                                    ELIMINAR
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Course Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Edit size={20} className="text-blue-500" />
                            Editar Curso
                        </DialogTitle>
                        <DialogDescription className="sr-only">Formulario para editar curso</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <ModernInput
                            label="Nombre del Curso"
                            value={editingCourse?.name || ""}
                            onChange={(val) => setEditingCourse({ ...editingCourse, name: val })}
                        />
                        <ModernInput
                            label="Descripción"
                            value={editingCourse?.description || ""}
                            onChange={(val) => setEditingCourse({ ...editingCourse, description: val })}
                        />

                        {/* Teacher Selector */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">Maestro</label>
                            <Select
                                value={editingCourse?.teacher?.id || ""}
                                onValueChange={(val) => setEditingCourse({
                                    ...editingCourse,
                                    teacher: teachers.find(t => t.id === val) || null
                                })}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Seleccionar maestro" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teachers.map(teacher => (
                                        <SelectItem key={teacher.id} value={teacher.id}>
                                            {teacher.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* CLASSROOM SELECTOR (shows branch) */}
                        <div className="pt-4 border-t border-slate-100">
                            <label className="block text-sm font-medium mb-2">Salón (Sucursal)</label>
                            <Select
                                value={editingCourse?.classroom?.id || "none"}
                                onValueChange={(val) => setEditingCourse({
                                    ...editingCourse,
                                    classroom: val === "none" ? null : classrooms.find(c => c.id === val) || null
                                })}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Seleccionar salón" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sin asignar</SelectItem>
                                    {classrooms.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name} {c.branch ? `(${c.branch.name})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <button
                            onClick={() => setEditOpen(false)}
                            className="button-modern bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleUpdateCourse}
                            className="button-modern bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                        >
                            Guardar Cambios
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
