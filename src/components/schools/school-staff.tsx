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
        paymentModel: "FIXED", salary: "", commissionPercentage: ""
    });

    useEffect(() => {
        fetchEmployees();
    }, [selectedBranch]);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const url = selectedBranch?.id
                ? `/api/employees?branchId=${selectedBranch.id}`
                : `/api/employees?businessId=${selectedBranch?.businessId}`;
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
        try {
            const res = await fetch("/api/employees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...newEmployee,
                    branchId: selectedBranch?.id,
                    businessId: selectedBranch?.businessId,
                    salary: newEmployee.salary ? parseFloat(newEmployee.salary) : null,
                    commissionPercentage: newEmployee.commissionPercentage ? parseFloat(newEmployee.commissionPercentage) : null
                })
            });
            if (res.ok) {
                toast({ title: "Personal agregado exitosamente" });
                setOpen(false);
                setNewEmployee({ firstName: "", lastName: "", email: "", phone: "", role: "TEACHER", paymentModel: "FIXED", salary: "", commissionPercentage: "" });
                fetchEmployees();
            } else {
                const error = await res.json();
                toast({ title: "Error: " + error.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error al crear empleado", variant: "destructive" });
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
                                </div>
                            </div>
                            <DialogFooter style={{ gap: "12px" }}>
                                <button onClick={() => setOpen(false)} className="filter-chip">Cancelar</button>
                                <button onClick={handleCreate} disabled={!newEmployee.firstName || !newEmployee.lastName} className="button-modern gradient-green" style={{ opacity: (!newEmployee.firstName || !newEmployee.lastName) ? 0.5 : 1 }}>
                                    Guardar
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
                                        <button
                                            onClick={() => handleDelete(emp.id)}
                                            style={{
                                                width: "36px", height: "36px", borderRadius: "10px",
                                                backgroundColor: "white", border: "none",
                                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                                            }}
                                        >
                                            <Trash2 size={16} color="#ef4444" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
