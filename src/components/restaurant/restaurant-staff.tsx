"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Users, ChefHat, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useBranch } from "@/context/branch-context";
import { useToast } from "@/components/ui/use-toast";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";
import { ModernFilterBar } from "@/components/ui/modern-filter-bar";

// Roles específicos para restaurante
const RESTAURANT_ROLES = ["WAITER", "CHEF", "BARTENDER", "MANAGER", "CASHIER", "HOST"];

const roleLabels: Record<string, string> = {
    "WAITER": "Mesero",
    "CHEF": "Chef",
    "BARTENDER": "Bartender",
    "MANAGER": "Gerente",
    "CASHIER": "Cajero",
    "HOST": "Host",
};

const roleIcons: Record<string, string> = {
    "WAITER": "🍽️",
    "CHEF": "👨‍🍳",
    "BARTENDER": "🍸",
    "MANAGER": "👔",
    "CASHIER": "💵",
    "HOST": "🚪",
};

export function RestaurantStaff() {
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchValue, setSearchValue] = useState("");
    const [filterRole, setFilterRole] = useState<string[]>([]);
    const [open, setOpen] = useState(false);
    const [newEmployee, setNewEmployee] = useState({
        firstName: "", lastName: "", email: "", phone: "", role: "WAITER",
        paymentModel: "FIXED", salary: "", hourlyRate: ""
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
                setEmployees(data.filter((e: any) => RESTAURANT_ROLES.includes(e.role)));
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
                    hourlyRate: newEmployee.hourlyRate ? parseFloat(newEmployee.hourlyRate) : null
                })
            });
            if (res.ok) {
                toast({ title: "Staff agregado exitosamente" });
                setOpen(false);
                setNewEmployee({ firstName: "", lastName: "", email: "", phone: "", role: "WAITER", paymentModel: "FIXED", salary: "", hourlyRate: "" });
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

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = searchValue === "" ||
            `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchValue.toLowerCase());
        const matchesFilter = filterRole.length === 0 || filterRole.includes(emp.role);
        return matchesSearch && matchesFilter;
    });

    // Stats
    const totalStaff = employees.length;
    const waiters = employees.filter(e => e.role === "WAITER").length;
    const chefs = employees.filter(e => e.role === "CHEF" || e.role === "BARTENDER").length;
    const managers = employees.filter(e => e.role === "MANAGER" || e.role === "CASHIER").length;

    return (
        <div className="bg-slate-100 pb-16">
            {/* Header */}
            <div style={{ padding: "var(--spacing-lg)", marginBottom: "32px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">Staff del Restaurante</h1>
                        <p className="text-muted-foreground text-lg">
                            {selectedBranch ? `Sucursal: ${selectedBranch.name}` : "Gestiona meseros, chefs y personal"}
                        </p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <button className="button-modern gradient-orange" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Plus size={18} /> Nuevo Staff
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle style={{ fontSize: "1.5rem", fontWeight: 700 }}>Agregar Staff</DialogTitle>
                                <DialogDescription style={{ color: "#64748b" }}>Completa los datos del nuevo miembro</DialogDescription>
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
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>Teléfono</label>
                                        <input type="tel" value={newEmployee.phone} onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })} className="modern-input" placeholder="+52 555 123" />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>Puesto *</label>
                                        <select value={newEmployee.role} onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })} className="modern-input">
                                            <option value="WAITER">Mesero</option>
                                            <option value="CHEF">Chef</option>
                                            <option value="BARTENDER">Bartender</option>
                                            <option value="HOST">Host</option>
                                            <option value="CASHIER">Cajero</option>
                                            <option value="MANAGER">Gerente</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>Tipo de Pago</label>
                                        <select value={newEmployee.paymentModel} onChange={(e) => setNewEmployee({ ...newEmployee, paymentModel: e.target.value })} className="modern-input">
                                            <option value="FIXED">Salario Fijo</option>
                                            <option value="HOURLY">Por Hora</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>
                                            {newEmployee.paymentModel === "HOURLY" ? "$/Hora" : "Salario"}
                                        </label>
                                        <input
                                            type="number"
                                            value={newEmployee.paymentModel === "HOURLY" ? newEmployee.hourlyRate : newEmployee.salary}
                                            onChange={(e) => setNewEmployee({
                                                ...newEmployee,
                                                [newEmployee.paymentModel === "HOURLY" ? "hourlyRate" : "salary"]: e.target.value
                                            })}
                                            className="modern-input"
                                            placeholder={newEmployee.paymentModel === "HOURLY" ? "120" : "8000"}
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter style={{ gap: "12px" }}>
                                <button onClick={() => setOpen(false)} className="filter-chip">Cancelar</button>
                                <button onClick={handleCreate} disabled={!newEmployee.firstName || !newEmployee.lastName} className="button-modern gradient-orange" style={{ opacity: (!newEmployee.firstName || !newEmployee.lastName) ? 0.5 : 1 }}>
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
                    <ModernKpiCard title="Total Staff" value={totalStaff.toString()} icon={Users} gradientClass="gradient-orange" subtitle="En el restaurante" />
                    <ModernKpiCard title="Meseros" value={waiters.toString()} icon={Users} gradientClass="gradient-courses" subtitle="Servicio en sala" />
                    <ModernKpiCard title="Cocina" value={chefs.toString()} icon={ChefHat} gradientClass="gradient-employees" subtitle="Chefs y bartenders" />
                    <ModernKpiCard title="Gerencia" value={managers.toString()} icon={Users} gradientClass="gradient-finance" subtitle="Managers y cajeros" />
                </div>
            </motion.div>

            {/* Filtros */}
            <div style={{ padding: "0 var(--spacing-lg)", marginBottom: "24px" }}>
                <ModernFilterBar
                    searchValue={searchValue}
                    onSearchChange={setSearchValue}
                    placeholder="Buscar staff..."
                    filters={[
                        { label: "Meseros", value: "WAITER", color: "blue" },
                        { label: "Chefs", value: "CHEF", color: "orange" },
                        { label: "Bartenders", value: "BARTENDER", color: "purple" },
                        { label: "Gerentes", value: "MANAGER", color: "green" }
                    ]}
                    activeFilters={filterRole}
                    onFilterToggle={(value) => setFilterRole(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value])}
                />
            </div>

            {/* Lista */}
            <section style={{ padding: "0 var(--spacing-lg)" }} className="pb-8">
                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="animate-spin w-12 h-12 border-2 border-orange-600 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-slate-500">Cargando staff...</p>
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">👨‍🍳</div>
                        <p className="text-slate-500 text-lg">No hay staff registrado</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                        {filteredEmployees.map((emp, index) => {
                            const colors = [
                                { bg: "#FEE2E2", accent: "#DC2626" },
                                { bg: "#FFEDD5", accent: "#EA580C" },
                                { bg: "#FEF9C3", accent: "#CA8A04" },
                                { bg: "#DCFCE7", accent: "#16A34A" }
                            ][index % 4];

                            return (
                                <motion.div
                                    key={emp.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        backgroundColor: colors.bg,
                                        borderRadius: "14px",
                                        padding: "20px",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px" }}>
                                        <div style={{
                                            width: "48px", height: "48px", borderRadius: "12px",
                                            backgroundColor: colors.accent, color: "white",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "20px"
                                        }}>
                                            {roleIcons[emp.role] || "👤"}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#1e293b" }}>{emp.firstName} {emp.lastName}</h3>
                                            <span style={{ fontSize: "12px", color: colors.accent, fontWeight: 600 }}>
                                                {roleLabels[emp.role] || emp.role}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(emp.id)}
                                            style={{
                                                width: "32px", height: "32px", borderRadius: "8px",
                                                backgroundColor: "white", border: "none",
                                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                                            }}
                                        >
                                            <Trash2 size={14} color="#ef4444" />
                                        </button>
                                    </div>
                                    {emp.phone && <div style={{ fontSize: "13px", color: "#64748b" }}>📱 {emp.phone}</div>}
                                    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.6)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>
                                            {emp.paymentModel === "HOURLY" ? `$${emp.hourlyRate || 0}/hr` : `$${parseFloat(emp.salary || 0).toLocaleString()}`}
                                        </span>
                                        <span style={{ fontSize: "10px", color: colors.accent, fontWeight: 600, textTransform: "uppercase" }}>
                                            {emp.paymentModel === "HOURLY" ? "Por hora" : "Salario"}
                                        </span>
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
