"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Users, DollarSign, UserPlus, Edit, Trash2, Mail, Phone, Briefcase, TrendingUp, Key, ShieldCheck, X, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranchData, useBranchCreate } from "@/hooks/use-branch-data";
import { useBranch } from "@/context/branch-context";
import { useToast } from "@/components/ui/use-toast";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";
import { ModernFilterBar } from "@/components/ui/modern-filter-bar";
import { ModernInput } from "@/components/ui/modern-components";
import { Checkbox } from "@/components/ui/checkbox";
import { BranchMultiSelector } from "@/components/shared/branch-multi-selector";

export function EmployeeList() {
    const { data: employees, loading, refetch } = useBranchData<any[]>('/api/employees');
    const createEmployee = useBranchCreate('/api/employees');
    const { selectedBranch } = useBranch();
    const { toast } = useToast();

    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [filterRole, setFilterRole] = useState<string[]>([]);
    const [newEmployee, setNewEmployee] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "STAFF",
        paymentModel: "FIXED",
        salary: "",
        hourlyRate: "",
        commissionPercentage: "",
        reservePercentage: "",
        paymentFrequency: "MONTHLY",
        paymentFrequency: "MONTHLY",
        paymentDay: "",
        branchIds: [] as string[]
    });

    // Need branches list for selection
    const { branches } = useBranch();

    const [createUserOpen, setCreateUserOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

    // Estados para selección múltiple
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);

    const handleCreate = async () => {
        try {
            await createEmployee(newEmployee);
            setOpen(false);
            refetch();
            setNewEmployee({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                role: "STAFF",
                paymentModel: "FIXED",
                salary: "",
                hourlyRate: "",
                commissionPercentage: "",
                reservePercentage: "",
                paymentFrequency: "MONTHLY",
                paymentDay: "",
                branchIds: []
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateUser = async () => {
        if (!selectedEmployee) return;

        try {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
                    email: selectedEmployee.email,
                    password: "password123",
                    role: selectedEmployee.role, // Usa el mismo rol del empleado
                    branchId: selectedEmployee.branchId
                })
            });

            if (res.ok) {
                setCreateUserOpen(false);
                setSelectedEmployee(null);
                toast({
                    title: "Cuenta creada exitosamente",
                    description: `${selectedEmployee.firstName} ahora puede acceder al sistema como ${roleLabels[selectedEmployee.role] || selectedEmployee.role}.`
                });
            } else {
                const error = await res.json();
                toast({ title: "Error: " + error.message, variant: "destructive" });
            }
        } catch (error) {
            console.error("Error creating user:", error);
            toast({ title: "Error al crear usuario", variant: "destructive" });
        }
    };

    // Estados para editar/eliminar
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<any>(null);

    const handleEdit = (employee: any) => {
        setEditingEmployee({
            ...employee,
            salary: employee.salary?.toString() || "",
            branchIds: employee.branches?.map((b: any) => b.id) || []
        });
        setEditOpen(true);
    };

    const handleUpdate = async () => {
        if (!editingEmployee) return;

        try {
            const res = await fetch(`/api/employees/${editingEmployee.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: editingEmployee.firstName,
                    lastName: editingEmployee.lastName,
                    email: editingEmployee.email,
                    phone: editingEmployee.phone,
                    role: editingEmployee.role,
                    paymentModel: editingEmployee.paymentModel,
                    salary: editingEmployee.salary ? parseFloat(editingEmployee.salary) : null,
                    hourlyRate: editingEmployee.hourlyRate ? parseFloat(editingEmployee.hourlyRate) : null,
                    commissionPercentage: editingEmployee.commissionPercentage ? parseFloat(editingEmployee.commissionPercentage) : null,
                    reservePercentage: editingEmployee.reservePercentage ? parseFloat(editingEmployee.reservePercentage) : null,
                    branchIds: editingEmployee.branchIds
                })
            });

            if (res.ok) {
                setEditOpen(false);
                setEditingEmployee(null);
                refetch();
                toast({ title: "Empleado actualizado correctamente" });
            } else {
                const error = await res.json();
                toast({ title: "Error: " + error.message, variant: "destructive" });
            }
        } catch (error) {
            console.error("Error updating employee:", error);
            toast({ title: "Error al actualizar empleado", variant: "destructive" });
        }
    };

    const handleDelete = async () => {
        if (!selectedEmployee) return;

        try {
            const res = await fetch(`/api/employees/${selectedEmployee.id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                setDeleteOpen(false);
                setSelectedEmployee(null);
                refetch();
                toast({ title: "Empleado eliminado correctamente" });
            } else {
                const error = await res.json();
                toast({ title: "Error: " + error.message, variant: "destructive" });
            }
        } catch (error) {
            console.error("Error deleting employee:", error);
            toast({ title: "Error al eliminar empleado", variant: "destructive" });
        }
    };

    // Helper to toggle branch selection
    const toggleBranch = (branchId: string) => {
        setNewEmployee(prev => {
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
        if (!confirm(`¿Eliminar ${selectedIds.length} empleados permanentemente?`)) return;

        setIsDeletingBulk(true);
        try {
            // Eliminar uno por uno
            for (const id of selectedIds) {
                await fetch(`/api/employees/${id}`, { method: "DELETE" });
            }
            toast({ title: `${selectedIds.length} empleados eliminados exitosamente` });
            setSelectedIds([]);
            setIsSelectionMode(false);
            refetch();
        } catch (error) {
            toast({ title: "Error al eliminar empleados", variant: "destructive" });
        } finally {
            setIsDeletingBulk(false);
        }
    };

    // Filter employees
    const filteredEmployees = (employees || []).filter(emp => {
        const matchesSearch = searchValue === "" ||
            `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchValue.toLowerCase()) ||
            emp.email?.toLowerCase().includes(searchValue.toLowerCase());

        const matchesFilter = filterRole.length === 0 || filterRole.includes(emp.role);

        return matchesSearch && matchesFilter;
    });

    // Calculate stats
    const totalEmployees = employees?.length || 0;
    const totalSalaries = employees?.reduce((sum, e) => sum + (parseFloat(e.salary) || 0), 0) || 0;
    const teachers = employees?.filter(e => e.role === "TEACHER").length || 0;
    const staff = employees?.filter(e => e.role === "STAFF").length || 0;

    // Role labels
    const roleLabels: { [key: string]: string } = {
        "MANAGER": "Gerente",
        "ADMIN": "Administrador",
        "TEACHER": "Maestro",
        "STAFF": "Encargado",
    };

    return (
        <div className="bg-slate-100 pb-16">
            {/* HEADER - MISMO PATRÓN QUE DASHBOARD PRINCIPAL */}
            <div style={{
                padding: 'var(--spacing-lg)',
                marginBottom: '64px',
                position: 'relative',
                zIndex: 10
            }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
                            Empleados
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            {selectedBranch ? `Sucursal: ${selectedBranch.name}` : "Gestiona tu equipo"}
                        </p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <button className="button-modern flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600">
                                <Plus size={18} />
                                Nuevo Empleado
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">
                                    Registrar Nuevo Empleado
                                </DialogTitle>
                                <DialogDescription className="sr-only">
                                    Formulario para registrar un nuevo empleado en el sistema.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <ModernInput
                                        label="Nombre"
                                        value={newEmployee.firstName}
                                        onChange={(val) => setNewEmployee({ ...newEmployee, firstName: val })}
                                    />
                                    <ModernInput
                                        label="Apellido"
                                        value={newEmployee.lastName}
                                        onChange={(val) => setNewEmployee({ ...newEmployee, lastName: val })}
                                    />
                                </div>
                                <ModernInput
                                    label="Email"
                                    type="email"
                                    value={newEmployee.email}
                                    onChange={(val) => setNewEmployee({ ...newEmployee, email: val })}
                                />
                                <ModernInput
                                    label="Teléfono"
                                    value={newEmployee.phone}
                                    onChange={(val) => setNewEmployee({ ...newEmployee, phone: val })}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Rol</label>
                                        <Select value={newEmployee.role} onValueChange={(v) => setNewEmployee({ ...newEmployee, role: v })}>
                                            <SelectTrigger className="w-full px-4 py-3 rounded-xl border-2 border-border">
                                                <SelectValue placeholder="Seleccionar rol" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MANAGER">Gerente</SelectItem>
                                                <SelectItem value="ADMIN">Administrador</SelectItem>
                                                <SelectItem value="TEACHER">Maestro</SelectItem>
                                                <SelectItem value="STAFF">Encargado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Modelo de Pago</label>
                                        <Select value={newEmployee.paymentModel} onValueChange={(v) => setNewEmployee({ ...newEmployee, paymentModel: v })}>
                                            <SelectTrigger className="w-full px-4 py-3 rounded-xl border-2 border-border">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="FIXED">Salario Fijo</SelectItem>
                                                <SelectItem value="HOURLY">Por Hora</SelectItem>
                                                <SelectItem value="COMMISSION">Por Comisión</SelectItem>
                                                <SelectItem value="MIXED">Mixto (Base + Comisión)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Campos dinámicos según modelo de pago */}
                                {(newEmployee.paymentModel === "FIXED" || newEmployee.paymentModel === "MIXED") && (
                                    <ModernInput
                                        label="Salario Base"
                                        type="number"
                                        value={newEmployee.salary}
                                        onChange={(val) => setNewEmployee({ ...newEmployee, salary: val })}
                                        placeholder="Ej: 15000"
                                    />
                                )}

                                {newEmployee.paymentModel === "HOURLY" && (
                                    <ModernInput
                                        label="Tarifa por Hora"
                                        type="number"
                                        value={newEmployee.hourlyRate}
                                        onChange={(val) => setNewEmployee({ ...newEmployee, hourlyRate: val })}
                                        placeholder="Ej: 200"
                                    />
                                )}

                                {(newEmployee.paymentModel === "COMMISSION" || newEmployee.paymentModel === "MIXED") && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-4">
                                        <p className="text-sm text-blue-800 font-medium mb-4">📊 Configuración de Comisión</p>
                                        <div className="grid grid-cols-2 gap-4 items-end">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-600 mb-2">% que recibe el empleado</label>
                                                <input
                                                    type="number"
                                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-lg font-bold"
                                                    value={newEmployee.commissionPercentage}
                                                    onChange={(e) => setNewEmployee({ ...newEmployee, commissionPercentage: e.target.value })}
                                                    placeholder="60"
                                                />
                                            </div>
                                            <div className="px-4 py-3 bg-slate-100 rounded-xl text-sm text-slate-600 text-center h-[52px] flex items-center justify-center">
                                                Escuela: {100 - (parseFloat(newEmployee.commissionPercentage) || 0)}%
                                            </div>
                                        </div>
                                        <ModernInput
                                            label="% Reserva (Aguinaldos, etc.) - Opcional"
                                            type="number"
                                            value={newEmployee.reservePercentage}
                                            onChange={(val) => setNewEmployee({ ...newEmployee, reservePercentage: val })}
                                            placeholder="Ej: 5"
                                        />
                                        {newEmployee.commissionPercentage && (
                                            <div className="text-xs text-slate-500 bg-white p-3 rounded-lg">
                                                <strong>Ejemplo:</strong> Si el alumno paga $500:
                                                <br />• Empleado recibe: ${(500 * (parseFloat(newEmployee.commissionPercentage) || 0) / 100 * (1 - (parseFloat(newEmployee.reservePercentage) || 0) / 100)).toFixed(0)}
                                                <br />• Reserva: ${(500 * (parseFloat(newEmployee.commissionPercentage) || 0) / 100 * (parseFloat(newEmployee.reservePercentage) || 0) / 100).toFixed(0)}
                                                <br />• Escuela: ${(500 * (100 - (parseFloat(newEmployee.commissionPercentage) || 0)) / 100).toFixed(0)}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Frecuencia de Pago</label>
                                        <Select value={newEmployee.paymentFrequency} onValueChange={(v) => setNewEmployee({ ...newEmployee, paymentFrequency: v })}>
                                            <SelectTrigger className="w-full px-4 py-3 rounded-xl border-2 border-border">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="WEEKLY">Semanal</SelectItem>
                                                <SelectItem value="BIWEEKLY">Quincenal</SelectItem>
                                                <SelectItem value="MONTHLY">Mensual</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <ModernInput
                                        label={newEmployee.paymentFrequency === "MONTHLY" ? "Día del Mes" : "Día de la Semana"}
                                        type="number"
                                        value={newEmployee.paymentDay}
                                        onChange={(val) => setNewEmployee({ ...newEmployee, paymentDay: val })}
                                        placeholder={newEmployee.paymentFrequency === "MONTHLY" ? "1-31" : "1-7"}
                                    />
                                </div>

                                {/* SELECTOR DE SUCURSALES */}
                                <div className="pt-4 border-t border-slate-100">
                                    <BranchMultiSelector
                                        selectedBranchIds={newEmployee.branchIds || []}
                                        onChange={(ids) => setNewEmployee({ ...newEmployee, branchIds: ids })}
                                        helperText="Si no seleccionas ninguna, el empleado será global (visible en todas)."
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <button
                                    onClick={handleCreate}
                                    disabled={!newEmployee.firstName || !newEmployee.lastName}
                                    className="button-modern bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 disabled:opacity-50"
                                >
                                    Guardar Empleado
                                </button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* KPIS - MISMO PATRÓN QUE DASHBOARD PRINCIPAL */}
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
                        title="Total Empleados"
                        value={totalEmployees.toString()}
                        icon={Users}
                        trend={3}
                        positive={true}
                        gradientClass="gradient-employees"
                        subtitle="En la sucursal"
                    />
                    <ModernKpiCard
                        title="Nómina Total"
                        value={`$${totalSalaries.toLocaleString()}`}
                        icon={DollarSign}
                        gradientClass="gradient-finance"
                        subtitle="MXN"
                    />
                    <ModernKpiCard
                        title="Maestros"
                        value={teachers.toString()}
                        icon={Briefcase}
                        gradientClass="gradient-courses"
                        subtitle="Personal docente"
                    />
                    <ModernKpiCard
                        title="Staff"
                        value={staff.toString()}
                        icon={TrendingUp}
                        gradientClass="gradient-reports"
                        subtitle="Personal administrativo"
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
                            placeholder="Buscar empleados..."
                            filters={[
                                { label: "Gerentes", value: "MANAGER", color: "purple" },
                                { label: "Administradores", value: "ADMIN", color: "blue" },
                                { label: "Maestros", value: "TEACHER", color: "green" },
                                { label: "Encargados", value: "STAFF", color: "orange" }
                            ]}
                            activeFilters={filterRole}
                            onFilterToggle={(value) => {
                                setFilterRole(prev =>
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
                                backgroundColor: '#0d9488',
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
                                {selectedIds.length === 0 ? 'Haz clic en los empleados para seleccionarlos' : 'empleados seleccionados'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setSelectedIds(filteredEmployees.map(e => e.id))}
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

            {/* SECCIÓN EMPLEADOS */}
            <section style={{ padding: '0 var(--spacing-lg)', minHeight: '500px' }} className="pb-8">
                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="animate-spin w-12 h-12 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-slate-500">Cargando empleados...</p>
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">👥</div>
                        <p className="text-slate-500 text-lg">No hay empleados registrados</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '32px' }}>
                        {filteredEmployees.map((employee, index) => {
                            const employeeColors: Record<number, { bg: string; accent: string }> = {
                                0: { bg: '#DBEAFE', accent: '#2563EB' },
                                1: { bg: '#EDE9FE', accent: '#7C3AED' },
                                2: { bg: '#FCE7F3', accent: '#DB2777' },
                                3: { bg: '#FFEDD5', accent: '#EA580C' },
                                4: { bg: '#D1FAE5', accent: '#059669' },
                                5: { bg: '#CCFBF1', accent: '#0D9488' },
                            };
                            const colors = employeeColors[index % 6];
                            const isSelected = selectedIds.includes(employee.id);

                            return (
                                <div
                                    key={employee.id}
                                    className={`employee-card ${isSelectionMode ? 'cursor-pointer' : ''}`}
                                    onClick={() => isSelectionMode && toggleSelection(employee.id)}
                                    style={{
                                        backgroundColor: colors.bg,
                                        borderRadius: '20px',
                                        padding: '28px',
                                        minHeight: '280px',
                                        boxShadow: isSelected ? '0 0 0 3px #0d9488' : '0 10px 40px rgba(0,0,0,0.12)',
                                        display: 'flex',
                                        flexDirection: 'column' as const,
                                        position: 'relative' as const
                                    }}
                                >
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
                                                backgroundColor: isSelected ? '#0d9488' : 'white',
                                                border: isSelected ? 'none' : '2px solid #E2E8F0',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                            onClick={(e) => { e.stopPropagation(); toggleSelection(employee.id); }}
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
                                        {employee.lastName[0]}{employee.firstName[0]}
                                    </div>

                                    {/* NOMBRE */}
                                    <h3 style={{
                                        fontSize: '22px',
                                        fontWeight: 'bold',
                                        color: '#1E293B',
                                        marginBottom: '8px'
                                    }}>
                                        {employee.lastName} {employee.firstName}
                                    </h3>

                                    {/* ROL */}
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
                                            {roleLabels[employee.role] || employee.role}
                                        </span>
                                        {/* Indicador Global vs Sucursal */}
                                        {/* Indicador Global vs Sucursal */}
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {employee.branches && employee.branches.length > 0 ? (
                                                employee.branches.map((b: any) => (
                                                    <span key={b.id} style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        padding: '6px 12px',
                                                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                                        borderRadius: '20px',
                                                        fontSize: '11px',
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
                                                    padding: '6px 12px',
                                                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                                    borderRadius: '20px',
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    color: '#10B981',
                                                }}>
                                                    🌐 Global
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* CONTACTO */}
                                    <div style={{ flex: 1, fontSize: '14px', color: '#475569' }}>
                                        <div style={{ marginBottom: '8px' }}>📧 {employee.email}</div>
                                        {employee.phone && <div>📱 {employee.phone}</div>}
                                    </div>

                                    {/* PAGO + ACCIONES (misma fila) */}
                                    <div style={{
                                        marginTop: '16px',
                                        paddingTop: '16px',
                                        borderTop: '2px solid rgba(255,255,255,0.5)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        <div>
                                            {employee.paymentModel === "FIXED" && employee.salary && (
                                                <>
                                                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A' }}>
                                                        ${parseFloat(employee.salary).toLocaleString()}
                                                    </div>
                                                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: colors.accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        Salario Fijo
                                                    </div>
                                                </>
                                            )}
                                            {employee.paymentModel === "HOURLY" && employee.hourlyRate && (
                                                <>
                                                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A' }}>
                                                        ${parseFloat(employee.hourlyRate).toLocaleString()}/hr
                                                    </div>
                                                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        Por Hora
                                                    </div>
                                                </>
                                            )}
                                            {employee.paymentModel === "COMMISSION" && (
                                                <>
                                                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A' }}>
                                                        {employee.commissionPercentage || 0}%
                                                    </div>
                                                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        Comisión {employee.reservePercentage ? `(${employee.reservePercentage}% reserva)` : ''}
                                                    </div>
                                                </>
                                            )}
                                            {employee.paymentModel === "MIXED" && (
                                                <>
                                                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A' }}>
                                                        ${parseFloat(employee.salary || 0).toLocaleString()} + {employee.commissionPercentage || 0}%
                                                    </div>
                                                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        Mixto (Base + Comisión)
                                                    </div>
                                                </>
                                            )}
                                            {(!employee.paymentModel || employee.paymentModel === "FIXED") && !employee.salary && (
                                                <span style={{ fontSize: '14px', color: '#94A3B8' }}>Sin pago configurado</span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => {
                                                    setSelectedEmployee(employee);
                                                    setCreateUserOpen(true);
                                                }}
                                                title="Dar acceso al sistema"
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
                                                }}>
                                                <Key size={18} color="#3B82F6" />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(employee)}
                                                title="Editar empleado"
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
                                                }}>
                                                <Edit size={18} color={colors.accent} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedEmployee(employee);
                                                    setDeleteOpen(true);
                                                }}
                                                title="Eliminar empleado"
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
                                                }}>
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

            {/* Create User Dialog */}
            <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Key size={20} className="text-blue-500" />
                            Dar Acceso al Sistema
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Formulario para crear una cuenta de acceso para el empleado.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <p className="text-sm text-blue-800">
                                Se creará una cuenta para <strong>{selectedEmployee?.firstName} {selectedEmployee?.lastName}</strong> con acceso al sistema.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                                <div className="px-3 py-2 bg-slate-100 rounded-lg text-sm font-medium text-slate-700">
                                    {selectedEmployee?.email || "Sin email"}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Rol de acceso</label>
                                <div className="px-3 py-2 bg-slate-100 rounded-lg text-sm font-medium text-slate-700">
                                    {roleLabels[selectedEmployee?.role] || selectedEmployee?.role}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Contraseña temporal</label>
                            <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm font-mono font-bold text-amber-800">
                                password123
                            </div>
                            <p className="text-xs text-slate-500 mt-1">⚠️ El usuario deberá cambiar esta contraseña al iniciar sesión.</p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <button
                            onClick={() => setCreateUserOpen(false)}
                            className="button-modern bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreateUser}
                            disabled={!selectedEmployee?.email}
                            className="button-modern bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Key size={16} className="mr-2" />
                            Crear Cuenta de Acceso
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Employee Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Edit size={20} className="text-blue-500" />
                            Editar Empleado
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <ModernInput
                                label="Nombre"
                                value={editingEmployee?.firstName || ""}
                                onChange={(val) => setEditingEmployee({ ...editingEmployee, firstName: val })}
                            />
                            <ModernInput
                                label="Apellido"
                                value={editingEmployee?.lastName || ""}
                                onChange={(val) => setEditingEmployee({ ...editingEmployee, lastName: val })}
                            />
                        </div>
                        <ModernInput
                            label="Email"
                            type="email"
                            value={editingEmployee?.email || ""}
                            onChange={(val) => setEditingEmployee({ ...editingEmployee, email: val })}
                        />
                        <ModernInput
                            label="Teléfono"
                            value={editingEmployee?.phone || ""}
                            onChange={(val) => setEditingEmployee({ ...editingEmployee, phone: val })}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Rol</label>
                                <Select value={editingEmployee?.role || "STAFF"} onValueChange={(v) => setEditingEmployee({ ...editingEmployee, role: v })}>
                                    <SelectTrigger className="w-full px-4 py-3 rounded-xl border-2 border-border">
                                        <SelectValue placeholder="Seleccionar rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MANAGER">Gerente</SelectItem>
                                        <SelectItem value="ADMIN">Administrador</SelectItem>
                                        <SelectItem value="TEACHER">Maestro</SelectItem>
                                        <SelectItem value="STAFF">Encargado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Modelo de Pago</label>
                                <Select value={editingEmployee?.paymentModel || "FIXED"} onValueChange={(v) => setEditingEmployee({ ...editingEmployee, paymentModel: v })}>
                                    <SelectTrigger className="w-full px-4 py-3 rounded-xl border-2 border-border">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="FIXED">Salario Fijo</SelectItem>
                                        <SelectItem value="HOURLY">Por Hora</SelectItem>
                                        <SelectItem value="COMMISSION">Por Comisión</SelectItem>
                                        <SelectItem value="MIXED">Mixto (Base + Comisión)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Campos dinámicos según modelo de pago */}
                        {(editingEmployee?.paymentModel === "FIXED" || editingEmployee?.paymentModel === "MIXED") && (
                            <ModernInput
                                label="Salario Base"
                                type="number"
                                value={editingEmployee?.salary || ""}
                                onChange={(val) => setEditingEmployee({ ...editingEmployee, salary: val })}
                            />
                        )}

                        {editingEmployee?.paymentModel === "HOURLY" && (
                            <ModernInput
                                label="Tarifa por Hora"
                                type="number"
                                value={editingEmployee?.hourlyRate || ""}
                                onChange={(val) => setEditingEmployee({ ...editingEmployee, hourlyRate: val })}
                            />
                        )}

                        {(editingEmployee?.paymentModel === "COMMISSION" || editingEmployee?.paymentModel === "MIXED") && (
                            <div className="space-y-3">
                                <p className="text-sm text-blue-800 font-medium flex items-center gap-2">📊 Configuración de Comisión</p>
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 pt-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4 items-end">
                                        <ModernInput
                                            label="% del Empleado"
                                            type="number"
                                            value={editingEmployee?.commissionPercentage || ""}
                                            onChange={(val) => setEditingEmployee({ ...editingEmployee, commissionPercentage: val })}
                                        />
                                        <div className="px-4 py-3 bg-slate-100 rounded-xl text-sm text-slate-600 text-center h-[52px] flex items-center justify-center">
                                            Escuela: {100 - (parseFloat(editingEmployee?.commissionPercentage) || 0)}%
                                        </div>
                                    </div>
                                    <ModernInput
                                        label="% Reserva (Aguinaldos) - Opcional"
                                        type="number"
                                        value={editingEmployee?.reservePercentage || ""}
                                        onChange={(val) => setEditingEmployee({ ...editingEmployee, reservePercentage: val })}
                                    />
                                </div>
                            </div>
                        )}

                        {/* BRANCH SELECTOR FOR EDIT */}
                        <div className="pt-4 border-t border-slate-100">
                            <BranchMultiSelector
                                selectedBranchIds={editingEmployee?.branchIds || []}
                                onChange={(ids) => setEditingEmployee({ ...editingEmployee, branchIds: ids })}
                                helperText="Si no seleccionas ninguna, el empleado será global (visible en todas)."
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
                            className="button-modern bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                        >
                            Guardar Cambios
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-600">
                            <Trash2 size={20} />
                            Eliminar Empleado
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <p className="text-sm text-red-800">
                                ¿Estás seguro de que deseas eliminar a <strong>{selectedEmployee?.firstName} {selectedEmployee?.lastName}</strong>?
                            </p>
                            <p className="text-xs text-red-600 mt-2">Esta acción no se puede deshacer.</p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <button
                            onClick={() => setDeleteOpen(false)}
                            className="button-modern bg-gradient-to-r from-slate-600 to-slate-500 hover:from-slate-700 hover:to-slate-600 text-white"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleDelete}
                            className="button-modern bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600"
                        >
                            <Trash2 size={16} className="mr-2" />
                            Eliminar
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
