"use client";

import { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ClipboardList, Wrench, Users, Briefcase, BarChart3 } from "lucide-react";
import { ServicesCalendar } from "@/components/services/services-calendar";
import { AppointmentsList } from "@/components/services/appointments-list";
import { ServiceCatalog } from "@/components/services/service-catalog";
import { ServiceClients } from "@/components/services/service-clients";
import { ServiceStaff } from "@/components/services/service-staff";
import { ServiceReports } from "@/components/services/service-reports";

type TabType = "agenda" | "citas" | "servicios" | "clientes" | "staff" | "reportes";

export default function ServicesPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const tabFromUrl = searchParams.get("tab") as TabType | null;
    const validTabs: TabType[] = ["agenda", "citas", "servicios", "clientes", "staff", "reportes"];
    const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : "agenda";

    const [activeTab, setActiveTab] = useState<TabType>(initialTab);

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const tabs = [
        { id: "agenda" as TabType, label: "Agenda", icon: Calendar },
        { id: "citas" as TabType, label: "Citas", icon: ClipboardList },
        { id: "servicios" as TabType, label: "Servicios", icon: Wrench },
        { id: "clientes" as TabType, label: "Clientes", icon: Users },
        { id: "staff" as TabType, label: "Staff", icon: Briefcase },
        { id: "reportes" as TabType, label: "Reportes", icon: BarChart3 },
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
                            onClick={() => handleTabChange(tab.id)}
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
                    {activeTab === "agenda" && <ServicesCalendar />}
                    {activeTab === "citas" && <AppointmentsList />}
                    {activeTab === "servicios" && <ServiceCatalog />}
                    {activeTab === "clientes" && <ServiceClients />}
                    {activeTab === "staff" && <ServiceStaff />}
                    {activeTab === "reportes" && <ServiceReports />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
