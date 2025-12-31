"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { History, DollarSign, ShoppingCart, TrendingUp, Search, Eye, Calendar, CreditCard, Banknote } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useBranch } from "@/context/branch-context";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";

export function SalesHistory() {
    const { selectedBranch } = useBranch();
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchValue, setSearchValue] = useState("");
    const [dateFilter, setDateFilter] = useState("today");
    const [selectedSale, setSelectedSale] = useState<any>(null);

    useEffect(() => {
        fetchSales();
    }, [selectedBranch, dateFilter]);

    const fetchSales = async () => {
        setLoading(true);
        try {
            await new Promise(r => setTimeout(r, 500));
            setSales([
                { id: "V001", date: "2024-12-31 10:30", customer: "María García", items: 5, total: 450, paymentMethod: "card", employee: "Juan Pérez" },
                { id: "V002", date: "2024-12-31 11:15", customer: "Cliente General", items: 2, total: 180, paymentMethod: "cash", employee: "Juan Pérez" },
                { id: "V003", date: "2024-12-31 12:00", customer: "Carlos López", items: 8, total: 920, paymentMethod: "card", employee: "Ana Ruiz" },
                { id: "V004", date: "2024-12-31 13:45", customer: "Cliente General", items: 1, total: 75, paymentMethod: "cash", employee: "Ana Ruiz" },
                { id: "V005", date: "2024-12-31 14:20", customer: "Roberto Chávez", items: 3, total: 340, paymentMethod: "card", employee: "Juan Pérez" },
            ]);
        } catch (error) {
            console.error("Error fetching sales:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSales = sales.filter(s =>
        s.id.toLowerCase().includes(searchValue.toLowerCase()) ||
        s.customer.toLowerCase().includes(searchValue.toLowerCase()) ||
        s.employee.toLowerCase().includes(searchValue.toLowerCase())
    );

    const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
    const totalTransactions = sales.length;
    const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    const totalItems = sales.reduce((sum, s) => sum + s.items, 0);

    const dateFilters = [
        { id: "today", label: "Hoy" },
        { id: "week", label: "Esta Semana" },
        { id: "month", label: "Este Mes" },
        { id: "all", label: "Todo" },
    ];

    return (
        <div className="bg-slate-100 pb-16">
            {/* Header */}
            <div style={{ padding: "var(--spacing-lg)", marginBottom: "32px" }}>
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">Historial de Ventas</h1>
                    <p className="text-muted-foreground text-lg">Revisa todas las transacciones realizadas</p>
                </div>
            </div>

            {/* KPIs */}
            <motion.div style={{ padding: "0 var(--spacing-lg)", marginBottom: "32px" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <ModernKpiCard title="Ventas Totales" value={`$${totalSales.toLocaleString()}`} icon={DollarSign} gradientClass="gradient-green" subtitle="Del período" />
                    <ModernKpiCard title="Transacciones" value={totalTransactions.toString()} icon={ShoppingCart} gradientClass="gradient-blue" subtitle="Número de ventas" />
                    <ModernKpiCard title="Ticket Promedio" value={`$${avgTicket.toFixed(0)}`} icon={TrendingUp} gradientClass="gradient-purple" subtitle="Por venta" />
                    <ModernKpiCard title="Productos Vendidos" value={totalItems.toString()} icon={History} gradientClass="gradient-orange" subtitle="Total items" />
                </div>
            </motion.div>

            {/* Filters */}
            <div style={{ padding: "0 var(--spacing-lg)", marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                    <div style={{ position: "relative", minWidth: "300px" }}>
                        <Search style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} size={20} />
                        <input type="text" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="Buscar por ID, cliente, empleado..." className="modern-input" style={{ paddingLeft: "48px", width: "100%" }} />
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        {dateFilters.map(f => (
                            <button
                                key={f.id}
                                onClick={() => setDateFilter(f.id)}
                                className={dateFilter === f.id ? "button-modern-sm gradient-blue" : "filter-chip"}
                                style={{ display: "flex", alignItems: "center", gap: "6px" }}
                            >
                                <Calendar size={14} />
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sales Table */}
            <section style={{ padding: "0 var(--spacing-lg)" }} className="pb-8">
                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="animate-spin w-12 h-12 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-slate-500">Cargando ventas...</p>
                    </div>
                ) : filteredSales.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">🧾</div>
                        <p className="text-slate-500 text-lg">No hay ventas en este período</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                                    <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 600, color: "#475569" }}>ID</th>
                                    <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 600, color: "#475569" }}>Fecha/Hora</th>
                                    <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 600, color: "#475569" }}>Cliente</th>
                                    <th style={{ padding: "16px 20px", textAlign: "center", fontWeight: 600, color: "#475569" }}>Items</th>
                                    <th style={{ padding: "16px 20px", textAlign: "center", fontWeight: 600, color: "#475569" }}>Pago</th>
                                    <th style={{ padding: "16px 20px", textAlign: "right", fontWeight: 600, color: "#475569" }}>Total</th>
                                    <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 600, color: "#475569" }}>Cajero</th>
                                    <th style={{ padding: "16px 20px", textAlign: "center", fontWeight: 600, color: "#475569" }}>Ver</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSales.map((sale, index) => (
                                    <tr key={sale.id} style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: index % 2 === 0 ? "#fff" : "#f8fafc" }}>
                                        <td style={{ padding: "16px 20px", fontWeight: 600, color: "#3B82F6" }}>{sale.id}</td>
                                        <td style={{ padding: "16px 20px", color: "#64748b", fontSize: "14px" }}>{sale.date}</td>
                                        <td style={{ padding: "16px 20px", fontWeight: 500, color: "#1e293b" }}>{sale.customer}</td>
                                        <td style={{ padding: "16px 20px", textAlign: "center" }}>
                                            <span style={{ backgroundColor: "#E0F2FE", color: "#0369A1", padding: "4px 12px", borderRadius: "12px", fontSize: "13px", fontWeight: 600 }}>{sale.items}</span>
                                        </td>
                                        <td style={{ padding: "16px 20px", textAlign: "center" }}>
                                            {sale.paymentMethod === "card" ? (
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", backgroundColor: "#EDE9FE", color: "#7C3AED", padding: "4px 10px", borderRadius: "8px", fontSize: "12px" }}><CreditCard size={14} /> Tarjeta</span>
                                            ) : (
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", backgroundColor: "#D1FAE5", color: "#059669", padding: "4px 10px", borderRadius: "8px", fontSize: "12px" }}><Banknote size={14} /> Efectivo</span>
                                            )}
                                        </td>
                                        <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: 700, color: "#059669", fontSize: "16px" }}>${sale.total.toLocaleString()}</td>
                                        <td style={{ padding: "16px 20px", color: "#64748b", fontSize: "14px" }}>{sale.employee}</td>
                                        <td style={{ padding: "16px 20px", textAlign: "center" }}>
                                            <button onClick={() => setSelectedSale(sale)} style={{ padding: "8px", borderRadius: "8px", border: "none", backgroundColor: "#E0F2FE", color: "#0369A1", cursor: "pointer" }}>
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Sale Detail Modal */}
            <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detalle de Venta {selectedSale?.id}</DialogTitle>
                        <DialogDescription>Información completa de la transacción</DialogDescription>
                    </DialogHeader>
                    {selectedSale && (
                        <div style={{ padding: "16px 0" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                                <div><strong>Fecha:</strong> {selectedSale.date}</div>
                                <div><strong>Cliente:</strong> {selectedSale.customer}</div>
                                <div><strong>Cajero:</strong> {selectedSale.employee}</div>
                                <div><strong>Método:</strong> {selectedSale.paymentMethod === "card" ? "Tarjeta" : "Efectivo"}</div>
                            </div>
                            <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
                                <div style={{ fontSize: "14px", color: "#64748b" }}>Total de la venta</div>
                                <div style={{ fontSize: "32px", fontWeight: "bold", color: "#059669" }}>${selectedSale.total.toLocaleString()}</div>
                                <div style={{ fontSize: "14px", color: "#64748b" }}>{selectedSale.items} productos</div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
