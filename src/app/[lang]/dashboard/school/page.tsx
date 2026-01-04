"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { CourseList } from "@/components/schools/course-list";
import { StudentList } from "@/components/schools/student-list";
import { ParentAccountsManager } from "@/components/parents/parent-accounts-manager";
import { GradesManager } from "@/components/schools/grades-manager";
import { AttendanceManager } from "@/components/schools/attendance-manager";
import { SchoolStaff } from "@/components/schools/school-staff";
import { CommunicationHub } from "@/components/schools/communication-hub";
import { FeesList } from "@/components/finance/fees-list";
import { FeeTemplatesManager } from "@/components/finance/fee-templates-manager";
import { CommissionsManager } from "@/components/schools/commissions-manager";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";
import { useBranch } from "@/context/branch-context";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Users, UserCheck, Award, Clock, Briefcase, Megaphone, DollarSign, Wallet, AlertCircle, TrendingUp } from "lucide-react";

type TabType = "courses" | "students" | "parents" | "grades" | "attendance" | "staff" | "communication" | "finance" | "commissions";

export default function SchoolPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { selectedBranch } = useBranch();

    const validTabs: TabType[] = ["courses", "students", "parents", "grades", "attendance", "staff", "communication", "finance", "commissions"];
    const tabFromUrl = searchParams.get("tab") as TabType;
    const initialTab = validTabs.includes(tabFromUrl) ? tabFromUrl : "courses";

    const [activeTab, setActiveTab] = useState<TabType>(initialTab);
    const [financeSubTab, setFinanceSubTab] = useState<"fees" | "templates">("fees");
    const [financeStats, setFinanceStats] = useState({ collected: 0, pending: 0, overdue: 0, total: 0 });

    // Sync URL with activeTab
    useEffect(() => {
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.set("tab", activeTab);
        router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
    }, [activeTab]);

    // Fetch finance stats when on finance tab
    useEffect(() => {
        if (activeTab === "finance" && selectedBranch?.businessId) {
            fetch(`/api/finance/stats?businessId=${selectedBranch.businessId}`)
                .then(res => res.ok ? res.json() : { collected: 0, pending: 0, overdue: 0, total: 0 })
                .then(data => setFinanceStats(data))
                .catch(() => { });
        }
    }, [activeTab, selectedBranch?.businessId]);

    const tabs = [
        { id: "courses" as TabType, label: "Cursos", icon: BookOpen },
        { id: "students" as TabType, label: "Alumnos", icon: Users },
        { id: "parents" as TabType, label: "Padres", icon: UserCheck },
        { id: "grades" as TabType, label: "Calificaciones", icon: Award },
        { id: "attendance" as TabType, label: "Asistencia", icon: Clock },
        { id: "staff" as TabType, label: "Personal", icon: Briefcase },
        { id: "communication" as TabType, label: "Comunicación", icon: Megaphone },
        { id: "finance" as TabType, label: "Finanzas", icon: DollarSign },
        { id: "commissions" as TabType, label: "Comisiones", icon: TrendingUp },
    ];

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="course-tabs-container" style={{ marginBottom: '24px' }}>
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            data-state={isActive ? "active" : "inactive"}
                            className="course-tab"
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === "courses" && <CourseList />}
                    {activeTab === "students" && <StudentList />}
                    {activeTab === "parents" && <ParentAccountsManager />}
                    {activeTab === "grades" && <GradesManager />}
                    {activeTab === "attendance" && <AttendanceManager />}
                    {activeTab === "staff" && <SchoolStaff />}
                    {activeTab === "communication" && <CommunicationHub />}
                    {activeTab === "finance" && (
                        <div className="space-y-6">
                            {/* Finance KPIs */}
                            <div className="store-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                                <ModernKpiCard
                                    title="Cobrado este Mes"
                                    value={`$${financeStats.collected.toLocaleString()}`}
                                    icon={DollarSign}
                                    gradientClass="gradient-finance"
                                    subtitle="Ingresos registrados"
                                    positive={true}
                                />
                                <ModernKpiCard
                                    title="Por Cobrar"
                                    value={`$${financeStats.pending.toLocaleString()}`}
                                    icon={Wallet}
                                    gradientClass="gradient-courses"
                                    subtitle="Saldos pendientes"
                                />
                                <ModernKpiCard
                                    title="Total Vencido"
                                    value={`$${financeStats.overdue.toLocaleString()}`}
                                    icon={AlertCircle}
                                    gradientClass="gradient-employees"
                                    subtitle="Pagos con fecha excedida"
                                />
                                <ModernKpiCard
                                    title="Total Registrado"
                                    value={`$${financeStats.total.toLocaleString()}`}
                                    icon={TrendingUp}
                                    gradientClass="gradient-students"
                                    subtitle="Monto total histórico"
                                />
                            </div>

                            {/* Finance Sub-Tabs */}
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => setFinanceSubTab("fees")}
                                    className={`button-modern flex items-center gap-2 ${financeSubTab === "fees"
                                        ? "bg-gradient-to-r from-emerald-600 to-emerald-500"
                                        : "bg-gradient-to-r from-blue-600 to-blue-500"
                                        }`}
                                    style={{ borderRadius: '8px', padding: '10px 16px', fontSize: '14px' }}
                                >
                                    Cuentas por Cobrar
                                </button>
                                <button
                                    onClick={() => setFinanceSubTab("templates")}
                                    className={`button-modern flex items-center gap-2 ${financeSubTab === "templates"
                                        ? "bg-gradient-to-r from-emerald-600 to-emerald-500"
                                        : "bg-gradient-to-r from-blue-600 to-blue-500"
                                        }`}
                                    style={{ borderRadius: '8px', padding: '10px 16px', fontSize: '14px' }}
                                >
                                    Conceptos de Pago
                                </button>
                            </div>
                            {/* Finance Content */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 lg:p-6">
                                {financeSubTab === "fees" && <FeesList />}
                                {financeSubTab === "templates" && <FeeTemplatesManager />}
                            </div>
                        </div>
                    )}
                    {activeTab === "commissions" && <CommissionsManager />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

