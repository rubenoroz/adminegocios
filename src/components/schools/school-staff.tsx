"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Users, Briefcase, GraduationCap, Edit, Trash2, Key, X, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranch } from "@/context/branch-context";
import { useToast } from "@/components/ui/use-toast";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";
import { ModernFilterBar } from "@/components/ui/modern-filter-bar";

// Roles específicos para escuela
const SCHOOL_ROLES = ["TEACHER", "RECEPTIONIST", "ADMIN", "MANAGER"];

const roleLabels: Record<string, string> = {
    "TEACHER": "Maestro",
    "RECEPTIONIST": "Recepcionista",
    "ADMIN": "Administrador",
    "MANAGER": "Coordinador",
};

export function SchoolStaff() {
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchValue, setSearchValue] = useState("");
    const [filterRole, setFilterRole] = useState<string[]>([]);
    const [open, setOpen] = useState(false);
    const [newEmployee, setNewEmployee] = useState({
        firstName: "", lastName: "", email: "", phone: "", role: "TEACHER",
        paymentModel: "FIXED", salary: "", commissionPercentage: "", reservePercentage: ""
    });
    const [isSaving, setIsSaving] = useState(false);

    // Edit state
    const [editOpen, setEditOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<any>(null);

    // Access Management State
    const [accessModalOpen, setAccessModalOpen] = useState(false);
    const [accessEmployee, setAccessEmployee] = useState<any>(null);
    const [tempCreds, setTempCreds] = useState<{ email: string, pass: string } | null>(null);

    useEffect(() => {
        fetchEmployees();
    }, [selectedBranch]);

    const fetchEmployees = async () => {
        if (!selectedBranch) return;

        setLoading(true);
        try {
            const url = selectedBranch.id
                ? `/api/employees?branchId=${selectedBranch.id}`
                : `/api/employees?businessId=${selectedBranch.businessId}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                // Filtrar solo roles de escuela
                setEmployees(data.filter((e: any) => SCHOOL_ROLES.includes(e.role)));
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const res = await fetch("/api/employees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...newEmployee,
                    branchId: selectedBranch?.id,
                    businessId: selectedBranch?.businessId,
                    salary: newEmployee.salary ? parseFloat(newEmployee.salary) : null,
                    commissionPercentage: newEmployee.commissionPercentage ? parseFloat(newEmployee.commissionPercentage) : null,
                    reservePercentage: newEmployee.reservePercentage ? parseFloat(newEmployee.reservePercentage) : null
                })
            });
            if (res.ok) {
                toast({ title: "Personal agregado exitosamente" });
                setOpen(false);
                setNewEmployee({ firstName: "", lastName: "", email: "", phone: "", role: "TEACHER", paymentModel: "FIXED", salary: "", commissionPercentage: "", reservePercentage: "" });
                fetchEmployees();
            } else {
                const error = await res.json();
                toast({ title: "Error: " + error.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error al crear empleado", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este empleado?")) return;
        try {
            await fetch(`/api/employees/${id}`, { method: "DELETE" });
            toast({ title: "Empleado eliminado" });
            fetchEmployees();
        } catch (error) {
            toast({ title: "Error al eliminar", variant: "destructive" });
        }
    };

    const openEditModal = (emp: any) => {
        setEditingEmployee({
            ...emp,
            salary: emp.salary?.toString() || "",
            commissionPercentage: emp.commissionPercentage?.toString() || "",
            reservePercentage: emp.reservePercentage?.toString() || ""
        });
        setEditOpen(true);
    };

    const handleUpdate = async () => {
        if (!editingEmployee || isSaving) return;
        setIsSaving(true);
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
                    commissionPercentage: editingEmployee.commissionPercentage ? parseFloat(editingEmployee.commissionPercentage) : null,
                    reservePercentage: editingEmployee.reservePercentage ? parseFloat(editingEmployee.reservePercentage) : null
                })
            });
            if (res.ok) {
                toast({ title: "Personal actualizado exitosamente" });
                setEditOpen(false);
                setEditingEmployee(null);
                fetchEmployees();
            } else {
                const error = await res.json();
                toast({ title: "Error: " + (error.message || "No se pudo actualizar"), variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error al actualizar", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleGrantAccess = async (emp: any, reset = false) => {
        if (!emp.email) {
            toast({ title: "El empleado necesita un email para tener acceso", variant: "destructive" });
            return;
        }

        // If they already have access and not resetting, open management modal
        if (emp.userId && !reset) {
            setAccessEmployee(emp);
            setAccessModalOpen(true);
            setTempCreds(null);
            return;
        }

        if (!reset && !confirm(`¿Crear cuenta de acceso para ${emp.firstName}?`)) return;
        if (reset && !confirm(`¿Estás seguro de restablecer la contraseña de ${emp.firstName}? El usuario anterior dejará de funcionar.`)) return;

        try {
            const res = await fetch(`/api/employees/${emp.id}/access`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reset })
            });
            const data = await res.json();

            if (res.ok) {
                if (data.isNewUser || data.passwordReset) {
                    setAccessEmployee(emp);
                    setTempCreds({ email: emp.email, pass: data.tempPassword });
                    setAccessModalOpen(true);
                } else {
                    toast({ title: "Cuenta vinculada exitosamente" });
                    fetchEmployees();
                }
            } else {
                toast({ title: "Error: " + data.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error al otorgar acceso", variant: "destructive" });
        }
    };

    // Filtrar empleados
    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = searchValue === "" ||
            `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchValue.toLowerCase()) ||
            emp.email?.toLowerCase().includes(searchValue.toLowerCase());
        const matchesFilter = filterRole.length === 0 || filterRole.includes(emp.role);
        return matchesSearch && matchesFilter;
    });

    // Stats
    const totalStaff = employees.length;
    const teachers = employees.filter(e => e.role === "TEACHER").length;
    const admins = employees.filter(e => e.role === "ADMIN" || e.role === "MANAGER").length;
    const receptionists = employees.filter(e => e.role === "RECEPTIONIST").length;

    return (
        <div className="bg-slate-100 pb-16">
            {/* Header */}
            <div style={{ padding: "var(--spacing-lg)", marginBottom: "32px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">Personal de Escuela</h1>
                        <p className="text-muted-foreground text-lg">
                            {selectedBranch ? `Sucursal: ${selectedBranch.name}` : "Gestiona maestros y personal administrativo"}
                        </p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <button className="button-modern gradient-green" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Plus size={18} /> Nuevo Personal
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle style={{ fontSize: "1.5rem", fontWeight: 700 }}>Agregar Personal</DialogTitle>
                                <DialogDescription style={{ color: "#64748b" }}>Completa los datos del nuevo miembro del equipo</DialogDescription>
                            </DialogHeader>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px 0" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>Nombre *</label>
                                        <input type="text" value={newEmployee.firstName} onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })} className="modern-input" placeholder="Juan" />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>Apellido *</label>
                                        <input type="text" value={newEmployee.lastName} onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })} className="modern-input" placeholder="Pérez" />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>Email</label>
                                    <input type="email" value={newEmployee.email} onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })} className="modern-input" placeholder="email@escuela.com" />
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>Teléfono</label>
                                        <input type="tel" value={newEmployee.phone} onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })} className="modern-input" placeholder="+52 555 123 4567" />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>Rol *</label>
                                        <select value={newEmployee.role} onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })} className="modern-input">
                                            <option value="TEACHER">Maestro</option>
                                            <option value="RECEPTIONIST">Recepcionista</option>
                                            <option value="ADMIN">Administrador</option>
                                            <option value="MANAGER">Coordinador</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>Modelo de Pago</label>
                                        <select value={newEmployee.paymentModel} onChange={(e) => setNewEmployee({ ...newEmployee, paymentModel: e.target.value })} className="modern-input">
                                            <option value="FIXED">Salario Fijo</option>
                                            <option value="COMMISSION">Por Comisión</option>
                                            <option value="MIXED">Mixto</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>
                                            {newEmployee.paymentModel === "COMMISSION" ? "% Comisión" : "Salario"}
                                        </label>
                                        <input
                                            type="number"
                                            value={newEmployee.paymentModel === "COMMISSION" ? newEmployee.commissionPercentage : newEmployee.salary}
                                            onChange={(e) => setNewEmployee({
                                                ...newEmployee,
                                                [newEmployee.paymentModel === "COMMISSION" ? "commissionPercentage" : "salary"]: e.target.value
                                            })}
                                            className="modern-input"
                                            placeholder={newEmployee.paymentModel === "COMMISSION" ? "60" : "15000"}
                                        />
                                    </div>
                                    {(newEmployee.paymentModel === "COMMISSION" || newEmployee.paymentModel === "MIXED") && (
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>% Reserva Acumulada (Opcional)</label>
                                            <input
                                                type="number"
                                                value={newEmployee.reservePercentage || ''}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, reservePercentage: e.target.value })}
                                                className="modern-input"
                                                placeholder="Ej: 5 (para 5%)"
                                                max="100"
                                            />
                                            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Porcentaje que se retiene de la comisión para el fondo de reserva del maestro.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <DialogFooter style={{ gap: "12px" }}>
                                <button onClick={() => setOpen(false)} className="filter-chip">Cancelar</button>
                                <button onClick={handleCreate} disabled={!newEmployee.firstName || !newEmployee.lastName || isSaving} className="button-modern gradient-green flex items-center gap-2" style={{ opacity: (!newEmployee.firstName || !newEmployee.lastName || isSaving) ? 0.5 : 1 }}>
                                    {isSaving && <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />}
                                    {isSaving ? "Guardando..." : "Guardar"}
                                </button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* KPIs */}
            <motion.div style={{ padding: "0 var(--spacing-lg)", marginBottom: "32px" }} initial="hidden" animate="show" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <ModernKpiCard title="Total Personal" value={totalStaff.toString()} icon={Users} gradientClass="gradient-courses" subtitle="En la escuela" />
                    <ModernKpiCard title="Maestros" value={teachers.toString()} icon={GraduationCap} gradientClass="gradient-students" subtitle="Personal docente" />
                    <ModernKpiCard title="Administrativos" value={admins.toString()} icon={Briefcase} gradientClass="gradient-finance" subtitle="Coordinadores y admins" />
                    <ModernKpiCard title="Recepción" value={receptionists.toString()} icon={Users} gradientClass="gradient-employees" subtitle="Atención al público" />
                </div>
            </motion.div>

            {/* Filtros */}
            <div style={{ padding: "0 var(--spacing-lg)", marginBottom: "24px" }}>
                <ModernFilterBar
                    searchValue={searchValue}
                    onSearchChange={setSearchValue}
                    placeholder="Buscar personal..."
                    filters={[
                        { label: "Maestros", value: "TEACHER", color: "green" },
                        { label: "Recepcionistas", value: "RECEPTIONIST", color: "blue" },
                        { label: "Administradores", value: "ADMIN", color: "purple" },
                        { label: "Coordinadores", value: "MANAGER", color: "orange" }
                    ]}
                    activeFilters={filterRole}
                    onFilterToggle={(value) => setFilterRole(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value])}
                />
            </div>

            {/* Lista */}
            <section style={{ padding: "0 var(--spacing-lg)" }} className="pb-8">
                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="animate-spin w-12 h-12 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-slate-500">Cargando personal...</p>
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">👩‍🏫</div>
                        <p className="text-slate-500 text-lg">No hay personal registrado</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
                        {filteredEmployees.map((emp, index) => {
                            const colors = [
                                { bg: "#D1FAE5", accent: "#059669" },
                                { bg: "#DBEAFE", accent: "#2563EB" },
                                { bg: "#EDE9FE", accent: "#7C3AED" },
                                { bg: "#FFEDD5", accent: "#EA580C" }
                            ][index % 4];

                            return (
                                <motion.div
                                    key={emp.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        backgroundColor: colors.bg,
                                        borderRadius: "16px",
                                        padding: "24px",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                                        <div style={{
                                            width: "56px", height: "56px", borderRadius: "14px",
                                            backgroundColor: colors.accent, color: "white",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "20px", fontWeight: "bold"
                                        }}>
                                            {emp.firstName[0]}{emp.lastName[0]}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#1e293b" }}>{emp.firstName} {emp.lastName}</h3>
                                            <span style={{
                                                display: "inline-block", padding: "4px 12px",
                                                backgroundColor: "rgba(255,255,255,0.8)", borderRadius: "12px",
                                                fontSize: "12px", fontWeight: 600, color: colors.accent
                                            }}>
                                                {roleLabels[emp.role] || emp.role}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>
                                        {emp.email && <div>📧 {emp.email}</div>}
                                        {emp.phone && <div>📱 {emp.phone}</div>}
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", borderTop: "2px solid rgba(255,255,255,0.5)" }}>
                                        <div>
                                            {emp.paymentModel === "FIXED" && emp.salary && (
                                                <div style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a" }}>${parseFloat(emp.salary).toLocaleString()}</div>
                                            )}
                                            {emp.paymentModel === "COMMISSION" && (
                                                <div style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a" }}>{emp.commissionPercentage || 0}%</div>
                                            )}
                                            <div style={{ fontSize: "11px", color: colors.accent, fontWeight: 600, textTransform: "uppercase" }}>
                                                {emp.paymentModel === "COMMISSION" ? "Comisión" : emp.paymentModel === "MIXED" ? "Mixto" : "Salario"}
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            {/* Access Button Group */}
                                            <button
                                                onClick={() => handleGrantAccess(emp)}
                                                title={emp.userId ? "Gestionar Acceso" : "Dar Acceso al Sistema"}
                                                style={{
                                                    padding: "0 12px", height: "36px", borderRadius: "10px",
                                                    backgroundColor: emp.userId ? "#f0fdf4" : "#fffbeb",
                                                    border: emp.userId ? "1px solid #bbf7d0" : "1px solid #fde68a",
                                                    display: "flex", alignItems: "center", gap: "6px",
                                                    cursor: "pointer",
                                                    transition: "all 0.2s"
                                                }}
                                            >
                                                {emp.userId ? (
                                                    <>
                                                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a" }} />
                                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#166534" }}>Activo</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Key size={14} color="#d97706" />
                                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#b45309" }}>Dar Acceso</span>
                                                    </>
                                                )}
                                            </button>

                                            <div style={{ width: "1px", height: "24px", background: "#cbd5e1", margin: "auto 4px" }} />

                                            <button
                                                onClick={() => openEditModal(emp)}
                                                style={{
                                                    width: "36px", height: "36px", borderRadius: "10px",
                                                    backgroundColor: "white", border: "1px solid #e2e8f0",
                                                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                                                }}
                                            >
                                                <Edit size={16} color={colors.accent} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(emp.id)}
                                                style={{
                                                    width: "36px", height: "36px", borderRadius: "10px",
                                                    backgroundColor: "white", border: "1px solid #e2e8f0",
                                                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                                                }}
                                            >
                                                <Trash2 size={16} color="#ef4444" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </section>


            {/* Edit Modal */}
            < Dialog open={editOpen} onOpenChange={setEditOpen} >
                <DialogContent style={{
                    maxWidth: '560px',
                    maxHeight: '90vh',
                    padding: 0,
                    borderRadius: '24px',
                    overflow: 'hidden',
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                        padding: '24px 32px',
                        color: 'white'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '52px',
                                height: '52px',
                                borderRadius: '14px',
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                fontWeight: 'bold'
                            }}>
                                {editingEmployee?.firstName?.[0]}{editingEmployee?.lastName?.[0]}
                            </div>
                            <div>
                                <DialogTitle style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Editar Personal</DialogTitle>
                                <p style={{ fontSize: '14px', opacity: 0.9, margin: 0, marginTop: '2px' }}>
                                    {editingEmployee?.firstName} {editingEmployee?.lastName}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    {editingEmployee && (
                        <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Nombre</label>
                                    <input
                                        type="text"
                                        value={editingEmployee.firstName}
                                        onChange={(e) => setEditingEmployee({ ...editingEmployee, firstName: e.target.value })}
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '14px', fontWeight: 500, outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Apellido</label>
                                    <input
                                        type="text"
                                        value={editingEmployee.lastName}
                                        onChange={(e) => setEditingEmployee({ ...editingEmployee, lastName: e.target.value })}
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '14px', fontWeight: 500, outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Email</label>
                                <input
                                    type="email"
                                    value={editingEmployee.email || ''}
                                    onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Teléfono</label>
                                <input
                                    type="tel"
                                    value={editingEmployee.phone || ''}
                                    onChange={(e) => setEditingEmployee({ ...editingEmployee, phone: e.target.value })}
                                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Rol</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {SCHOOL_ROLES.map(role => (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => setEditingEmployee({ ...editingEmployee, role })}
                                            style={{
                                                padding: '10px 16px',
                                                borderRadius: '12px',
                                                border: editingEmployee.role === role ? '2px solid #059669' : '2px solid #e2e8f0',
                                                background: editingEmployee.role === role ? '#d1fae5' : '#fff',
                                                color: editingEmployee.role === role ? '#059669' : '#64748b',
                                                fontWeight: 600,
                                                fontSize: '13px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {roleLabels[role]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Modelo de Pago</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {[
                                        { value: 'FIXED', label: 'Salario Fijo' },
                                        { value: 'COMMISSION', label: 'Comisión' },
                                        { value: 'MIXED', label: 'Mixto' }
                                    ].map(p => (
                                        <button
                                            key={p.value}
                                            type="button"
                                            onClick={() => setEditingEmployee({ ...editingEmployee, paymentModel: p.value })}
                                            style={{
                                                padding: '10px 16px',
                                                borderRadius: '12px',
                                                border: editingEmployee.paymentModel === p.value ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                                                background: editingEmployee.paymentModel === p.value ? '#dbeafe' : '#fff',
                                                color: editingEmployee.paymentModel === p.value ? '#2563eb' : '#64748b',
                                                fontWeight: 600,
                                                fontSize: '13px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {(editingEmployee.paymentModel === 'FIXED' || editingEmployee.paymentModel === 'MIXED') && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>💰 Salario</label>
                                    <input
                                        type="number"
                                        value={editingEmployee.salary}
                                        onChange={(e) => setEditingEmployee({ ...editingEmployee, salary: e.target.value })}
                                        placeholder="15000"
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                            )}

                            {(editingEmployee.paymentModel === 'COMMISSION' || editingEmployee.paymentModel === 'MIXED') && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>📊 % Comisión</label>
                                    <input
                                        type="number"
                                        value={editingEmployee.commissionPercentage}
                                        onChange={(e) => setEditingEmployee({ ...editingEmployee, commissionPercentage: e.target.value })}
                                        placeholder="60"
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                            )}

                            {(editingEmployee.paymentModel === 'COMMISSION' || editingEmployee.paymentModel === 'MIXED') && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>🏦 % Reserva Acumulada (Opcional)</label>
                                    <input
                                        type="number"
                                        value={editingEmployee.reservePercentage || ''}
                                        onChange={(e) => setEditingEmployee({ ...editingEmployee, reservePercentage: e.target.value })}
                                        placeholder="Ej: 5"
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                    <p style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                                        Este porcentaje se descontará de la comisión y se guardará como un fondo.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <div style={{
                        padding: '16px 32px',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '12px',
                        background: '#f8fafc'
                    }}>
                        <button
                            onClick={() => { setEditOpen(false); setEditingEmployee(null); }}
                            style={{
                                padding: '12px 24px',
                                borderRadius: '12px',
                                border: '2px solid #e2e8f0',
                                background: 'white',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#64748b',
                                cursor: 'pointer'
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleUpdate}
                            disabled={isSaving || !editingEmployee?.firstName || !editingEmployee?.lastName}
                            style={{
                                padding: '12px 28px',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: 'white',
                                cursor: (isSaving || !editingEmployee?.firstName) ? 'not-allowed' : 'pointer',
                                opacity: (isSaving || !editingEmployee?.firstName) ? 0.5 : 1,
                                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {isSaving && <div style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
                            <Check size={16} />
                            Guardar Cambios
                        </button>
                    </div>
                </DialogContent>
            </Dialog >

            {/* Access Management Modal */}
            < Dialog open={accessModalOpen} onOpenChange={setAccessModalOpen} >
                <DialogContent style={{
                    maxWidth: '450px',
                    padding: '0',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    border: 'none'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        padding: '24px 32px',
                        color: 'white'
                    }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                            <Key size={24} /> Credenciales de Acceso
                        </h2>
                        <p style={{ opacity: 0.9, margin: "4px 0 0 0", fontSize: "14px" }}>
                            Para {accessEmployee?.firstName} {accessEmployee?.lastName}
                        </p>
                    </div>

                    <div style={{ padding: '32px' }}>
                        {tempCreds ? (
                            <div style={{ textAlign: "center" }}>
                                <div style={{ marginBottom: "24px" }}>
                                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
                                    <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#1e293b", marginBottom: "8px" }}>¡Cuenta Creada Exitosamente!</h3>
                                    <p style={{ color: "#64748b", fontSize: "14px" }}>Comparte estas credenciales con el empleado. Solo se muestran una vez.</p>
                                </div>

                                <div style={{ background: "#f1f5f9", padding: "20px", borderRadius: "16px", textAlign: "left", display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <div>
                                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Usuario / Email</div>
                                        <div style={{ fontSize: "16px", fontWeight: 700, color: "#334155" }}>{tempCreds.email}</div>
                                    </div>
                                    <div style={{ borderTop: "1px solid #e2e8f0" }} />
                                    <div>
                                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Contraseña Temporal</div>
                                        <div style={{ fontSize: "20px", fontFamily: "monospace", fontWeight: 700, color: "#0f172a", letterSpacing: "1px" }}>{tempCreds.pass}</div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => { setAccessModalOpen(false); fetchEmployees(); }}
                                    style={{
                                        marginTop: "32px",
                                        width: "100%",
                                        padding: "14px",
                                        borderRadius: "12px",
                                        background: "#0f172a",
                                        color: "white",
                                        fontWeight: 600,
                                        border: "none",
                                        cursor: "pointer"
                                    }}
                                >
                                    Entendido, cerrar
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Check size={24} color="#16a34a" />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#1e293b", margin: 0 }}>Acceso Activo</h3>
                                        <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>Vinculado a: {accessEmployee?.email}</p>
                                    </div>
                                </div>
                                <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "12px", padding: "16px", fontSize: "13px", color: "#92400e", marginBottom: "24px" }}>
                                    💡 Si el usuario olvidó su contraseña, indícale que use la opción "Olvidé mi contraseña" en la pantalla de login.
                                </div>

                                <button
                                    onClick={() => handleGrantAccess(accessEmployee, true)}
                                    style={{
                                        width: "100%",
                                        padding: "14px",
                                        borderRadius: "12px",
                                        background: "white",
                                        color: "#ef4444",
                                        fontWeight: 600,
                                        border: "2px solid #fee2e2",
                                        cursor: "pointer",
                                        marginBottom: "12px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "8px"
                                    }}
                                >
                                    <Key size={16} /> Restablecer y Mostrar Contraseña
                                </button>
                                <button
                                    onClick={() => setAccessModalOpen(false)}
                                    style={{
                                        width: "100%",
                                        padding: "14px",
                                        borderRadius: "12px",
                                        background: "#f1f5f9",
                                        color: "#475569",
                                        fontWeight: 600,
                                        border: "none",
                                        cursor: "pointer"
                                    }}
                                >
                                    Cerrar
                                </button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog >
        </div >
    );
}
