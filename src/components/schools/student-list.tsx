"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, GraduationCap, CreditCard, Award, Ban, Trash2, PlayCircle, Users, UserCheck, DollarSign, AlertCircle, X, Check, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { StudentPaymentModal } from "@/components/schools/student-payment-modal";
import { useBranchData } from "@/hooks/use-branch-data";
import { useBranch } from "@/context/branch-context";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ModernPageHeader } from "@/components/ui/modern-page-header";
import { StatsCard } from "@/components/ui/stats-card";
import { ModernFilterBar } from "@/components/ui/modern-filter-bar";
import { ModernTable } from "@/components/ui/modern-table";
import { ModernInput, ModernSelect } from "@/components/ui/modern-components";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";
import { Checkbox } from "@/components/ui/checkbox";
import { BranchMultiSelector } from "@/components/shared/branch-multi-selector";

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
    } | null;
}

interface AggregatedGroup {
    key: string;
    groupName: string | null;
    courseName: string;
    scheduleIds: string[];
    days: number[];
    startTime: string;
    endTime: string;
    price: number;
}

const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function StudentList() {
    const { data: students, loading, refetch } = useBranchData<any[]>('/api/students/enhanced');

    const { selectedBranch } = useBranch();

    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [filterStatus, setFilterStatus] = useState<string[]>([]);
    const [newStudent, setNewStudent] = useState({
        firstName: "",
        lastName: "",
        matricula: "",
        email: "",
        address: "",
        guardianName: "",
        guardianPhone: "",
        branchIds: [] as string[],
        referralSource: ""
    });

    // Group Selection State
    const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
    const [selectedGroupKey, setSelectedGroupKey] = useState<string>("");

    // Scholarship State (for new student)
    const [addScholarship, setAddScholarship] = useState(false);
    const [scholarshipData, setScholarshipData] = useState({
        name: "",
        percentage: "",
        amount: ""
    });

    useEffect(() => {
        if (selectedBranch?.businessId) {
            fetch(`/api/class-schedules?businessId=${selectedBranch.businessId}`)
                .then(res => res.ok ? res.json() : [])
                .then(data => setSchedules(data))
                .catch(err => console.error("Error loading schedules", err));
        }
    }, [selectedBranch?.businessId]);



    const { branches } = useBranch();

    // Aggregate schedules into groups


    // Memoize the aggregation logic
    const groupsOptions = useMemo<{ key: string, label: string, scheduleIds: string[], price: number }[]>(() => {
        const groupMap = new Map<string, AggregatedGroup>();

        for (const schedule of schedules) {
            const key = schedule.groupName
                ? `group:${schedule.groupName}:${schedule.course?.id || 'no-course'}`
                : `schedule:${schedule.id}`;

            if (groupMap.has(key)) {
                const existing = groupMap.get(key)!;
                if (!existing.days.includes(schedule.dayOfWeek)) {
                    existing.days.push(schedule.dayOfWeek);
                    existing.days.sort((a, b) => a - b);
                }
                existing.scheduleIds.push(schedule.id);
            } else {
                groupMap.set(key, {
                    key,
                    groupName: schedule.groupName,
                    courseName: schedule.course?.name || schedule.title || "Sin nombre",
                    scheduleIds: [schedule.id],
                    days: [schedule.dayOfWeek],
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                    price: (schedule.course as any)?.price || 0
                });
            }
        }

        return Array.from(groupMap.values()).map(g => ({
            key: g.key,
            scheduleIds: g.scheduleIds,
            label: `${g.courseName} ${g.groupName ? `(${g.groupName})` : ''} - ${g.days.map(d => dayNames[d]).join(", ")} ${g.startTime}`,
            price: g.price
        }));
    }, [schedules]);

    // Payment Modal State
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<{ id: string, name: string } | null>(null);

    // Estados para selección múltiple
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);

    // Estados para editar
    const [editOpen, setEditOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleOpenPayment = (student: any) => {
        setSelectedStudentForPayment({
            id: student.id,
            name: `${student.firstName} ${student.lastName}`
        });
        setPaymentModalOpen(true);
    };

    const handleCreate = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            if (!selectedBranch?.businessId) {
                console.error("No business ID found");
                return;
            }

            const payload = {
                ...newStudent,
                businessId: selectedBranch.businessId,
                branchIds: newStudent.branchIds
            };

            // Manual fetch to ensure I get the ID
            const res = await fetch('/api/students', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const createdStudent = await res.json();

                // Enroll in Group Logic
                if (selectedGroupKey) {
                    const group = groupsOptions.find(g => g.key === selectedGroupKey);
                    if (group) {
                        const enrollmentResponses = await Promise.all(
                            group.scheduleIds.map(scheduleId =>
                                fetch("/api/schedule-enrollments", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        scheduleId,
                                        studentIds: [createdStudent.id],
                                        skipConflictCheck: true
                                    })
                                })
                            )
                        );

                        // Check if all enrollments succeeded
                        const failed = enrollmentResponses.filter(r => !r.ok);
                        if (failed.length > 0) {
                            console.error("Failed to enroll in some schedules", failed);
                            const firstError = await failed[0].text();
                            console.error("Enrollment error details:", firstError);
                            alert(`El alumno se creó, pero hubo un error al inscribirlo en el grupo: ${firstError}`);
                        }

                        // Create scholarship if specified
                        if (addScholarship && (scholarshipData.percentage || scholarshipData.amount)) {
                            try {
                                // Create scholarship for the first schedule of the group
                                await fetch("/api/scholarships", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        studentId: createdStudent.id,
                                        scheduleId: group.scheduleIds[0], // Associate with first schedule of the group
                                        name: scholarshipData.name || "Beca",
                                        percentage: scholarshipData.percentage ? parseFloat(scholarshipData.percentage) : null,
                                        amount: scholarshipData.amount ? parseFloat(scholarshipData.amount) : null
                                    })
                                });
                            } catch (scholarshipError) {
                                console.error("Error creating scholarship:", scholarshipError);
                            }
                        }
                    }
                }
            } else {
                throw new Error("Failed to create student");
            }

            setOpen(false);
            refetch();
            setNewStudent({
                firstName: "",
                lastName: "",
                matricula: "",
                email: "",
                address: "",
                guardianName: "",
                guardianPhone: "",
                branchIds: [],
                referralSource: ""
            });
            setSelectedGroupKey(""); // Reset group selection
            setAddScholarship(false); // Reset scholarship
            setScholarshipData({ name: "", percentage: "", amount: "" });


        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleStatusChange = async (studentId: string, newStatus: string) => {
        console.log("🔄 Changing status:", studentId, "to", newStatus);
        try {
            const response = await fetch(`/api/students/${studentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                const data = await response.json();
                console.log("✅ Status changed successfully:", data);
                refetch();
            } else {
                console.error("❌ Failed to change status:", response.status, await response.text());
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const handleDelete = async (studentId: string) => {
        if (!confirm("¿Estás seguro de eliminar este alumno?")) return;
        try {
            await fetch(`/api/students/${studentId}`, {
                method: "DELETE"
            });
            refetch();
        } catch (error) {
            console.error("Failed to delete student", error);
        }
    };

    // EDIT FUNCTIONALITY
    const handleEdit = (student: any) => {
        // Find ALL groups where the student is enrolled
        let enrolledGroupKeys: string[] = [];

        if (student.enrollments && student.enrollments.length > 0) {
            const studentScheduleIds = student.enrollments.map((e: any) => e.scheduleId);

            // Find all groups that contain any of the student's schedules
            groupsOptions.forEach(g => {
                if (g.scheduleIds.some(sId => studentScheduleIds.includes(sId))) {
                    enrolledGroupKeys.push(g.key);
                }
            });
        }

        setEditingStudent({
            ...student,
            branchIds: student.branches?.map((b: any) => b.id) || [],
            enrolledGroupKeys: enrolledGroupKeys,
            originalGroupKeys: enrolledGroupKeys // Keep original to compare on save
        });
        setEditOpen(true);
    };

    const handleUpdate = async () => {
        if (!editingStudent) return;
        try {
            const res = await fetch(`/api/students/${editingStudent.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: editingStudent.firstName,
                    lastName: editingStudent.lastName,
                    email: editingStudent.email,
                    matricula: editingStudent.matricula,
                    address: editingStudent.address,
                    guardianName: editingStudent.guardianName,
                    guardianPhone: editingStudent.guardianPhone,
                    branchIds: editingStudent.branchIds,
                    enrollmentDate: editingStudent.enrollmentDate,
                    enrollmentFeeOverride: editingStudent.enrollmentFeeOverride
                })
            });

            if (res.ok) {
                // Handle multi-group enrollment changes
                const originalGroups = editingStudent.originalGroupKeys || [];
                const newGroups = editingStudent.enrolledGroupKeys || [];

                // Find groups to ADD (in new but not in original)
                const groupsToAdd = newGroups.filter((g: string) => !originalGroups.includes(g));
                // Find groups to REMOVE (in original but not in new)
                const groupsToRemove = originalGroups.filter((g: string) => !newGroups.includes(g));

                // ENROLL in new groups
                for (const groupKey of groupsToAdd) {
                    const group = groupsOptions.find(g => g.key === groupKey);
                    if (group) {
                        await Promise.all(
                            group.scheduleIds.map(scheduleId =>
                                fetch("/api/schedule-enrollments", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        scheduleId,
                                        studentIds: [editingStudent.id],
                                        skipConflictCheck: true
                                    })
                                })
                            )
                        );
                    }
                }

                // UNENROLL from removed groups
                for (const groupKey of groupsToRemove) {
                    const group = groupsOptions.find(g => g.key === groupKey);
                    if (group) {
                        await Promise.all(
                            group.scheduleIds.map(scheduleId =>
                                fetch(`/api/schedule-enrollments?scheduleId=${scheduleId}&studentId=${editingStudent.id}`, {
                                    method: "DELETE"
                                })
                            )
                        );
                    }
                }

                setEditOpen(false);
                setEditingStudent(null);
                refetch();
                alert("Alumno actualizado correctamente");
            } else {
                console.error("Failed to update student");
            }
        } catch (error) {
            console.error("Error updating student:", error);
        }
    };

    // Helper to toggle branch selection
    const toggleBranch = (branchId: string) => {
        setNewStudent(prev => {
            const current = prev.branchIds || [];
            if (current.includes(branchId)) {
                return { ...prev, branchIds: current.filter(id => id !== branchId) };
            } else {
                return { ...prev, branchIds: [...current, branchId] };
            }
        });
    };

    // Funciones para selección múltiple
    const toggleSelectionMode = () => {
        const nextMode = !isSelectionMode;
        setIsSelectionMode(nextMode);
        if (!nextMode) setSelectedIds([]);
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`¿Eliminar ${selectedIds.length} alumnos permanentemente?`)) return;

        setIsDeletingBulk(true);
        console.log("🗑️ Starting bulk delete for:", selectedIds.length, "students");

        let successCount = 0;
        let errorCount = 0;

        try {
            for (const id of selectedIds) {
                try {
                    const response = await fetch(`/api/students/${id}`, { method: "DELETE" });
                    if (response.ok) {
                        successCount++;
                        console.log("✅ Deleted student:", id);
                    } else {
                        errorCount++;
                        console.error("❌ Failed to delete student:", id, response.status);
                    }
                } catch (e) {
                    errorCount++;
                    console.error("❌ Error deleting student:", id, e);
                }
            }

            console.log(`🗑️ Bulk delete complete: ${successCount} deleted, ${errorCount} errors`);
            setSelectedIds([]);
            setIsSelectionMode(false);
            refetch();
        } catch (error) {
            console.error("Error al eliminar alumnos", error);
        } finally {
            setIsDeletingBulk(false);
        }
    };

    // Filter students
    const activeStudents = students?.filter(s => s.status !== "ARCHIVED") || [];
    const filteredStudents = activeStudents.filter(student => {
        const matchesSearch = searchValue === "" ||
            `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchValue.toLowerCase()) ||
            student.matricula?.toLowerCase().includes(searchValue.toLowerCase());

        const matchesFilter = filterStatus.length === 0 || filterStatus.includes(student.status);

        return matchesSearch && matchesFilter;
    });

    // Calculate stats - treat null/undefined status as ACTIVE
    const totalStudents = activeStudents.length;
    const activeCount = activeStudents.filter(s => s.status === "ACTIVE" || !s.status).length;
    const overdueStudentsCount = activeStudents.filter(s => (s.overdueCount || 0) > 0).length;
    const scholarshipCount = activeStudents.filter(s => s.hasScholarship).length;

    // Table columns
    const columns = [
        {
            key: "name",
            label: "Alumno",
            render: (student: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-white font-semibold shadow-lg">
                        {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <div>
                        <div className="font-medium flex items-center gap-2">
                            {student.firstName} {student.lastName}
                            {student.hasScholarship && (
                                <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium flex items-center gap-1">
                                    <Award size={12} />
                                    Becado
                                </span>
                            )}
                        </div>
                        <div className="text-sm text-muted-text">{student.email || "Sin email"}</div>
                    </div>
                </div>
            )
        },
        {
            key: "matricula",
            label: "Matrícula",
            render: (student: any) => (
                <span className="font-mono text-sm">{student.matricula || "N/A"}</span>
            )
        },
        {
            key: "status",
            label: "Estado",
            render: (student: any) => (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${student.status === "ACTIVE"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                    }`}>
                    {student.status === "ACTIVE" ? "Activo" : "Inactivo"}
                </span>
            )
        },
        {
            key: "balance",
            label: "Saldo",
            render: (student: any) => (
                <span className={`font-semibold ${(student.balance || 0) > 0 ? "text-red-600" : "text-green-600"
                    }`}>
                    ${(student.balance || 0).toLocaleString()}
                </span>
            )
        }
    ];

    return (
        <div className="bg-slate-100 pb-16">
            {/* HEADER - MISMO PATRÓN QUE EMPLEADOS */}
            <div style={{
                padding: 'var(--spacing-lg)',
                marginBottom: '64px',
                position: 'relative',
                zIndex: 10
            }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
                            Alumnos
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            {selectedBranch ? `Sucursal: ${selectedBranch.name}` : "Gestiona tus estudiantes"}
                        </p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <button className="button-modern flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600">
                                <Plus size={18} />
                                Nuevo Alumno
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                                    Registrar Nuevo Alumno
                                </DialogTitle>
                                <DialogDescription className="sr-only">
                                    Formulario para registrar un nuevo alumno en la plataforma.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <ModernInput
                                        label="Nombre"
                                        value={newStudent.firstName}
                                        onChange={(val) => setNewStudent({ ...newStudent, firstName: val })}
                                    />
                                    <ModernInput
                                        label="Apellido"
                                        value={newStudent.lastName}
                                        onChange={(val) => setNewStudent({ ...newStudent, lastName: val })}
                                    />
                                </div>
                                <ModernInput
                                    label="Matrícula / ID"
                                    value={newStudent.matricula}
                                    onChange={(val) => setNewStudent({ ...newStudent, matricula: val })}
                                />
                                <ModernInput
                                    label="Email"
                                    type="email"
                                    value={newStudent.email}
                                    onChange={(val) => setNewStudent({ ...newStudent, email: val })}
                                />
                                <ModernInput
                                    label="Domicilio"
                                    value={newStudent.address}
                                    onChange={(val) => setNewStudent({ ...newStudent, address: val })}
                                    placeholder="Ej: Av. Reforma 123, Col. Centro"
                                />
                                <ModernInput
                                    label="Nombre del Tutor"
                                    value={newStudent.guardianName}
                                    onChange={(val) => setNewStudent({ ...newStudent, guardianName: val })}
                                />
                                <ModernInput
                                    label="Teléfono del Tutor"
                                    value={newStudent.guardianPhone}
                                    onChange={(val) => setNewStudent({ ...newStudent, guardianPhone: val })}
                                />

                                {/* FUENTE DE REFERENCIA */}
                                <div className="col-span-2">
                                    <ModernSelect
                                        label="¿Cómo nos conociste?"
                                        value={newStudent.referralSource}
                                        onChange={(val: string) => setNewStudent({ ...newStudent, referralSource: val })}
                                        placeholder="Seleccionar..."
                                        options={[
                                            { value: "TIKTOK", label: "🎵 TikTok" },
                                            { value: "FACEBOOK", label: "📘 Facebook" },
                                            { value: "INSTAGRAM", label: "📷 Instagram" },
                                            { value: "GOOGLE", label: "🔍 Google / Búsqueda web" },
                                            { value: "REFERRAL", label: "👥 Recomendación de amigo/familiar" },
                                            { value: "WALK_IN", label: "🚶 Visitaron el local" },
                                            { value: "OTHER", label: "📌 Otro" }
                                        ]}
                                        inline={true}
                                    />
                                </div>

                                {/* SELECTOR DE GRUPO (OPCIONAL) */}
                                <div className="col-span-2">
                                    <ModernSelect
                                        label="Inscribir a Grupo (Opcional)"
                                        value={selectedGroupKey}
                                        onChange={(val: string) => setSelectedGroupKey(val)}
                                        placeholder="Seleccionar curso/grupo..."
                                        options={groupsOptions.map(g => ({ value: g.key, label: g.label }))}
                                        inline={true}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        Se inscribirá al alumno en todos los horarios de este grupo.
                                    </p>

                                    {/* BECA (Solo aparece si se seleccionó un grupo) */}
                                    {selectedGroupKey && (
                                        <div style={{
                                            marginTop: "16px",
                                            padding: "16px",
                                            backgroundColor: "#fefce8",
                                            borderRadius: "12px",
                                            border: "1px solid #fef08a"
                                        }}>
                                            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginBottom: addScholarship ? "16px" : 0 }}>
                                                <input
                                                    type="checkbox"
                                                    checked={addScholarship}
                                                    onChange={(e) => setAddScholarship(e.target.checked)}
                                                    style={{ width: "18px", height: "18px", accentColor: "#eab308" }}
                                                />
                                                <span style={{ fontWeight: 600, color: "#854d0e", fontSize: "14px" }}>
                                                    🏅 Agregar Beca/Descuento
                                                </span>
                                            </label>

                                            {addScholarship && (
                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                                                    <div>
                                                        <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: 500, color: "#78716c" }}>Nombre de la beca</label>
                                                        <input
                                                            type="text"
                                                            value={scholarshipData.name}
                                                            onChange={(e) => setScholarshipData({ ...scholarshipData, name: e.target.value })}
                                                            placeholder="Ej: Beca Excelencia"
                                                            style={{
                                                                width: "100%",
                                                                padding: "10px 12px",
                                                                borderRadius: "8px",
                                                                border: "1px solid #e2e8f0",
                                                                fontSize: "14px"
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: 500, color: "#78716c" }}>Porcentaje (%)</label>
                                                        <input
                                                            type="number"
                                                            value={scholarshipData.percentage}
                                                            onChange={(e) => setScholarshipData({ ...scholarshipData, percentage: e.target.value, amount: "" })}
                                                            placeholder="Ej: 25"
                                                            min="0"
                                                            max="100"
                                                            style={{
                                                                width: "100%",
                                                                padding: "10px 12px",
                                                                borderRadius: "8px",
                                                                border: "1px solid #e2e8f0",
                                                                fontSize: "14px"
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: 500, color: "#78716c" }}>O monto fijo ($)</label>
                                                        <input
                                                            type="number"
                                                            value={scholarshipData.amount}
                                                            onChange={(e) => setScholarshipData({ ...scholarshipData, amount: e.target.value, percentage: "" })}
                                                            placeholder="Ej: 500"
                                                            min="0"
                                                            style={{
                                                                width: "100%",
                                                                padding: "10px 12px",
                                                                borderRadius: "8px",
                                                                border: "1px solid #e2e8f0",
                                                                fontSize: "14px"
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* SELECTOR DE SUCURSALES */}
                                <div className="pt-4 border-t border-slate-100 col-span-2">
                                    <BranchMultiSelector
                                        selectedBranchIds={newStudent.branchIds || []}
                                        onChange={(ids) => setNewStudent({ ...newStudent, branchIds: ids })}
                                        helperText="Si no seleccionas ninguna, el alumno será global (visible en todas)."
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <button
                                    onClick={handleCreate}
                                    disabled={isSaving}
                                    className="button-modern bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSaving && <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />}
                                    {isSaving ? "Guardando..." : "Guardar Alumno"}
                                </button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
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
                        title="Total Alumnos"
                        value={totalStudents.toString()}
                        icon={Users}
                        trend={12}
                        positive={true}
                        gradientClass="gradient-students"
                        subtitle="En la sucursal"
                    />
                    <ModernKpiCard
                        title="Alumnos Activos"
                        value={activeCount.toString()}
                        icon={UserCheck}
                        gradientClass="gradient-employees"
                        subtitle="Estudiantes activos"
                    />
                    <ModernKpiCard
                        title="Pendientes de Pago"
                        value={overdueStudentsCount.toString()}
                        icon={AlertCircle}
                        gradientClass="gradient-finance"
                        subtitle="Alumnos con pagos vencidos"
                    />
                    <ModernKpiCard
                        title="Becados"
                        value={scholarshipCount.toString()}
                        icon={Award}
                        gradientClass="gradient-courses"
                        subtitle="Con beca activa"
                    />
                </div>
            </motion.div>

            {/* FILTROS Y BOTONES DE ACCIÓN */}
            <div style={{ padding: '0 var(--spacing-lg)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    {/* BARRA DE BÚSQUEDA */}
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <ModernFilterBar
                            searchValue={searchValue}
                            onSearchChange={setSearchValue}
                            placeholder="Buscar por nombre o matrícula..."
                            filters={[
                                { label: "Activos", value: "ACTIVE", color: "green" },
                                { label: "Inactivos", value: "INACTIVE", color: "gray" }
                            ]}
                            activeFilters={filterStatus}
                            onFilterToggle={(value) => {
                                setFilterStatus(prev =>
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
                    </div>
                </div>
            </div>

            {/* BARRA DE ACCIONES DE GESTIÓN */}
            {isSelectionMode && (
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
                                backgroundColor: '#7c3aed',
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
                                {selectedIds.length === 0 ? 'Haz clic en los alumnos para seleccionarlos' : 'alumnos seleccionados'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setSelectedIds(filteredStudents.map(s => s.id))}
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
                                        gap: '8px',
                                        opacity: isDeletingBulk ? 0.7 : 1
                                    }}
                                >
                                    <Trash2 size={16} />
                                    Eliminar seleccionados
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Student Cards Grid */}
            <section style={{ padding: '0 var(--spacing-lg)', minHeight: '400px' }} className="pb-8">
                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="animate-spin w-12 h-12 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-slate-500">Cargando alumnos...</p>
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">🎓</div>
                        <p className="text-slate-500 text-lg">No hay alumnos registrados</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '32px' }}>
                        {filteredStudents.map((student, index) => {
                            const studentColors: Record<number, { bg: string; accent: string }> = {
                                0: { bg: '#DBEAFE', accent: '#2563EB' },
                                1: { bg: '#EDE9FE', accent: '#7C3AED' },
                                2: { bg: '#FCE7F3', accent: '#DB2777' },
                                3: { bg: '#FFEDD5', accent: '#EA580C' },
                                4: { bg: '#D1FAE5', accent: '#059669' },
                                5: { bg: '#CCFBF1', accent: '#0D9488' },
                            };

                            // Use gray colors for inactive students
                            const isInactive = student.status === "INACTIVE";
                            const inactiveColors = { bg: '#F1F5F9', accent: '#94A3B8' };
                            const colors = isInactive ? inactiveColors : studentColors[index % 6];
                            const isSelected = selectedIds.includes(student.id);

                            return (
                                <div
                                    key={student.id}
                                    className={`student-card ${isSelectionMode ? 'cursor-pointer' : ''}`}
                                    onClick={() => isSelectionMode && toggleSelection(student.id)}
                                    style={{
                                        backgroundColor: isInactive ? '#E5E7EB' : colors.bg,
                                        borderRadius: '20px',
                                        padding: '28px',
                                        minHeight: '280px',
                                        boxShadow: isSelected
                                            ? '0 0 0 3px #7c3aed'
                                            : isInactive
                                                ? '0 0 0 3px #EF4444, 0 4px 12px rgba(0,0,0,0.08)'
                                                : '0 10px 40px rgba(0,0,0,0.12)',
                                        display: 'flex',
                                        flexDirection: 'column' as const,
                                        position: 'relative' as const,
                                        opacity: isInactive ? 0.6 : 1,
                                        filter: isInactive ? 'grayscale(100%)' : 'none'
                                    }}
                                >
                                    {/* INACTIVE BADGE - BIG AND VISIBLE */}
                                    {isInactive && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: '12px',
                                                left: '12px',
                                                right: '12px',
                                                padding: '6px 12px',
                                                backgroundColor: '#DC2626',
                                                color: 'white',
                                                borderRadius: '8px',
                                                fontSize: '11px',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                                textAlign: 'center' as const,
                                                zIndex: 10
                                            }}
                                        >
                                            ⛔ INACTIVO
                                        </div>
                                    )}

                                    {/* PAYMENT STATUS BADGE */}
                                    {!isInactive && student.paymentStatus === "OVERDUE" && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: '12px',
                                                right: '12px',
                                                padding: '4px 10px',
                                                backgroundColor: '#EF4444',
                                                color: 'white',
                                                borderRadius: '8px',
                                                fontSize: '10px',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.03em',
                                                zIndex: 10,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
                                            }}
                                        >
                                            <AlertCircle size={12} />
                                            Pago Vencido
                                        </div>
                                    )}
                                    {!isInactive && student.paymentStatus === "DUE_SOON" && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: '12px',
                                                right: '12px',
                                                padding: '4px 10px',
                                                backgroundColor: student.daysUntilPayment <= 0 ? '#EF4444' : '#F59E0B',
                                                color: 'white',
                                                borderRadius: '8px',
                                                fontSize: '10px',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.03em',
                                                zIndex: 10,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                boxShadow: student.daysUntilPayment <= 0
                                                    ? '0 2px 6px rgba(239, 68, 68, 0.4)'
                                                    : '0 2px 6px rgba(245, 158, 11, 0.4)'
                                            }}
                                        >
                                            {student.daysUntilPayment <= 0
                                                ? `⚠️ Pago Pendiente`
                                                : `📅 Pago en ${student.daysUntilPayment} día${student.daysUntilPayment !== 1 ? 's' : ''}`
                                            }
                                        </div>
                                    )}

                                    {/* CHECKBOX DE SELECCIÓN */}
                                    {isSelectionMode && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: '16px',
                                                right: '16px',
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '8px',
                                                backgroundColor: isSelected ? '#7c3aed' : 'white',
                                                border: isSelected ? 'none' : '2px solid #E2E8F0',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                            onClick={(e) => { e.stopPropagation(); toggleSelection(student.id); }}
                                        >
                                            {isSelected && <Check size={16} color="white" strokeWidth={3} />}
                                        </div>
                                    )}

                                    {/* AVATAR */}
                                    <div
                                        style={{
                                            width: '72px',
                                            height: '72px',
                                            borderRadius: '16px',
                                            backgroundColor: colors.accent,
                                            color: 'white',
                                            fontSize: '24px',
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '20px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                        }}
                                    >
                                        {student.lastName[0]}{student.firstName[0]}
                                    </div>

                                    {/* NOMBRE */}
                                    <h3 style={{
                                        fontSize: '22px',
                                        fontWeight: 'bold',
                                        color: '#1E293B',
                                        marginBottom: '8px'
                                    }}>
                                        {student.lastName} {student.firstName}
                                    </h3>

                                    {/* MATRÍCULA (como rol) */}
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '6px 14px',
                                        backgroundColor: 'rgba(255,255,255,0.8)',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        color: colors.accent,
                                        marginBottom: '16px',
                                        width: 'fit-content'
                                    }}>
                                        {student.matricula || 'Sin matrícula'}
                                    </span>

                                    {/* Indicador Global vs Sucursal */}
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                        {student.branches && student.branches.length > 0 ? (
                                            student.branches.map((b: any) => (
                                                <span key={b.id} style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    padding: '4px 10px',
                                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                    borderRadius: '12px',
                                                    fontSize: '10px',
                                                    fontWeight: '600',
                                                    color: '#3B82F6',
                                                }}>
                                                    📍 {b.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '4px 10px',
                                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                                borderRadius: '12px',
                                                fontSize: '10px',
                                                fontWeight: '600',
                                                color: '#10B981',
                                            }}>
                                                🌐 Global
                                            </span>
                                        )}
                                    </div>

                                    {/* CONTACTO */}
                                    <div style={{ flex: 1, fontSize: '14px', color: '#475569' }}>
                                        <div style={{ marginBottom: '8px' }}>📧 {student.email || 'Sin email'}</div>
                                        {student.guardianName && <div>👤 {student.guardianName}</div>}
                                    </div>

                                    {/* SALDO + ACCIONES (misma fila) */}
                                    <div style={{
                                        marginTop: '16px',
                                        paddingTop: '16px',
                                        borderTop: '2px solid rgba(255,255,255,0.5)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: '12px'
                                    }}>
                                        <div>
                                            <div style={{
                                                fontSize: '28px',
                                                fontWeight: '900',
                                                color: (student.balance || 0) > 0 ? '#DC2626' : '#059669'
                                            }}>
                                                ${(student.balance || 0).toLocaleString()}
                                            </div>
                                            <div style={{ fontSize: '10px', fontWeight: 'bold', color: colors.accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Saldo
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => handleOpenPayment(student)}
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
                                                title="Ver pagos"
                                            >
                                                <CreditCard size={18} color={colors.accent} />
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(
                                                    student.id,
                                                    student.status === "INACTIVE" ? "ACTIVE" : "INACTIVE"
                                                )}
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
                                                title={student.status === "INACTIVE" ? "Activar alumno" : "Desactivar alumno"}
                                            >
                                                {student.status === "INACTIVE" ? (
                                                    <PlayCircle size={18} color="#059669" />
                                                ) : (
                                                    <Ban size={18} color="#F59E0B" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(student)}
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
                                                title="Editar alumno"
                                            >
                                                <Edit size={18} color={colors.accent} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(student.id)}
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
                                                title="Eliminar alumno"
                                            >
                                                <Trash2 size={18} color="#EF4444" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
                }
            </section>

            {/* Payment Modal */}
            {selectedStudentForPayment && (
                <StudentPaymentModal
                    isOpen={paymentModalOpen}
                    onClose={() => setPaymentModalOpen(false)}
                    studentId={selectedStudentForPayment.id}
                    studentName={selectedStudentForPayment.name}
                />
            )}

            {/* Edit Student Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Edit size={20} className="text-purple-500" />
                            Editar Alumno
                        </DialogTitle>
                        <DialogDescription className="sr-only">Formulario para editar alumno</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <ModernInput
                            label="Nombre"
                            value={editingStudent?.firstName || ""}
                            onChange={(val) => setEditingStudent({ ...editingStudent, firstName: val })}
                        />
                        <ModernInput
                            label="Apellido"
                            value={editingStudent?.lastName || ""}
                            onChange={(val) => setEditingStudent({ ...editingStudent, lastName: val })}
                        />
                        <ModernInput
                            label="Matrícula"
                            value={editingStudent?.matricula || ""}
                            onChange={(val) => setEditingStudent({ ...editingStudent, matricula: val })}
                        />
                        <ModernInput
                            label="Email"
                            value={editingStudent?.email || ""}
                            onChange={(val) => setEditingStudent({ ...editingStudent, email: val })}
                        />
                        <ModernInput
                            label="Domicilio"
                            value={editingStudent?.address || ""}
                            onChange={(val) => setEditingStudent({ ...editingStudent, address: val })}
                        />
                        <ModernInput
                            label="Nombre del Tutor"
                            value={editingStudent?.guardianName || ""}
                            onChange={(val) => setEditingStudent({ ...editingStudent, guardianName: val })}
                        />
                        <ModernInput
                            label="Teléfono del Tutor"
                            value={editingStudent?.guardianPhone || ""}
                            onChange={(val) => setEditingStudent({ ...editingStudent, guardianPhone: val })}
                        />

                        {/* MULTI-GROUP ENROLLMENT */}
                        <div className="col-span-2">
                            <label className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                📚 Grupos Inscritos y Becas
                            </label>

                            {/* Enrolled groups as cards with scholarship info */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
                                {(editingStudent?.enrolledGroupKeys || []).length === 0 ? (
                                    <div style={{
                                        padding: '20px',
                                        border: '2px dashed rgba(124, 58, 237, 0.2)',
                                        borderRadius: '12px',
                                        textAlign: 'center',
                                        color: '#94A3B8'
                                    }}>
                                        No inscrito en ningún grupo
                                    </div>
                                ) : (
                                    (editingStudent?.enrolledGroupKeys || []).map((groupKey: string) => {
                                        const group = groupsOptions.find(g => g.key === groupKey);
                                        const scheduleId = group?.scheduleIds?.[0] || null; // Use first scheduleId from group
                                        const scholarship = (editingStudent?.scholarships || []).find((s: any) =>
                                            s.scheduleId === scheduleId || s.scheduleId === null
                                        );

                                        return (
                                            <div
                                                key={groupKey}
                                                style={{
                                                    padding: '16px',
                                                    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
                                                    border: '2px solid rgba(124, 58, 237, 0.2)',
                                                    borderRadius: '12px',
                                                }}
                                            >
                                                {/* Group header */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: scholarship ? '12px' : '0' }}>
                                                    <div>
                                                        <div style={{ fontWeight: '600', color: '#1E293B', fontSize: '14px' }}>
                                                            {group?.label || groupKey}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                                                            Precio: ${group?.price || 0}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updated = (editingStudent?.enrolledGroupKeys || []).filter((k: string) => k !== groupKey);
                                                            setEditingStudent({ ...editingStudent, enrolledGroupKeys: updated });
                                                        }}
                                                        style={{
                                                            background: 'rgba(239, 68, 68, 0.1)',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            padding: '4px 8px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                            color: '#EF4444'
                                                        }}
                                                    >
                                                        Quitar
                                                    </button>
                                                </div>

                                                {/* Scholarship info */}
                                                {scholarship && (
                                                    <div style={{
                                                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                                        padding: '8px 12px',
                                                        borderRadius: '8px',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}>
                                                        <div style={{ color: 'white' }}>
                                                            <span style={{ fontSize: '11px', opacity: 0.9 }}>🎓 BECA:</span>
                                                            <span style={{ marginLeft: '6px', fontWeight: '600', fontSize: '13px' }}>
                                                                {scholarship.name} ({scholarship.percentage ? `${scholarship.percentage}%` : `$${scholarship.amount}`})
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                if (confirm('¿Eliminar esta beca?')) {
                                                                    try {
                                                                        await fetch(`/api/schools/finance/scholarships/${scholarship.id}`, { method: 'DELETE' });
                                                                        // Update local state
                                                                        setEditingStudent({
                                                                            ...editingStudent,
                                                                            scholarships: (editingStudent?.scholarships || []).filter((s: any) => s.id !== scholarship.id)
                                                                        });
                                                                    } catch (e) {
                                                                        console.error('Failed to delete scholarship', e);
                                                                    }
                                                                }
                                                            }}
                                                            style={{
                                                                background: 'rgba(255,255,255,0.2)',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                padding: '4px 8px',
                                                                cursor: 'pointer',
                                                                fontSize: '11px',
                                                                color: 'white'
                                                            }}
                                                        >
                                                            ✕ Quitar
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Add scholarship section (if no scholarship for this group) */}
                                                {!scholarship && (
                                                    <div style={{ marginTop: '8px' }}>
                                                        {(editingStudent as any)?._addingScholarshipFor === scheduleId ? (
                                                            <div style={{
                                                                padding: '12px',
                                                                background: 'rgba(16, 185, 129, 0.08)',
                                                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                                                borderRadius: '8px'
                                                            }}>
                                                                <div style={{ marginBottom: '8px' }}>
                                                                    <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Nombre de la beca</label>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Ej: Beca Deportiva"
                                                                        value={(editingStudent as any)?._scholarshipName || ''}
                                                                        onChange={(e) => setEditingStudent({ ...editingStudent, _scholarshipName: e.target.value })}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '8px',
                                                                            border: '1px solid #E2E8F0',
                                                                            borderRadius: '6px',
                                                                            fontSize: '13px'
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
                                                                        <input
                                                                            type="radio"
                                                                            name={`discountType-${scheduleId}`}
                                                                            checked={(editingStudent as any)?._discountType !== 'amount'}
                                                                            onChange={() => setEditingStudent({ ...editingStudent, _discountType: 'percentage' })}
                                                                        />
                                                                        Porcentaje (%)
                                                                    </label>
                                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
                                                                        <input
                                                                            type="radio"
                                                                            name={`discountType-${scheduleId}`}
                                                                            checked={(editingStudent as any)?._discountType === 'amount'}
                                                                            onChange={() => setEditingStudent({ ...editingStudent, _discountType: 'amount' })}
                                                                        />
                                                                        Monto fijo ($)
                                                                    </label>
                                                                </div>
                                                                <div style={{ marginBottom: '10px' }}>
                                                                    <input
                                                                        type="number"
                                                                        placeholder={(editingStudent as any)?._discountType === 'amount' ? 'Ej: 500' : 'Ej: 20'}
                                                                        value={(editingStudent as any)?._discountValue || ''}
                                                                        onChange={(e) => setEditingStudent({ ...editingStudent, _discountValue: e.target.value })}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '8px',
                                                                            border: '1px solid #E2E8F0',
                                                                            borderRadius: '6px',
                                                                            fontSize: '13px'
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                                    <button
                                                                        type="button"
                                                                        disabled={(editingStudent as any)?._isSavingScholarship}
                                                                        onClick={async () => {
                                                                            if ((editingStudent as any)?._isSavingScholarship) return;

                                                                            const name = (editingStudent as any)?._scholarshipName;
                                                                            const discountType = (editingStudent as any)?._discountType || 'percentage';
                                                                            const value = (editingStudent as any)?._discountValue;
                                                                            if (!name || !value) return;

                                                                            try {
                                                                                const res = await fetch('/api/schools/finance/scholarships', {
                                                                                    method: 'POST',
                                                                                    headers: { 'Content-Type': 'application/json' },
                                                                                    body: JSON.stringify({
                                                                                        studentId: editingStudent?.id,
                                                                                        name,
                                                                                        scheduleId,
                                                                                        percentage: discountType === 'percentage' ? parseFloat(value) : null,
                                                                                        amount: discountType === 'amount' ? parseFloat(value) : null
                                                                                    })
                                                                                });

                                                                                if (!res.ok) throw new Error('Failed to create');

                                                                                const newScholarship = await res.json();
                                                                                setEditingStudent({
                                                                                    ...editingStudent,
                                                                                    scholarships: [...(editingStudent?.scholarships || []), newScholarship],
                                                                                    _addingScholarshipFor: null,
                                                                                    _scholarshipName: '',
                                                                                    _discountType: 'percentage',
                                                                                    _discountValue: '',
                                                                                    _isSavingScholarship: false
                                                                                });
                                                                            } catch (e) {
                                                                                console.error('Failed to create scholarship', e);
                                                                                setEditingStudent({ ...editingStudent, _isSavingScholarship: false });
                                                                                alert('Error al guardar');
                                                                            }
                                                                        }}
                                                                        style={{
                                                                            flex: 1,
                                                                            padding: '8px',
                                                                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                                                            border: 'none',
                                                                            borderRadius: '6px',
                                                                            color: 'white',
                                                                            fontSize: '12px',
                                                                            fontWeight: '600',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        ✓ Guardar Beca
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEditingStudent({
                                                                            ...editingStudent,
                                                                            _addingScholarshipFor: null
                                                                        })}
                                                                        style={{
                                                                            padding: '8px 16px',
                                                                            background: '#F1F5F9',
                                                                            border: 'none',
                                                                            borderRadius: '6px',
                                                                            color: '#64748B',
                                                                            fontSize: '12px',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        Cancelar
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditingStudent({
                                                                    ...editingStudent,
                                                                    _addingScholarshipFor: scheduleId,
                                                                    _discountType: 'percentage'
                                                                })}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '10px',
                                                                    background: 'rgba(16, 185, 129, 0.08)',
                                                                    border: '1px dashed rgba(16, 185, 129, 0.4)',
                                                                    borderRadius: '6px',
                                                                    color: '#10B981',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px',
                                                                    fontWeight: '500',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    gap: '6px'
                                                                }}
                                                            >
                                                                🎓 + Agregar beca
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Dropdown to add new group */}
                            <ModernSelect
                                label="Agregar a Grupo"
                                value=""
                                onChange={(val: string) => {
                                    if (val && !(editingStudent?.enrolledGroupKeys || []).includes(val)) {
                                        setEditingStudent({
                                            ...editingStudent,
                                            enrolledGroupKeys: [...(editingStudent?.enrolledGroupKeys || []), val]
                                        });
                                    }
                                }}
                                placeholder="-- Seleccionar para agregar --"
                                options={groupsOptions
                                    .filter(g => !(editingStudent?.enrolledGroupKeys || []).includes(g.key))
                                    .map(g => ({ value: g.key, label: g.label }))
                                }
                                inline={true}
                            />
                        </div>

                        {/* ENROLLMENT DATE (MANUAL OVERRIDE) */}
                        <div className="col-span-2">
                            <label className="text-sm font-medium text-slate-700 mb-2 block">
                                Fecha de Inscripción (para cálculo de pagos)
                            </label>
                            <input
                                type="date"
                                value={editingStudent?.enrollmentDate
                                    ? new Date(editingStudent.enrollmentDate).toISOString().split('T')[0]
                                    : new Date().toISOString().split('T')[0]}
                                onChange={(e) => setEditingStudent({
                                    ...editingStudent,
                                    enrollmentDate: e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString()
                                })}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '2px solid rgba(124, 58, 237, 0.2)',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
                                    fontSize: '14px',
                                    color: '#1E293B',
                                    outline: 'none'
                                }}
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Esta fecha determina cuándo vence el pago mensual. Por defecto es la fecha de hoy.
                            </p>
                        </div>

                        {/* ENROLLMENT FEE OVERRIDE */}
                        <div className="col-span-2">
                            <label className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                💰 Cuota de Inscripción (override)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                                <input
                                    type="number"
                                    placeholder="Usar valor global"
                                    value={editingStudent?.enrollmentFeeOverride ?? ''}
                                    onChange={(e) => setEditingStudent({
                                        ...editingStudent,
                                        enrollmentFeeOverride: e.target.value ? parseFloat(e.target.value) : null
                                    })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px 12px 32px',
                                        border: '2px solid rgba(124, 58, 237, 0.2)',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
                                        fontSize: '14px',
                                        color: '#1E293B',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Deja vacío para usar el valor global configurado en Ajustes. Si pones 0, no se cobrará inscripción.
                            </p>
                        </div>

                        {/* BRANCH SELECTOR */}
                        <div className="col-span-2 pt-4 border-t border-slate-100">
                            <BranchMultiSelector
                                selectedBranchIds={editingStudent?.branchIds || []}
                                onChange={(ids) => setEditingStudent({ ...editingStudent, branchIds: ids })}
                                helperText="Si no seleccionas ninguna, el alumno será global (visible en todas)."
                            />
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
                            onClick={handleUpdate}
                            className="button-modern bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
                        >
                            Guardar Cambios
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
