"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UsersRound, Calendar, Clock, User, Users, MapPin, ChevronRight, X, Save, UserPlus, Check, Loader2, Search, Trash2 } from "lucide-react";
import { useBranch } from "@/context/branch-context";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";
import { ModernFilterBar } from "@/components/ui/modern-filter-bar";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

interface ClassSchedule {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    title: string | null;
    groupName: string | null;
    course: {
        id: string;
        name: string;
        color: string | null;
        teacher: {
            id: string;
            name: string;
        } | null;
    } | null;
    classroom: {
        id: string;
        name: string;
    } | null;
    teacher: {
        id: string;
        name: string;
    } | null;
    _count: {
        enrollments: number;
    };
    enrollments?: Array<{
        student: {
            id: string;
            firstName: string;
            lastName: string;
        };
    }>;
}

interface AggregatedGroup {
    key: string;
    groupName: string | null;
    courseName: string;
    courseId: string | null;
    courseColor: string;
    teacher: { id: string; name: string } | null;
    classroom: { id: string; name: string } | null;
    days: number[];
    startTime: string;
    endTime: string;
    totalEnrollments: number;
    scheduleIds: string[];
    enrolledStudentIds: string[];
}

interface Student {
    id: string;
    firstName: string;
    lastName: string;
}

interface Teacher {
    id: string;
    name: string;
}

interface Classroom {
    id: string;
    name: string;
    capacity?: number;
}

