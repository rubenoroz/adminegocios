"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
    FileText, Users, BarChart3, DollarSign, TrendingUp,
    GraduationCap, ShoppingCart, Utensils, Briefcase,
    Calendar, Download, ChevronDown, Check
} from "lucide-react";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";
import { useBranch } from "@/context/branch-context";

// School report components
import { StudentMatrixReport } from "@/components/reports/student-matrix-report";
import { PayrollReport } from "@/components/reports/payroll-report";
import { ClassStatsReport } from "@/components/reports/class-stats-report";

// Retail report components
import { SalesReport } from "@/components/reports/sales-report";
import { InventoryReport } from "@/components/reports/inventory-report";

// Restaurant report components
import { OrdersReport } from "@/components/reports/orders-report";
import { MenuPerformanceReport } from "@/components/reports/menu-performance-report";

// Service report component
import { ServiceReports } from "@/components/services/service-reports";

interface ReportSummary {
    period: string;
    enabledModules: string[];
    school: {
        students: number;
        teachers: number;
        revenue: number;
        commissions: number;
        netRevenue: number;
    } | null;
    retail: {
        salesCount: number;
        totalSales: number;
        avgTicket: number;
        products: number;
    } | null;
    restaurant: {
        ordersCount: number;
        completedOrders: number;
        totalRevenue: number;
        avgTicket: number;
        tables: number;
    } | null;
    services: {
        totalAppointments: number;
        completed: number;
        cancelled: number;
        completionRate: number;
        totalRevenue: number;
    } | null;
}

type TabConfig = {
    id: string;
    label: string;
    icon: any;
    color: string;
    module: string;
};

const ALL_MODULES = [
    { id: "SCHOOL", label: "Escuela", icon: GraduationCap, color: "#3B82F6" },
    { id: "RETAIL", label: "Tienda", icon: ShoppingCart, color: "#F97316" },
    { id: "RESTAURANT", label: "Restaurante", icon: Utensils, color: "#EF4444" },
    { id: "SERVICE", label: "Servicios", icon: Briefcase, color: "#8B5CF6" },
];

