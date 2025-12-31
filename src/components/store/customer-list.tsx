"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Users, ShoppingBag, Phone, Mail, Trash2, Edit, Search, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useBranch } from "@/context/branch-context";
import { useToast } from "@/components/ui/use-toast";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";

export function CustomerList() {
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchValue, setSearchValue] = useState("");
    const [open, setOpen] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        name: "", phone: "", email: "", notes: ""
    });

    useEffect(() => {
        fetchCustomers();
    }, [selectedBranch]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            // Simulación - reemplazar con API real
            await new Promise(r => setTimeout(r, 500));
            setCustomers([
                { id: "1", name: "María García", phone: "555-1234", email: "maria@email.com", totalPurchases: 12500, lastPurchase: "2024-12-28" },
                { id: "2", name: "Juan Pérez", phone: "555-5678", email: "juan@email.com", totalPurchases: 8200, lastPurchase: "2024-12-30" },
                { id: "3", name: "Ana López", phone: "555-9012", email: "ana@email.com", totalPurchases: 25000, lastPurchase: "2024-12-15" },
            ]);
        } catch (error) {
            console.error("Error fetching customers:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newCustomer.name) return;
        try {
            // Simulación
            const newId = Date.now().toString();
            setCustomers(prev => [...prev, { ...newCustomer, id: newId, totalPurchases: 0, lastPurchase: null }]);
            toast({ title: "Cliente agregado exitosamente" });
            setOpen(false);
            setNewCustomer({ name: "", phone: "", email: "", notes: "" });
        } catch (error) {
            toast({ title: "Error al crear cliente", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este cliente?")) return;
        setCustomers(prev => prev.filter(c => c.id !== id));
        toast({ title: "Cliente eliminado" });
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        c.phone?.includes(searchValue) ||
        c.email?.toLowerCase().includes(searchValue.toLowerCase())
    );

    // Stats
    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.totalPurchases || 0), 0);
    const avgTicket = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    const activeCustomers = customers.filter(c => c.lastPurchase && new Date(c.lastPurchase) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;

    return (
        <div className="bg-slate-100 pb-16">
            {/* Header */}
            <div style={{ padding: "var(--spacing-lg)", marginBottom: "32px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">Clientes</h1>
                        <p className="text-muted-foreground text-lg">Gestiona tu base de clientes</p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <button className="button-modern gradient-blue" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Plus size={18} /> Nuevo Cliente
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle style={{ fontSize: "1.5rem", fontWeight: 700 }}>Agregar Cliente</DialogTitle>
                                <DialogDescription style={{ color: "#64748b" }}>Registra un nuevo cliente</DialogDescription>
                            </DialogHeader>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px 0" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Nombre *</label>
                                    <input type="text" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} className="modern-input" placeholder="Nombre del cliente" />
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Teléfono</label>
                                        <input type="tel" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} className="modern-input" placeholder="555-1234" />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Email</label>
                                        <input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} className="modern-input" placeholder="email@ejemplo.com" />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Notas</label>
                                    <textarea value={newCustomer.notes} onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })} className="modern-input" rows={2} placeholder="Notas adicionales..." />
                                </div>
                            </div>
                            <DialogFooter style={{ gap: "12px" }}>
                                <button onClick={() => setOpen(false)} className="filter-chip">Cancelar</button>
                                <button onClick={handleCreate} disabled={!newCustomer.name} className="button-modern gradient-blue" style={{ opacity: !newCustomer.name ? 0.5 : 1 }}>Guardar</button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* KPIs */}
            <motion.div style={{ padding: "0 var(--spacing-lg)", marginBottom: "32px" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <ModernKpiCard title="Total Clientes" value={totalCustomers.toString()} icon={Users} gradientClass="gradient-blue" subtitle="Registrados" />
                    <ModernKpiCard title="Ingresos Totales" value={`$${totalRevenue.toLocaleString()}`} icon={ShoppingBag} gradientClass="gradient-green" subtitle="De todos los clientes" />
                    <ModernKpiCard title="Ticket Promedio" value={`$${avgTicket.toFixed(0)}`} icon={Star} gradientClass="gradient-purple" subtitle="Por cliente" />
                    <ModernKpiCard title="Activos (30 días)" value={activeCustomers.toString()} icon={Users} gradientClass="gradient-orange" subtitle="Con compras recientes" />
                </div>
            </motion.div>

            {/* Search */}
            <div style={{ padding: "0 var(--spacing-lg)", marginBottom: "24px" }}>
                <div style={{ position: "relative", maxWidth: "400px" }}>
                    <Search style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} size={20} />
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        placeholder="Buscar clientes..."
                        className="modern-input"
                        style={{ paddingLeft: "48px" }}
                    />
                </div>
            </div>

            {/* List */}
            <section style={{ padding: "0 var(--spacing-lg)" }} className="pb-8">
                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="animate-spin w-12 h-12 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-slate-500">Cargando clientes...</p>
                    </div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">👥</div>
                        <p className="text-slate-500 text-lg">No hay clientes registrados</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                                    <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 600, color: "#475569" }}>Cliente</th>
                                    <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 600, color: "#475569" }}>Contacto</th>
                                    <th style={{ padding: "16px 20px", textAlign: "right", fontWeight: 600, color: "#475569" }}>Total Compras</th>
                                    <th style={{ padding: "16px 20px", textAlign: "center", fontWeight: 600, color: "#475569" }}>Última Compra</th>
                                    <th style={{ padding: "16px 20px", textAlign: "center", fontWeight: 600, color: "#475569" }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map((customer, index) => (
                                    <tr key={customer.id} style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: index % 2 === 0 ? "#fff" : "#f8fafc" }}>
                                        <td style={{ padding: "16px 20px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#3B82F6", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                                                    {customer.name.charAt(0)}
                                                </div>
                                                <span style={{ fontWeight: 600, color: "#1e293b" }}>{customer.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: "16px 20px" }}>
                                            <div style={{ fontSize: "14px", color: "#64748b" }}>
                                                {customer.phone && <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><Phone size={14} /> {customer.phone}</div>}
                                                {customer.email && <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><Mail size={14} /> {customer.email}</div>}
                                            </div>
                                        </td>
                                        <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: 700, color: "#059669", fontSize: "16px" }}>
                                            ${customer.totalPurchases?.toLocaleString() || 0}
                                        </td>
                                        <td style={{ padding: "16px 20px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
                                            {customer.lastPurchase || "—"}
                                        </td>
                                        <td style={{ padding: "16px 20px", textAlign: "center" }}>
                                            <button onClick={() => handleDelete(customer.id)} style={{ padding: "8px", borderRadius: "8px", border: "none", backgroundColor: "#FEE2E2", color: "#DC2626", cursor: "pointer" }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
