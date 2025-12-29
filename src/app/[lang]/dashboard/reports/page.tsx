"use client";

import { useState } from "react";
import { StudentMatrixReport } from "@/components/reports/student-matrix-report";
import { PayrollReport } from "@/components/reports/payroll-report";
import { ClassStatsReport } from "@/components/reports/class-stats-report";
import { AbsenteeismAlerts } from "@/components/schools/absenteeism-alerts";
import { FileText, Users, BarChart3, AlertTriangle, Wallet, TrendingUp, GraduationCap, Clock } from "lucide-react";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState("matrix");

    const tabs = [
        { id: "matrix", label: "Listado", icon: FileText, color: "blue" },
        { id: "stats", label: "Estadísticas", icon: BarChart3, color: "purple" },
        { id: "payroll", label: "Nómina", icon: Wallet, color: "emerald" },
        { id: "absenteeism", label: "Asistencia", icon: AlertTriangle, color: "red" },
    ];

    const getTabStyles = (tabId: string, color: string) => {
        const isActive = activeTab === tabId;
        const colorMap: Record<string, { bg: string; text: string; activeBg: string }> = {
            blue: { bg: "bg-blue-50", text: "text-blue-700", activeBg: "bg-gradient-to-r from-blue-600 to-blue-500" },
            purple: { bg: "bg-purple-50", text: "text-purple-700", activeBg: "bg-gradient-to-r from-purple-600 to-purple-500" },
            emerald: { bg: "bg-emerald-50", text: "text-emerald-700", activeBg: "bg-gradient-to-r from-emerald-600 to-emerald-500" },
            red: { bg: "bg-red-50", text: "text-red-700", activeBg: "bg-gradient-to-r from-red-600 to-red-500" },
        };

        if (isActive) {
            return `${colorMap[color].activeBg} text-white shadow-lg`;
        }
        return `bg-white hover:${colorMap[color].bg} ${colorMap[color].text} border border-slate-200`;
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
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
                        Reportes y Estadísticas
                    </h1>
                    <p className="text-slate-500 text-lg">
                        Análisis detallado de alumnos, nómina y asistencia
                    </p>
                </div>
            </div>

            <div style={{ padding: '0 var(--spacing-lg)' }} className="space-y-8">
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                    <ModernKpiCard
                        title="Total Alumnos"
                        value="--"
                        icon={GraduationCap}
                        gradientClass="gradient-students"
                        subtitle="Registrados en el sistema"
                    />
                    <ModernKpiCard
                        title="Clases Activas"
                        value="--"
                        icon={Clock}
                        gradientClass="gradient-courses"
                        subtitle="Este mes"
                    />
                    <ModernKpiCard
                        title="Ingresos del Mes"
                        value="--"
                        icon={TrendingUp}
                        gradientClass="gradient-finance"
                        subtitle="Pagos recibidos"
                    />
                    <ModernKpiCard
                        title="Maestros Activos"
                        value="--"
                        icon={Users}
                        gradientClass="gradient-dashboard"
                        subtitle="Con clases asignadas"
                    />
                </div>

                {/* Tab Buttons */}
                <div className="flex flex-wrap gap-8 mt-4">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        const colorMap: Record<string, { activeBg: string; inactiveBg: string; hoverBg: string }> = {
                            blue: { activeBg: '#2563EB', inactiveBg: '#EFF6FF', hoverBg: '#DBEAFE' },
                            purple: { activeBg: '#7C3AED', inactiveBg: '#F5F3FF', hoverBg: '#EDE9FE' },
                            emerald: { activeBg: '#059669', inactiveBg: '#ECFDF5', hoverBg: '#D1FAE5' },
                            red: { activeBg: '#DC2626', inactiveBg: '#FEF2F2', hoverBg: '#FEE2E2' },
                        };
                        const colors = colorMap[tab.color];

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className="flex items-center gap-2 font-semibold transition-all duration-200"
                                style={{
                                    padding: '12px 20px',
                                    borderRadius: '8px',
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

                {/* Tab Content */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    {activeTab === "matrix" && <StudentMatrixReport />}
                    {activeTab === "stats" && <ClassStatsReport />}
                    {activeTab === "payroll" && <PayrollReport />}
                    {activeTab === "absenteeism" && <AbsenteeismAlerts />}
                </div>
            </div>
        </div>
    );
}