const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const dayNamesFull = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function GroupsList() {
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchValue, setSearchValue] = useState("");
    const [filterDay, setFilterDay] = useState<string[]>([]);

    // Modal state
    const [selectedGroup, setSelectedGroup] = useState<AggregatedGroup | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalSaving, setModalSaving] = useState(false);
    const [modalDeleting, setModalDeleting] = useState(false);

    // Data for modal dropdowns
    const [students, setStudents] = useState<Student[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [courses, setCourses] = useState<Array<{ id: string; name: string }>>([]);

    // Modal form state
    const [modalTeacherId, setModalTeacherId] = useState<string>("");
    const [modalClassroomId, setModalClassroomId] = useState<string>("");
    const [modalSelectedStudents, setModalSelectedStudents] = useState<string[]>([]);
    const [studentSearchQuery, setStudentSearchQuery] = useState("");

    useEffect(() => {
        fetchSchedules();
        fetchStudents();
        fetchTeachers();
        fetchClassrooms();
        fetchCourses();
    }, [selectedBranch]);

    const fetchSchedules = async () => {
        if (!selectedBranch?.businessId) return;
        setLoading(true);
        try {
            // Include enrollments in the response
            const res = await fetch(`/api/class-schedules?businessId=${selectedBranch.businessId}&includeEnrollments=true`);
            if (res.ok) {
                const data = await res.json();
                setSchedules(data);
            }
        } catch (error) {
            console.error("Error fetching schedules:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        if (!selectedBranch?.businessId) return;
        try {
            const res = await fetch(`/api/students?businessId=${selectedBranch.businessId}`);
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
            }
        } catch (error) {
            console.error("Error fetching students:", error);
        }
    };

    const fetchTeachers = async () => {
        if (!selectedBranch?.businessId) return;
        try {
            const res = await fetch(`/api/employees?businessId=${selectedBranch.businessId}`);
            if (res.ok) {
                const data = await res.json();
                // Only include employees that have a valid userId (linked to User table)
                const validTeachers = data
                    .filter((e: any) => e.userId)
                    .map((e: any) => ({ id: e.userId, name: e.name }));
                setTeachers(validTeachers);
            }
        } catch (error) {
            console.error("Error fetching teachers:", error);
        }
    };

    const fetchClassrooms = async () => {
        if (!selectedBranch?.businessId) return;
        try {
            const res = await fetch(`/api/classrooms?businessId=${selectedBranch.businessId}`);
            if (res.ok) {
                const data = await res.json();
                setClassrooms(data);
            }
        } catch (error) {
            console.error("Error fetching classrooms:", error);
        }
    };

    const fetchCourses = async () => {
        if (!selectedBranch?.businessId) return;
        try {
            const res = await fetch(`/api/courses?businessId=${selectedBranch.businessId}`);
            if (res.ok) {
                const data = await res.json();
                setCourses(data);
            }
        } catch (error) {
            console.error("Error fetching courses:", error);
        }
    };

    const openGroupModal = (group: AggregatedGroup) => {
        setSelectedGroup(group);
        setModalTeacherId(group.teacher?.id || "");
        setModalClassroomId(group.classroom?.id || "");
        setModalSelectedStudents(group.enrolledStudentIds);
        setStudentSearchQuery(""); // Reset search
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedGroup(null);
    };

    const toggleStudentSelection = (studentId: string) => {
        setModalSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSaveGroup = async () => {
        if (!selectedGroup) return;
        setModalSaving(true);

        try {
            // Update each schedule in the group
            const updatePromises = selectedGroup.scheduleIds.map(scheduleId =>
                fetch(`/api/class-schedules/${scheduleId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        teacherId: modalTeacherId || null,
                        classroomId: modalClassroomId || null,
                    }),
                })
            );

            await Promise.all(updatePromises);

            // Update enrollments for each schedule - with conflict check
            let hasConflicts = false;
            let conflictMessages: string[] = [];

            for (const scheduleId of selectedGroup.scheduleIds) {
                const res = await fetch("/api/schedule-enrollments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        scheduleId,
                        studentIds: modalSelectedStudents,
                    }),
                });

                if (res.status === 409) {
                    const data = await res.json();
                    if (data.hasConflicts) {
                        hasConflicts = true;
                        data.conflicts.forEach((c: any) => {
                            conflictMessages.push(`${c.studentName} ya tiene "${c.conflictingCourse}" a las ${c.time}`);
                        });
                    }
                }
            }

            if (hasConflicts) {
                // Show conflict warning and ask if user wants to continue
                const shouldContinue = window.confirm(
                    `⚠️ Conflictos de horario detectados:\n\n${conflictMessages.join('\n')}\n\n¿Desea inscribir de todos modos?`
                );

                if (shouldContinue) {
                    // Re-send with skipConflictCheck
                    for (const scheduleId of selectedGroup.scheduleIds) {
                        await fetch("/api/schedule-enrollments", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                scheduleId,
                                studentIds: modalSelectedStudents,
                                skipConflictCheck: true,
                            }),
                        });
                    }
                    toast({ title: "Grupo actualizado", description: "Se guardaron los cambios con conflictos de horario." });
                } else {
                    toast({ title: "Inscripción cancelada", description: "No se realizaron cambios en las inscripciones." });
                    closeModal();
                    fetchSchedules();
                    return;
                }
            } else {
                toast({ title: "Grupo actualizado", description: "Los cambios se guardaron correctamente." });
            }

            closeModal();
            fetchSchedules(); // Refresh data
        } catch (error) {
            console.error("Error saving group:", error);
            toast({ title: "Error", description: "No se pudo guardar los cambios", variant: "destructive" });
        } finally {
            setModalSaving(false);
        }
    };

    const handleDeleteGroup = async () => {
        if (!selectedGroup) return;

        console.log("[DELETE_GROUP] Group to delete:", {
            key: selectedGroup.key,
            groupName: selectedGroup.groupName,
            scheduleIds: selectedGroup.scheduleIds,
            days: selectedGroup.days
        });

        const confirmDelete = window.confirm(
            `¿Estás seguro de eliminar este grupo?\n\nEsto eliminará ${selectedGroup.scheduleIds.length} horario(s) y desinscribirá a ${selectedGroup.totalEnrollments} alumno(s).\n\nEsta acción no se puede deshacer.`
        );

        if (!confirmDelete) return;

        setModalDeleting(true);
        try {
            // Delete all schedules associated with this group
            console.log("[DELETE_GROUP] Deleting schedules:", selectedGroup.scheduleIds);

            const deletePromises = selectedGroup.scheduleIds.map(scheduleId =>
                fetch(`/api/class-schedules/${scheduleId}`, {
                    method: "DELETE",
                })
            );

            const results = await Promise.all(deletePromises);
            console.log("[DELETE_GROUP] Delete results:", results.map(r => r.status));

            toast({ title: "Grupo eliminado", description: "El grupo y sus horarios han sido eliminados." });
            closeModal();
            fetchSchedules();
        } catch (error) {
            console.error("Error deleting group:", error);
            toast({ title: "Error", description: "No se pudo eliminar el grupo", variant: "destructive" });
        } finally {
            setModalDeleting(false);
        }
    };

    // Aggregate schedules by groupName (or by course+time if no groupName)
    const aggregatedGroups = useMemo(() => {
        const groupMap = new Map<string, AggregatedGroup>();

        for (const schedule of schedules) {
            // Create a key for aggregation
            // If groupName exists, use it; otherwise use course+time combination
            const key = schedule.groupName
                ? `group:${schedule.groupName}:${schedule.course?.id || 'no-course'}`
                : `schedule:${schedule.id}`; // Each ungrouped schedule gets its own key

            // Extract enrolled student IDs from this schedule
            const scheduleStudentIds = schedule.enrollments?.map(e => e.student.id) || [];

            if (groupMap.has(key)) {
                const existing = groupMap.get(key)!;
                if (!existing.days.includes(schedule.dayOfWeek)) {
                    existing.days.push(schedule.dayOfWeek);
                    existing.days.sort((a, b) => a - b);
                }
                existing.scheduleIds.push(schedule.id);
                // For grouped schedules, take max enrollment (since students should be in all)
                existing.totalEnrollments = Math.max(existing.totalEnrollments, schedule._count.enrollments);
                // Merge enrolled student IDs (union)
                for (const studentId of scheduleStudentIds) {
                    if (!existing.enrolledStudentIds.includes(studentId)) {
                        existing.enrolledStudentIds.push(studentId);
                    }
                }
            } else {
                groupMap.set(key, {
                    key,
                    groupName: schedule.groupName,
                    courseName: schedule.course?.name || schedule.title || "Grupo sin nombre",
                    courseId: schedule.course?.id || null,
                    courseColor: schedule.course?.color || "#3B82F6",
                    teacher: schedule.teacher || schedule.course?.teacher || null,
                    classroom: schedule.classroom,
                    days: [schedule.dayOfWeek],
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                    totalEnrollments: schedule._count.enrollments,
                    scheduleIds: [schedule.id],
                    enrolledStudentIds: [...scheduleStudentIds],
                });
            }
        }

        return Array.from(groupMap.values());
    }, [schedules]);

    // Filter aggregated groups
    const filteredGroups = aggregatedGroups.filter((group) => {
        const searchLower = searchValue.toLowerCase();
        const matchesSearch =
            searchValue === "" ||
            group.courseName.toLowerCase().includes(searchLower) ||
            group.groupName?.toLowerCase().includes(searchLower) ||
            group.teacher?.name.toLowerCase().includes(searchLower) ||
            group.days.some(d => dayNamesFull[d].toLowerCase().includes(searchLower));

        const matchesDay = filterDay.length === 0 || group.days.some(d => filterDay.includes(d.toString()));

        return matchesSearch && matchesDay;
    });

    const totalGroups = aggregatedGroups.length;
    const totalStudentsInBusiness = students.length; // Total alumnos registrados en el negocio
    const totalCoursesInBusiness = courses.length; // Total cursos creados en el negocio
    const totalEnrolledStudents = aggregatedGroups.reduce((sum, g) => sum + g.totalEnrollments, 0);
    const avgPerGroup = totalGroups > 0 ? Math.round(totalEnrolledStudents / totalGroups) : 0;

    // Color palette for cards
    const cardColors: Record<number, { bg: string; accent: string }> = {
        0: { bg: "#DBEAFE", accent: "#2563EB" },
        1: { bg: "#EDE9FE", accent: "#7C3AED" },
        2: { bg: "#FCE7F3", accent: "#DB2777" },
        3: { bg: "#FFEDD5", accent: "#EA580C" },
        4: { bg: "#D1FAE5", accent: "#059669" },
        5: { bg: "#CCFBF1", accent: "#0D9488" },
    };

    return (
        <div className="bg-slate-100 pb-16">
            {/* HEADER */}
            <div style={{ padding: "var(--spacing-lg)", marginBottom: "64px", position: "relative", zIndex: 10 }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">Grupos</h1>
                        <p className="text-muted-foreground text-lg">
                            {selectedBranch ? `Sucursal: ${selectedBranch.name}` : "Gestiona los grupos de clase"}
                        </p>
                    </div>
                </div>
            </div>

            {/* KPIS */}
            <motion.div
                style={{ padding: "0 var(--spacing-lg)", marginBottom: "48px" }}
                initial="hidden"
                animate="show"
                variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
                }}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <ModernKpiCard
                        title="Total Grupos"
                        value={totalGroups.toString()}
                        icon={UsersRound}
                        gradientClass="gradient-courses"
                        subtitle="Grupos activos"
                    />
                    <ModernKpiCard
                        title="Cursos"
                        value={totalCoursesInBusiness.toString()}
                        icon={Calendar}
                        gradientClass="gradient-students"
                        subtitle="Cursos creados"
                    />
                    <ModernKpiCard
                        title="Total Alumnos"
                        value={totalStudentsInBusiness.toString()}
                        icon={Users}
                        gradientClass="gradient-employees"
                        subtitle="Alumnos registrados"
                    />
                    <ModernKpiCard
                        title="Promedio por Grupo"
                        value={avgPerGroup.toString()}
                        icon={User}
                        gradientClass="gradient-finance"
                        subtitle="Alumnos/grupo"
                    />
                </div>
            </motion.div>

            {/* FILTERS */}
            <div style={{ padding: "0 var(--spacing-lg)", marginBottom: "24px" }}>
                <ModernFilterBar
                    searchValue={searchValue}
                    onSearchChange={setSearchValue}
                    placeholder="Buscar por curso, grupo, maestro o día..."
                    filters={[
                        { label: "Lunes", value: "1", color: "blue" },
                        { label: "Martes", value: "2", color: "green" },
                        { label: "Miércoles", value: "3", color: "purple" },
                        { label: "Jueves", value: "4", color: "orange" },
                        { label: "Viernes", value: "5", color: "pink" },
                        { label: "Sábado", value: "6", color: "yellow" },
                    ]}
                    activeFilters={filterDay}
                    onFilterToggle={(value) => {
                        setFilterDay((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
                    }}
                />
            </div>

            {/* GROUPS GRID */}
            <section style={{ padding: "0 var(--spacing-lg)", minHeight: "400px" }} className="pb-8">
                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="animate-spin w-12 h-12 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-slate-500">Cargando grupos...</p>
                    </div>
                ) : filteredGroups.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">📅</div>
                        <p className="text-slate-500 text-lg">No hay grupos registrados</p>
                        <p className="text-slate-400 text-sm mt-2">Los grupos se crean desde el calendario de clases</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
                        {filteredGroups.map((group, index) => {
                            const colors = cardColors[index % 6];
                            const daysLabel = group.days.map(d => dayNames[d]).join(", ");

                            return (
                                <motion.div
                                    key={group.key}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => openGroupModal(group)}
                                    style={{
                                        backgroundColor: colors.bg,
                                        borderRadius: "20px",
                                        padding: "24px",
                                        boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "16px",
                                        borderLeft: `4px solid ${group.courseColor}`,
                                        cursor: "pointer",
                                        transition: "transform 0.2s, box-shadow 0.2s",
                                    }}
                                    whileHover={{ scale: 1.02, boxShadow: "0 15px 50px rgba(0,0,0,0.12)" }}
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#1E293B", marginBottom: "4px" }}>
                                                {group.courseName}
                                            </h3>
                                            {group.groupName && (
                                                <span style={{
                                                    fontSize: "13px",
                                                    color: "#0ea5e9",
                                                    fontWeight: 600,
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "4px"
                                                }}>
                                                    🏷️ {group.groupName}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                            {group.days.map(day => (
                                                <span
                                                    key={day}
                                                    style={{
                                                        padding: "4px 8px",
                                                        backgroundColor: group.courseColor,
                                                        color: "white",
                                                        borderRadius: "12px",
                                                        fontSize: "11px",
                                                        fontWeight: "600",
                                                    }}
                                                >
                                                    {dayNames[day]}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Time & Location */}
                                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#475569" }}>
                                            <Clock size={16} />
                                            <span style={{ fontSize: "14px" }}>
                                                {group.startTime} - {group.endTime}
                                            </span>
                                        </div>
                                        {group.classroom && (
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#475569" }}>
                                                <MapPin size={16} />
                                                <span style={{ fontSize: "14px" }}>{group.classroom.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Teacher */}
                                    {group.teacher && (
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <div
                                                style={{
                                                    width: "32px",
                                                    height: "32px",
                                                    borderRadius: "8px",
                                                    backgroundColor: colors.accent,
                                                    color: "white",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "12px",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                {group.teacher.name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?"}
                                            </div>
                                            <span style={{ fontSize: "14px", color: "#475569" }}>{group.teacher.name}</span>
                                        </div>
                                    )}

                                    {/* Footer - Students count */}
                                    <div
                                        style={{
                                            marginTop: "auto",
                                            paddingTop: "16px",
                                            borderTop: "2px solid rgba(255,255,255,0.5)",
                                            display: "flex",
                                            alignItems: "center",
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <Users size={18} color={colors.accent} />
                                            <span style={{ fontSize: "24px", fontWeight: "900", color: colors.accent }}>
                                                {group.totalEnrollments}
                                            </span>
                                            <span style={{ fontSize: "12px", color: "#64748B" }}>alumnos</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Group Management Modal */}
            <AnimatePresence>
                {isModalOpen && selectedGroup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeModal}
                        style={{
                            position: "fixed",
                            inset: 0,
                            backgroundColor: "rgba(0,0,0,0.5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 1000,
                            padding: "16px",
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                backgroundColor: "white",
                                borderRadius: "24px",
                                padding: "32px",
                                width: "100%",
                                maxWidth: "560px",
                                maxHeight: "90vh",
                                overflowY: "auto",
                                boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
                            }}
                        >
                            {/* Header */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                                <div>
                                    <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#1E293B", marginBottom: "4px" }}>
                                        {selectedGroup.courseName}
                                    </h2>
                                    {selectedGroup.groupName && (
                                        <span style={{ fontSize: "14px", color: "#0ea5e9", fontWeight: 600 }}>
                                            🏷️ {selectedGroup.groupName}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={closeModal}
                                    style={{
                                        width: "40px",
                                        height: "40px",
                                        borderRadius: "12px",
                                        border: "none",
                                        backgroundColor: "#f1f5f9",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <X size={20} color="#64748b" />
                                </button>
                            </div>

                            {/* Schedule Info */}
                            <div style={{
                                display: "flex",
                                gap: "16px",
                                flexWrap: "wrap",
                                marginBottom: "24px",
                                padding: "16px",
                                backgroundColor: "#f8fafc",
                                borderRadius: "12px",
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Calendar size={18} color="#3b82f6" />
                                    <span style={{ fontWeight: 600, color: "#1e293b" }}>
                                        {selectedGroup.days.map(d => dayNames[d]).join(", ")}
                                    </span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Clock size={18} color="#10b981" />
                                    <span style={{ color: "#475569" }}>
                                        {selectedGroup.startTime} - {selectedGroup.endTime}
                                    </span>
                                </div>
                            </div>

                            {/* Teacher Select */}
                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#334155", fontSize: "14px" }}>
                                    <User size={16} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
                                    Maestro
                                </label>
                                <select
                                    value={modalTeacherId}
                                    onChange={(e) => setModalTeacherId(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "12px 16px",
                                        borderRadius: "12px",
                                        border: "2px solid #e2e8f0",
                                        fontSize: "14px",
                                        backgroundColor: "white",
                                        cursor: "pointer",
                                    }}
                                >
                                    <option value="">Sin maestro asignado</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Classroom Select */}
                            <div style={{ marginBottom: "24px" }}>
                                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#334155", fontSize: "14px" }}>
                                    <MapPin size={16} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
                                    Salón
                                </label>
                                <select
                                    value={modalClassroomId}
                                    onChange={(e) => setModalClassroomId(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "12px 16px",
                                        borderRadius: "12px",
                                        border: "2px solid #e2e8f0",
                                        fontSize: "14px",
                                        backgroundColor: "white",
                                        cursor: "pointer",
                                    }}
                                >
                                    <option value="">Sin salón asignado</option>
                                    {classrooms.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} {c.capacity ? `(${c.capacity} lugares)` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Students Section */}
                            <div style={{ marginBottom: "24px" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                                    <label style={{ fontWeight: 600, color: "#334155", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                                        <Users size={16} />
                                        Alumnos ({modalSelectedStudents.length} inscritos)
                                    </label>
                                </div>

                                {/* Search Input */}
                                <div style={{ position: "relative", marginBottom: "12px" }}>
                                    <Search
                                        size={18}
                                        color="#94a3b8"
                                        style={{
                                            position: "absolute",
                                            left: "12px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                        }}
                                    />
                                    <input
                                        type="text"
                                        value={studentSearchQuery}
                                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                                        placeholder="Buscar alumno por nombre..."
                                        style={{
                                            width: "100%",
                                            padding: "10px 12px 10px 40px",
                                            borderRadius: "10px",
                                            border: "2px solid #e2e8f0",
                                            fontSize: "14px",
                                            backgroundColor: "#f8fafc",
                                        }}
                                    />
                                </div>

                                <div style={{
                                    maxHeight: "280px",
                                    overflowY: "auto",
                                    border: "2px solid #e2e8f0",
                                    borderRadius: "12px",
                                }}>
                                    {students.length === 0 ? (
                                        <p style={{ textAlign: "center", color: "#94a3b8", padding: "16px" }}>
                                            No hay alumnos registrados
                                        </p>
                                    ) : (() => {
                                        // Filter by search query
                                        const filteredStudents = students.filter(s => {
                                            const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
                                            return fullName.includes(studentSearchQuery.toLowerCase());
                                        });

                                        // Separate enrolled and not enrolled
                                        const enrolledStudents = filteredStudents.filter(s => modalSelectedStudents.includes(s.id));
                                        const notEnrolledStudents = filteredStudents.filter(s => !modalSelectedStudents.includes(s.id));

                                        if (filteredStudents.length === 0) {
                                            return (
                                                <p style={{ textAlign: "center", color: "#94a3b8", padding: "16px" }}>
                                                    No se encontraron alumnos con "{studentSearchQuery}"
                                                </p>
                                            );
                                        }

                                        return (
                                            <>
                                                {/* Enrolled Students Section */}
                                                {enrolledStudents.length > 0 && (
                                                    <div style={{ borderBottom: notEnrolledStudents.length > 0 ? "2px solid #e2e8f0" : "none" }}>
                                                        <div style={{
                                                            padding: "8px 12px",
                                                            backgroundColor: "#dbeafe",
                                                            fontSize: "11px",
                                                            fontWeight: 700,
                                                            color: "#1e40af",
                                                            textTransform: "uppercase",
                                                            letterSpacing: "0.5px",
                                                        }}>
                                                            ✓ Inscritos ({enrolledStudents.length})
                                                        </div>
                                                        {enrolledStudents.map(student => (
                                                            <div
                                                                key={student.id}
                                                                onClick={() => toggleStudentSelection(student.id)}
                                                                style={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: "12px",
                                                                    padding: "10px 12px",
                                                                    cursor: "pointer",
                                                                    backgroundColor: "#eff6ff",
                                                                    transition: "background-color 0.15s",
                                                                }}
                                                            >
                                                                <div style={{
                                                                    width: "20px",
                                                                    height: "20px",
                                                                    borderRadius: "4px",
                                                                    backgroundColor: "#3b82f6",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                }}>
                                                                    <Check size={14} color="white" />
                                                                </div>
                                                                <span style={{
                                                                    fontSize: "14px",
                                                                    color: "#1e40af",
                                                                    fontWeight: 600,
                                                                }}>
                                                                    {student.firstName} {student.lastName}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Not Enrolled Students Section */}
                                                {notEnrolledStudents.length > 0 && (
                                                    <div>
                                                        <div style={{
                                                            padding: "8px 12px",
                                                            backgroundColor: "#f8fafc",
                                                            fontSize: "11px",
                                                            fontWeight: 700,
                                                            color: "#64748b",
                                                            textTransform: "uppercase",
                                                            letterSpacing: "0.5px",
                                                        }}>
                                                            Disponibles ({notEnrolledStudents.length})
                                                        </div>
                                                        {notEnrolledStudents.map(student => (
                                                            <div
                                                                key={student.id}
                                                                onClick={() => toggleStudentSelection(student.id)}
                                                                style={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: "12px",
                                                                    padding: "10px 12px",
                                                                    cursor: "pointer",
                                                                    backgroundColor: "transparent",
                                                                    transition: "background-color 0.15s",
                                                                }}
                                                            >
                                                                <div style={{
                                                                    width: "20px",
                                                                    height: "20px",
                                                                    borderRadius: "4px",
                                                                    border: "2px solid #cbd5e1",
                                                                    backgroundColor: "transparent",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                }} />
                                                                <span style={{
                                                                    fontSize: "14px",
                                                                    color: "#475569",
                                                                    fontWeight: 400,
                                                                }}>
                                                                    {student.firstName} {student.lastName}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {/* Delete Button - Separate Row */}
                                <button
                                    onClick={handleDeleteGroup}
                                    disabled={modalDeleting || modalSaving}
                                    style={{
                                        width: "100%",
                                        padding: "12px 24px",
                                        borderRadius: "12px",
                                        border: "2px solid #fecaca",
                                        backgroundColor: modalDeleting ? "#fee2e2" : "#fef2f2",
                                        color: "#dc2626",
                                        fontSize: "14px",
                                        fontWeight: 600,
                                        cursor: modalDeleting || modalSaving ? "not-allowed" : "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "8px",
                                        opacity: modalDeleting || modalSaving ? 0.6 : 1,
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    {modalDeleting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Eliminando...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={18} />
                                            Eliminar Grupo
                                        </>
                                    )}
                                </button>

                                {/* Save/Cancel Row */}
                                <div style={{ display: "flex", gap: "12px" }}>
                                    <button
                                        onClick={closeModal}
                                        style={{
                                            flex: 1,
                                            padding: "14px 24px",
                                            borderRadius: "12px",
                                            border: "2px solid #e2e8f0",
                                            backgroundColor: "white",
                                            color: "#64748b",
                                            fontSize: "14px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSaveGroup}
                                        disabled={modalSaving || modalDeleting}
                                        style={{
                                            flex: 1,
                                            padding: "14px 24px",
                                            borderRadius: "12px",
                                            border: "none",
                                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                            color: "white",
                                            fontSize: "14px",
                                            fontWeight: 600,
                                            cursor: modalSaving || modalDeleting ? "not-allowed" : "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "8px",
                                            opacity: modalSaving || modalDeleting ? 0.7 : 1,
                                        }}
                                    >
                                        {modalSaving ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                Guardar Cambios
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
