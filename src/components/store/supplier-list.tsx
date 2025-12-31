"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Truck, Phone, Mail, Trash2, Package, MapPin, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useBranch } from "@/context/branch-context";
import { useToast } from "@/components/ui/use-toast";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";

export function SupplierList() {
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchValue, setSearchValue] = useState("");
    const [open, setOpen] = useState(false);
    const [newSupplier, setNewSupplier] = useState({
        name: "", contactName: "", phone: "", email: "", address: "", category: ""
    });

    useEffect(() => {
        fetchSuppliers();
    }, [selectedBranch]);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            await new Promise(r => setTimeout(r, 500));
            setSuppliers([
                { id: "1", name: "Distribuidora Central", contactName: "Carlos Ruiz", phone: "555-1111", email: "ventas@central.com", category: "Bebidas", totalOrders: 45, lastOrder: "2024-12-28" },
                { id: "2", name: "Abarrotes del Norte", contactName: "Laura Méndez", phone: "555-2222", email: "pedidos@norte.com", category: "Abarrotes", totalOrders: 32, lastOrder: "2024-12-25" },
                { id: "3", name: "Lácteos Premium", contactName: "Roberto Chávez", phone: "555-3333", email: "ventas@lacteos.com", category: "Lácteos", totalOrders: 28, lastOrder: "2024-12-30" },
            ]);
        } catch (error) {
            console.error("Error fetching suppliers:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newSupplier.name) return;
        try {
            const newId = Date.now().toString();
            setSuppliers(prev => [...prev, { ...newSupplier, id: newId, totalOrders: 0, lastOrder: null }]);
            toast({ title: "Proveedor agregado exitosamente" });
            setOpen(false);
            setNewSupplier({ name: "", contactName: "", phone: "", email: "", address: "", category: "" });
        } catch (error) {
            toast({ title: "Error al crear proveedor", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este proveedor?")) return;
        setSuppliers(prev => prev.filter(s => s.id !== id));
        toast({ title: "Proveedor eliminado" });
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        s.contactName?.toLowerCase().includes(searchValue.toLowerCase()) ||
        s.category?.toLowerCase().includes(searchValue.toLowerCase())
    );

    const totalSuppliers = suppliers.length;
    const totalOrders = suppliers.reduce((sum, s) => sum + (s.totalOrders || 0), 0);
    const categories = [...new Set(suppliers.map(s => s.category).filter(Boolean))].length;

    return (
        <div className="bg-slate-100 pb-16">
            {/* Header */}
            <div style={{ padding: "var(--spacing-lg)", marginBottom: "32px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">Proveedores</h1>
                        <p className="text-muted-foreground text-lg">Gestiona tus proveedores y órdenes de compra</p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <button className="button-modern gradient-purple" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Plus size={18} /> Nuevo Proveedor
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle style={{ fontSize: "1.5rem", fontWeight: 700 }}>Agregar Proveedor</DialogTitle>
                                <DialogDescription style={{ color: "#64748b" }}>Registra un nuevo proveedor</DialogDescription>
                            </DialogHeader>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px 0" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Nombre de la Empresa *</label>
                                    <input type="text" value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} className="modern-input" placeholder="Nombre del proveedor" />
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Contacto</label>
                                        <input type="text" value={newSupplier.contactName} onChange={(e) => setNewSupplier({ ...newSupplier, contactName: e.target.value })} className="modern-input" placeholder="Nombre del contacto" />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Categoría</label>
                                        <input type="text" value={newSupplier.category} onChange={(e) => setNewSupplier({ ...newSupplier, category: e.target.value })} className="modern-input" placeholder="Ej: Bebidas, Abarrotes" />
                                    </div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Teléfono</label>
                                        <input type="tel" value={newSupplier.phone} onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} className="modern-input" placeholder="555-1234" />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Email</label>
                                        <input type="email" value={newSupplier.email} onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} className="modern-input" placeholder="email@proveedor.com" />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Dirección</label>
                                    <input type="text" value={newSupplier.address} onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })} className="modern-input" placeholder="Dirección del proveedor" />
                                </div>
                            </div>
                            <DialogFooter style={{ gap: "12px" }}>
                                <button onClick={() => setOpen(false)} className="filter-chip">Cancelar</button>
                                <button onClick={handleCreate} disabled={!newSupplier.name} className="button-modern gradient-purple" style={{ opacity: !newSupplier.name ? 0.5 : 1 }}>Guardar</button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* KPIs */}
            <motion.div style={{ padding: "0 var(--spacing-lg)", marginBottom: "32px" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <ModernKpiCard title="Total Proveedores" value={totalSuppliers.toString()} icon={Truck} gradientClass="gradient-purple" subtitle="Registrados" />
                    <ModernKpiCard title="Órdenes Realizadas" value={totalOrders.toString()} icon={Package} gradientClass="gradient-blue" subtitle="Históricas" />
                    <ModernKpiCard title="Categorías" value={categories.toString()} icon={Truck} gradientClass="gradient-green" subtitle="Diferentes" />
                </div>
            </motion.div>

            {/* Search */}
            <div style={{ padding: "0 var(--spacing-lg)", marginBottom: "24px" }}>
                <div style={{ position: "relative", maxWidth: "400px" }}>
                    <Search style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} size={20} />
                    <input type="text" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="Buscar proveedores..." className="modern-input" style={{ paddingLeft: "48px" }} />
                </div>
            </div>

            {/* List */}
            <section style={{ padding: "0 var(--spacing-lg)" }} className="pb-8">
                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="animate-spin w-12 h-12 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-slate-500">Cargando proveedores...</p>
                    </div>
                ) : filteredSuppliers.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">🚚</div>
                        <p className="text-slate-500 text-lg">No hay proveedores registrados</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "20px" }}>
                        {filteredSuppliers.map((supplier, index) => {
                            const colors = [
                                { bg: "#EDE9FE", accent: "#7C3AED" },
                                { bg: "#DBEAFE", accent: "#2563EB" },
                                { bg: "#D1FAE5", accent: "#059669" },
                                { bg: "#FEE2E2", accent: "#DC2626" },
                            ][index % 4];

                            return (
                                <motion.div key={supplier.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ backgroundColor: colors.bg, borderRadius: "16px", padding: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                            <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: colors.accent, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <Truck size={24} />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#1e293b" }}>{supplier.name}</h3>
                                                {supplier.category && <span style={{ fontSize: "12px", padding: "4px 10px", backgroundColor: "rgba(255,255,255,0.8)", borderRadius: "8px", color: colors.accent, fontWeight: 600 }}>{supplier.category}</span>}
                                            </div>
                                        </div>
                                        <button onClick={() => handleDelete(supplier.id)} style={{ padding: "8px", borderRadius: "8px", border: "none", backgroundColor: "white", color: "#ef4444", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>
                                        {supplier.contactName && <div style={{ marginBottom: "4px" }}>👤 {supplier.contactName}</div>}
                                        {supplier.phone && <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}><Phone size={14} /> {supplier.phone}</div>}
                                        {supplier.email && <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><Mail size={14} /> {supplier.email}</div>}
                                    </div>
                                    <div style={{ paddingTop: "16px", borderTop: "2px solid rgba(255,255,255,0.5)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div>
                                            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a" }}>{supplier.totalOrders} órdenes</div>
                                            <div style={{ fontSize: "11px", color: colors.accent, fontWeight: 600 }}>Última: {supplier.lastOrder || "—"}</div>
                                        </div>
                                        <button className="button-modern-sm gradient-purple" style={{ fontSize: "13px", padding: "8px 16px" }}>+ Nueva Orden</button>
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
