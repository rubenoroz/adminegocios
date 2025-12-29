"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useBranch } from "@/context/branch-context";
import { DollarSign, Wallet, Receipt, CreditCard, TrendingUp, AlertCircle } from "lucide-react";
import { FeeTemplatesManager } from "@/components/finance/fee-templates-manager";
import { FeesList } from "@/components/finance/fees-list";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";

export default function FinancePage() {
    const { selectedBranch } = useBranch();
    const [activeTab, setActiveTab] = useState<"fees" | "templates">("fees");
    const [stats, setStats] = useState({
        collected: 0,
        pending: 0,
        overdue: 0,
        total: 0
    });

    useEffect(() => {
        if (selectedBranch?.businessId) {
            fetchStats();
        }
    }, [selectedBranch?.businessId]);

    const fetchStats = async () => {
        try {
            const res = await fetch(`/api/finance/stats?businessId=${selectedBranch?.businessId}`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Error fetching finance stats:", error);
        }
    };

    return (
        <div className="bg-slate-100 pb-16 min-h-screen">
            {/* HEADER */}
            <div style={{
                padding: 'var(--spacing-lg)',
                marginBottom: '64px',
                position: 'relative',
                zIndex: 10
            }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
                            Finanzas
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            {selectedBranch ? `Sucursal: ${selectedBranch.name}` : "Gestión de colegiaturas, cobros y conceptos de pago"}
                        </p>
                    </div>
                </div>
            </div>

            {/* KPIS */}
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
                        title="Cobrado este Mes"
                        value={`$${stats.collected.toLocaleString()}`}
                        icon={DollarSign}
                        gradientClass="gradient-finance"
                        subtitle="Ingresos registrados"
                        positive={true}
                    />
                    <ModernKpiCard
                        title="Por Cobrar"
                        value={`$${stats.pending.toLocaleString()}`}
                        icon={Wallet}
                        gradientClass="gradient-courses"
                        subtitle="Saldos pendientes"
                    />
                    <ModernKpiCard
                        title="Total Vencido"
                        value={`$${stats.overdue.toLocaleString()}`}
                        icon={AlertCircle}
                        gradientClass="gradient-employees"
                        subtitle="Pagos con fecha excedida"
                    />
                    <ModernKpiCard
                        title="Total Registrado"
                        value={`$${stats.total.toLocaleString()}`}
                        icon={TrendingUp}
                        gradientClass="gradient-students"
                        subtitle="Monto total histórico"
                    />
                </div>
            </motion.div>

            {/* TAB BUTTONS */}
            <div style={{ padding: '0 var(--spacing-lg)', marginBottom: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '12px' }}>
                    <button
                        onClick={() => setActiveTab("fees")}
                        className={`button-modern flex items-center gap-2 ${activeTab === "fees"
                            ? "bg-gradient-to-r from-emerald-600 to-emerald-500"
                            : "bg-gradient-to-r from-blue-600 to-blue-500"
                            }`}
                        style={{ borderRadius: '8px' }}
                    >
                        <Receipt className="w-4 h-4" />
                        Cuentas por Cobrar
                    </button>
                    <button
                        onClick={() => setActiveTab("templates")}
                        className={`button-modern flex items-center gap-2 ${activeTab === "templates"
                            ? "bg-gradient-to-r from-emerald-600 to-emerald-500"
                            : "bg-gradient-to-r from-blue-600 to-blue-500"
                            }`}
                        style={{ borderRadius: '8px' }}
                    >
                        <CreditCard className="w-4 h-4" />
                        Conceptos de Pago
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            <section style={{ padding: '0 var(--spacing-lg)', minHeight: '400px' }}>
                {activeTab === "fees" && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                        <FeesList />
                    </div>
                )}
                {activeTab === "templates" && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                        <FeeTemplatesManager />
                    </div>
                )}
            </section>
        </div>
    );
}
