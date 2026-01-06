"use client";

import { useState, useEffect, useMemo } from "react";
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
import { SchoolClassCalendar } from "@/components/schools/school-class-calendar";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";
import { useBranch } from "@/context/branch-context";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen, Users, UserCheck, Award, Clock, Briefcase, Megaphone,
    DollarSign, Wallet, AlertCircle, TrendingUp, CalendarDays,
    GraduationCap, Settings, LucideIcon
} from "lucide-react";

// Section and SubTab types
type SectionType = "academico" | "alumnos" | "administracion";
type SubTabType = "courses" | "calendario" | "students" | "parents" | "grades" | "attendance" | "staff" | "communication" | "finance" | "commissions";

interface SubTab {
    id: SubTabType;
    label: string;
    icon: LucideIcon;
}

interface Section {
    id: SectionType;
    label: string;
    icon: LucideIcon;
    subTabs: SubTab[];
}

const sections: Section[] = [
    {
        id: "academico",
        label: "Académico",
        icon: GraduationCap,
        subTabs: [
            { id: "courses", label: "Cursos", icon: BookOpen },
            { id: "calendario", label: "Calendario", icon: CalendarDays },
        ]
    },
    {
        id: "alumnos",
        label: "Alumnos",
        icon: Users,
        subTabs: [
            { id: "students", label: "Lista", icon: Users },
            { id: "parents", label: "Padres", icon: UserCheck },
            { id: "grades", label: "Calificaciones", icon: Award },
            { id: "attendance", label: "Asistencia", icon: Clock },
        ]
    },
    {
        id: "administracion",
        label: "Administración",
        icon: Settings,
        subTabs: [
            { id: "staff", label: "Personal", icon: Briefcase },
            { id: "communication", label: "Comunicación", icon: Megaphone },
            { id: "finance", label: "Finanzas", icon: DollarSign },
            { id: "commissions", label: "Comisiones", icon: TrendingUp },
        ]
    }
];

export default function SchoolPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { selectedBranch } = useBranch();

    // Get initial values from URL
    const sectionFromUrl = searchParams.get("section") as SectionType || "academico";
    const subTabFromUrl = searchParams.get("tab") as SubTabType || "courses";

    const [activeSection, setActiveSection] = useState<SectionType>(sectionFromUrl);
    const [activeSubTab, setActiveSubTab] = useState<SubTabType>(subTabFromUrl);
    const [financeSubTab, setFinanceSubTab] = useState<"fees" | "templates">("fees");
    const [financeStats, setFinanceStats] = useState({ collected: 0, pending: 0, overdue: 0, total: 0 });

    // Get current section's sub-tabs
    const currentSection = useMemo(() => sections.find(s => s.id === activeSection)!, [activeSection]);
    const currentSubTabs = currentSection.subTabs;

    // When section changes, set first sub-tab as active
    useEffect(() => {
        const validSubTab = currentSubTabs.find(st => st.id === activeSubTab);
        if (!validSubTab) {
            setActiveSubTab(currentSubTabs[0].id);
        }
    }, [activeSection, currentSubTabs, activeSubTab]);

    // Sync URL with state
    useEffect(() => {
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.set("section", activeSection);
        newParams.set("tab", activeSubTab);
        router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
    }, [activeSection, activeSubTab, pathname, router, searchParams]);

    // Fetch finance stats when on finance tab
    useEffect(() => {
        if (activeSubTab === "finance" && selectedBranch?.businessId) {
            fetch(`/api/finance/stats?businessId=${selectedBranch.businessId}`)
                .then(res => res.ok ? res.json() : { collected: 0, pending: 0, overdue: 0, total: 0 })
                .then(data => setFinanceStats(data))
                .catch(() => { });
        }
    }, [activeSubTab, selectedBranch?.businessId]);

    return (
        <div className="space-y-6">
            {/* Main Section Navigation */}
            <div style={{
                display: "flex",
                gap: "12px",
                marginBottom: "16px",
                backgroundColor: "#f8fafc",
                padding: "8px",
                borderRadius: "16px",
                border: "1px solid #e2e8f0"
            }}>
                {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "12px 20px",
                                borderRadius: "12px",
                                border: "none",
                                backgroundColor: isActive ? "#0f172a" : "transparent",
                                color: isActive ? "white" : "#475569",
                                fontSize: "15px",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                flex: 1,
                                justifyContent: "center",
                            }}
                        >
                            <Icon size={20} />
                            {section.label}
                        </button>
                    );
                })}
            </div>

            {/* Sub-Tab Navigation */}
            <div className="course-tabs-container" style={{ marginBottom: '24px' }}>
                {currentSubTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeSubTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
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
                    key={activeSubTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeSubTab === "courses" && <CourseList />}
                    {activeSubTab === "calendario" && <SchoolClassCalendar />}
                    {activeSubTab === "students" && <StudentList />}
                    {activeSubTab === "parents" && <ParentAccountsManager />}
                    {activeSubTab === "grades" && <GradesManager />}
                    {activeSubTab === "attendance" && <AttendanceManager />}
                    {activeSubTab === "staff" && <SchoolStaff />}
                    {activeSubTab === "communication" && <CommunicationHub />}
                    {activeSubTab === "finance" && (
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
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '32px' }}>
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
                    {activeSubTab === "commissions" && <CommissionsManager />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
