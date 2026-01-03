"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, GraduationCap, CreditCard, Award, Ban, Trash2, PlayCircle, Users, UserCheck, DollarSign, AlertCircle, X, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { StudentPaymentModal } from "@/components/schools/student-payment-modal";
import { useBranchData, useBranchCreate } from "@/hooks/use-branch-data";
import { useBranch } from "@/context/branch-context";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ModernPageHeader } from "@/components/ui/modern-page-header";
import { StatsCard } from "@/components/ui/stats-card";
import { ModernFilterBar } from "@/components/ui/modern-filter-bar";
import { ModernTable } from "@/components/ui/modern-table";
import { ModernInput } from "@/components/ui/modern-components";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";

export function StudentList() {
    const { data: students, loading, refetch } = useBranchData<any[]>('/api/students/enhanced');
    const createStudent = useBranchCreate('/api/students');
    const { selectedBranch } = useBranch();

    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [filterStatus, setFilterStatus] = useState<string[]>([]);
    const [newStudent, setNewStudent] = useState({
        firstName: "",
        lastName: "",
        matricula: "",
        email: "",
        guardianName: "",
        guardianPhone: ""
    });

    // Payment Modal State
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<{ id: string, name: string } | null>(null);

    // Estados para selección múltiple
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);

    const handleOpenPayment = (student: any) => {
        setSelectedStudentForPayment({
            id: student.id,
            name: `${student.firstName} ${student.lastName}`
        });
        setPaymentModalOpen(true);
    };

    const handleCreate = async () => {
        try {
            if (!selectedBranch?.businessId) {
                console.error("No business ID found");
                return;
            }

            await createStudent({
                ...newStudent,
                businessId: selectedBranch.businessId,
                branchId: selectedBranch.id
            });
            setOpen(false);
            refetch();
            setNewStudent({ firstName: "", lastName: "", matricula: "", email: "", guardianName: "", guardianPhone: "" });
        } catch (error) {
            console.error(error);
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
    const totalBalance = activeStudents.reduce((sum, s) => sum + (s.balance || 0), 0);
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
                                    label="Nombre del Tutor"
                                    value={newStudent.guardianName}
                                    onChange={(val) => setNewStudent({ ...newStudent, guardianName: val })}
                                />
                                <ModernInput
                                    label="Teléfono del Tutor"
                                    value={newStudent.guardianPhone}
                                    onChange={(val) => setNewStudent({ ...newStudent, guardianPhone: val })}
                                />
                            </div>
                            <DialogFooter>
                                <button
                                    onClick={handleCreate}
                                    className="button-modern bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
                                >
                                    Guardar Alumno
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
                        title="Saldo Total"
                        value={`$${totalBalance.toLocaleString()}`}
                        icon={DollarSign}
                        gradientClass="gradient-finance"
                        subtitle="MXN"
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
                                        justifyContent: 'space-between'
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
                )}
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
        </div>
    );
}