export default function ReportsPage() {
    const { data: session } = useSession();
    const { selectedBranch } = useBranch();
    const [summary, setSummary] = useState<ReportSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<"week" | "month" | "year">("month");
    const [activeTab, setActiveTab] = useState<string>("");
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const [showModuleSelector, setShowModuleSelector] = useState(false);

    const isSuperAdmin = session?.user?.role === "SUPERADMIN";

    // All possible tabs by module
    const allTabs: TabConfig[] = [
        // School tabs
        { id: "school-students", label: "Alumnos", icon: GraduationCap, color: "blue", module: "SCHOOL" },
        { id: "school-stats", label: "Estadísticas", icon: BarChart3, color: "purple", module: "SCHOOL" },
        { id: "school-payroll", label: "Nómina", icon: DollarSign, color: "emerald", module: "SCHOOL" },
        // Retail tabs
        { id: "retail-sales", label: "Ventas", icon: ShoppingCart, color: "orange", module: "RETAIL" },
        { id: "retail-inventory", label: "Inventario", icon: FileText, color: "cyan", module: "RETAIL" },
        // Restaurant tabs
        { id: "restaurant-orders", label: "Órdenes", icon: Utensils, color: "red", module: "RESTAURANT" },
        { id: "restaurant-menu", label: "Menú", icon: BarChart3, color: "amber", module: "RESTAURANT" },
        // Services tabs
        { id: "services-appointments", label: "Citas", icon: Briefcase, color: "indigo", module: "SERVICE" },
    ];

    useEffect(() => {
        fetchSummary();
    }, [period, selectedBranch?.id, selectedModule]);

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const branchParam = selectedBranch?.id ? `&branchId=${selectedBranch.id}` : "";
            const modulesParam = selectedModule ? `&modules=${selectedModule}` : "";
            const res = await fetch(`/api/reports/summary?period=${period}${branchParam}${modulesParam}`);
            if (res.ok) {
                const data = await res.json();
                setSummary(data);

                // Set initial tab based on enabled modules
                if (data.enabledModules) {
                    const availableTabs = allTabs.filter(t => data.enabledModules.includes(t.module));
                    if (availableTabs.length > 0 && !activeTab) {
                        setActiveTab(availableTabs[0].id);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching report summary:", error);
        } finally {
            setLoading(false);
        }
    };

    const selectModule = (moduleId: string) => {
        setSelectedModule(selectedModule === moduleId ? null : moduleId);
        setShowModuleSelector(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (showModuleSelector && !target.closest('[data-module-selector]')) {
                setShowModuleSelector(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showModuleSelector]);

    // Filter tabs based on enabled modules
    const availableTabs = summary?.enabledModules
        ? allTabs.filter(t => summary.enabledModules.includes(t.module))
        : [];

    const colorMap: Record<string, { activeBg: string; inactiveBg: string }> = {
        blue: { activeBg: '#2563EB', inactiveBg: '#EFF6FF' },
        purple: { activeBg: '#7C3AED', inactiveBg: '#F5F3FF' },
        emerald: { activeBg: '#059669', inactiveBg: '#ECFDF5' },
        orange: { activeBg: '#EA580C', inactiveBg: '#FFF7ED' },
        cyan: { activeBg: '#0891B2', inactiveBg: '#ECFEFF' },
        red: { activeBg: '#DC2626', inactiveBg: '#FEF2F2' },
        amber: { activeBg: '#D97706', inactiveBg: '#FFFBEB' },
        indigo: { activeBg: '#4F46E5', inactiveBg: '#EEF2FF' },
    };

    const periodLabels = {
        week: "Esta Semana",
        month: "Este Mes",
        year: "Este Año"
    };

    return (
        <div className="bg-slate-100 pb-16 min-h-screen">
            {/* HEADER */}
            <div style={{
                padding: 'var(--spacing-lg)',
                marginBottom: '24px',
                position: 'relative',
                zIndex: 10
            }}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
                            Centro de Reportes
                        </h1>
                        <p className="text-slate-500 text-lg">
                            {selectedBranch ? `Sucursal: ${selectedBranch.name}` : "Análisis y estadísticas de tu negocio"}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Module Selector for SuperAdmin */}
                        {isSuperAdmin && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowModuleSelector(!showModuleSelector)}
                                    style={{
                                        background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                                        padding: '12px 20px',
                                        borderRadius: 'var(--radius-xl)',
                                        border: 'none',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(124, 58, 237, 0.45)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(124, 58, 237, 0.35)';
                                    }}
                                >
                                    <BarChart3 size={18} />
                                    Módulos {selectedModule && `(${ALL_MODULES.find(m => m.id === selectedModule)?.label})`}
                                    <ChevronDown size={16} className={`transition-transform ${showModuleSelector ? 'rotate-180' : ''}`} />
                                </button>

                                {showModuleSelector && (
                                    <div
                                        data-module-selector="true"
                                        style={{
                                            position: 'absolute',
                                            left: 0,
                                            marginTop: '8px',
                                            background: 'white',
                                            borderRadius: 'var(--radius-xl)',
                                            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                                            padding: '12px',
                                            minWidth: '240px',
                                            zIndex: 100,
                                            animation: 'fadeIn 0.15s ease-out'
                                        }}
                                    >
                                        <div style={{
                                            fontSize: '11px',
                                            textTransform: 'uppercase',
                                            color: '#94a3b8',
                                            fontWeight: 700,
                                            letterSpacing: '0.5px',
                                            padding: '8px 12px',
                                            marginBottom: '4px'
                                        }}>
                                            Seleccionar Módulo
                                        </div>
                                        {ALL_MODULES.map((mod) => {
                                            const Icon = mod.icon;
                                            const isSelected = selectedModule === mod.id;
                                            return (
                                                <button
                                                    key={mod.id}
                                                    onClick={() => selectModule(mod.id)}
                                                    style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        padding: '12px 14px',
                                                        borderRadius: 'var(--radius-lg)',
                                                        border: 'none',
                                                        background: isSelected ? `linear-gradient(135deg, ${mod.color}15 0%, ${mod.color}08 100%)` : 'transparent',
                                                        color: isSelected ? mod.color : '#475569',
                                                        fontWeight: 500,
                                                        fontSize: '14px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s ease',
                                                        marginBottom: '4px'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!isSelected) {
                                                            e.currentTarget.style.background = '#f8fafc';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!isSelected) {
                                                            e.currentTarget.style.background = 'transparent';
                                                        }
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: 'var(--radius-md)',
                                                        background: isSelected ? mod.color : '#e2e8f0',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: isSelected ? 'white' : '#64748b',
                                                        transition: 'all 0.15s ease'
                                                    }}>
                                                        <Icon size={16} />
                                                    </div>
                                                    <span style={{ flex: 1, textAlign: 'left' }}>{mod.label}</span>
                                                    {isSelected && <Check size={18} style={{ color: mod.color }} />}
                                                </button>
                                            );
                                        })}
                                        <div style={{
                                            borderTop: '1px solid #e2e8f0',
                                            marginTop: '8px',
                                            paddingTop: '8px'
                                        }}>
                                            <button
                                                onClick={() => {
                                                    setSelectedModule(null);
                                                    setShowModuleSelector(false);
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    borderRadius: 'var(--radius-lg)',
                                                    border: 'none',
                                                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                                    color: '#64748b',
                                                    fontSize: '13px',
                                                    fontWeight: 500,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'linear-gradient(135deg, #e2e8f0 0%, #e2e8f0 100%)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
                                                }}
                                            >
                                                Ver todos (automático)
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Period Selector */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'white',
                            borderRadius: 'var(--radius-xl)',
                            padding: '6px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                        }}>
                            {(["week", "month", "year"] as const).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '10px 18px',
                                        borderRadius: 'var(--radius-lg)',
                                        border: 'none',
                                        background: period === p
                                            ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
                                            : 'transparent',
                                        color: period === p ? 'white' : '#64748b',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: period === p ? '0 4px 12px rgba(30, 41, 59, 0.25)' : 'none'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (period !== p) {
                                            e.currentTarget.style.background = '#f1f5f9';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (period !== p) {
                                            e.currentTarget.style.background = 'transparent';
                                        }
                                    }}
                                >
                                    <Calendar size={16} />
                                    {periodLabels[p]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ padding: '0 var(--spacing-lg)' }} className="space-y-8 mb-8">
                {/* Dynamic KPIs based on modules */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white rounded-2xl h-40 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                    >
                        {/* School KPIs */}
                        {summary?.school && (
                            <>
                                <ModernKpiCard
                                    title="Alumnos Activos"
                                    value={summary.school.students.toString()}
                                    icon={GraduationCap}
                                    gradientClass="gradient-purple"
                                    subtitle="Inscritos actualmente"
                                />
                                <ModernKpiCard
                                    title="Maestros"
                                    value={summary.school.teachers.toString()}
                                    icon={Users}
                                    gradientClass="gradient-blue"
                                    subtitle="Personal docente"
                                />
                                <ModernKpiCard
                                    title="Ingresos"
                                    value={`$${summary.school.revenue.toLocaleString()}`}
                                    icon={TrendingUp}
                                    gradientClass="gradient-green"
                                    subtitle={periodLabels[period]}
                                />
                                <ModernKpiCard
                                    title="Ingreso Neto"
                                    value={`$${summary.school.netRevenue.toLocaleString()}`}
                                    icon={DollarSign}
                                    gradientClass="gradient-teal"
                                    subtitle="Después de comisiones"
                                />
                            </>
                        )}

                        {/* Retail KPIs */}
                        {summary?.retail && (
                            <>
                                <ModernKpiCard
                                    title="Ventas Totales"
                                    value={`$${summary.retail.totalSales.toLocaleString()}`}
                                    icon={ShoppingCart}
                                    gradientClass="gradient-blue"
                                    subtitle={`${summary.retail.salesCount} transacciones`}
                                />
                                <ModernKpiCard
                                    title="Ticket Promedio"
                                    value={`$${summary.retail.avgTicket.toFixed(2)}`}
                                    icon={DollarSign}
                                    gradientClass="gradient-orange"
                                    subtitle={periodLabels[period]}
                                />
                            </>
                        )}

                        {/* Restaurant KPIs */}
                        {summary?.restaurant && (
                            <>
                                <ModernKpiCard
                                    title="Ingresos"
                                    value={`$${summary.restaurant.totalRevenue.toLocaleString()}`}
                                    icon={TrendingUp}
                                    gradientClass="gradient-green"
                                    subtitle={periodLabels[period]}
                                />
                                <ModernKpiCard
                                    title="Ticket Promedio"
                                    value={`$${summary.restaurant.avgTicket.toFixed(2)}`}
                                    icon={DollarSign}
                                    gradientClass="gradient-orange"
                                    subtitle="Por orden"
                                />
                            </>
                        )}

                        {/* Services KPIs */}
                        {summary?.services && (
                            <>
                                <ModernKpiCard
                                    title="Citas"
                                    value={summary.services.totalAppointments.toString()}
                                    icon={Calendar}
                                    gradientClass="gradient-dashboard"
                                    subtitle={`${summary.services.completed} completadas`}
                                />
                                <ModernKpiCard
                                    title="Ingresos"
                                    value={`$${summary.services.totalRevenue.toLocaleString()}`}
                                    icon={TrendingUp}
                                    gradientClass="gradient-finance"
                                    subtitle={`${summary.services.completionRate.toFixed(0)}% cumplimiento`}
                                />
                            </>
                        )}
                    </motion.div>
                )}

                {/* Tab Buttons */}
                {availableTabs.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                        {availableTabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            const colors = colorMap[tab.color];

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className="flex items-center gap-2 font-semibold transition-all duration-200"
                                    style={{
                                        padding: '12px 20px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        backgroundColor: isActive ? colors.activeBg : colors.inactiveBg,
                                        color: isActive ? 'white' : colors.activeBg,
                                        boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Icon className="h-5 w-5" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Tab Content */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    {/* School Reports */}
                    {activeTab === "school-students" && <StudentMatrixReport />}
                    {activeTab === "school-stats" && <ClassStatsReport />}
                    {activeTab === "school-payroll" && <PayrollReport />}

                    {/* Retail Reports */}
                    {activeTab === "retail-sales" && <SalesReport />}
                    {activeTab === "retail-inventory" && <InventoryReport />}

                    {/* Restaurant Reports */}
                    {activeTab === "restaurant-orders" && <OrdersReport />}
                    {activeTab === "restaurant-menu" && <MenuPerformanceReport />}

                    {/* Services Reports */}
                    {activeTab === "services-appointments" && <ServiceReports />}

                    {/* No tabs available */}
                    {availableTabs.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <BarChart3 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                            <h3 className="text-xl font-bold text-slate-700 mb-2">Sin módulos configurados</h3>
                            <p className="text-slate-500">Configura los módulos de tu negocio para ver reportes relevantes</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
