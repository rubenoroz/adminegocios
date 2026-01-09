"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { BookOpen, Users, UserCheck, Award, Clock, Briefcase, Megaphone, UsersRound } from "lucide-react";

const allTabs = [
    { id: "courses", label: "Cursos", icon: BookOpen, path: "/dashboard/courses" },
    { id: "groups", label: "Grupos", icon: UsersRound, path: "/dashboard/groups" },
    { id: "students", label: "Alumnos", icon: Users, path: "/dashboard/students" },
    { id: "parents", label: "Padres", icon: UserCheck, path: "/dashboard/parents", requiresParentsModule: true },
    { id: "grades", label: "Calificaciones", icon: Award, path: "/dashboard/grades" },
    { id: "attendance", label: "Asistencia", icon: Clock, path: "/dashboard/attendance" },
    { id: "staff", label: "Personal", icon: Briefcase, path: "/dashboard/employees" },
    { id: "communication", label: "Comunicación", icon: Megaphone, path: "/dashboard/communication" },
];

export function SchoolNavigation() {
    const pathname = usePathname();
    const router = useRouter();
    const [enableParentsModule, setEnableParentsModule] = useState(true);

    // Fetch business settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/business/settings");
                if (res.ok) {
                    const data = await res.json();
                    console.log("📝 [SchoolNavigation] Settings received:", data);
                    setEnableParentsModule(data.enableParentsModule ?? true);
                }
            } catch (error) {
                console.error("Failed to fetch business settings", error);
            }
        };
        fetchSettings();
    }, []);

    // Filter tabs based on settings
    const tabs = allTabs.filter(tab => {
        if (tab.requiresParentsModule && !enableParentsModule) {
            return false;
        }
        return true;
    });

    // Extract lang from pathname (e.g., /es/dashboard/courses -> es)
    const lang = pathname?.split('/')[1] || 'es';

    // Determine active tab from current path
    const getActiveTab = () => {
        for (const tab of tabs) {
            if (pathname?.includes(tab.path)) {
                return tab.id;
            }
        }
        return "courses";
    };

    const activeTab = getActiveTab();

    const handleTabClick = (path: string) => {
        router.push(`/${lang}${path}`);
    };

    return (
        <div className="course-tabs-container" style={{ marginBottom: '24px' }}>
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.path)}
                        data-state={isActive ? "active" : "inactive"}
                        className="course-tab"
                    >
                        <Icon size={18} />
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
