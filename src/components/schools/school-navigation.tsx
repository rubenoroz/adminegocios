"use client";

import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Users, UserCheck, Award, Clock, Briefcase, Megaphone } from "lucide-react";

const tabs = [
    { id: "courses", label: "Cursos", icon: BookOpen, path: "/dashboard/courses" },
    { id: "students", label: "Alumnos", icon: Users, path: "/dashboard/students" },
    { id: "parents", label: "Padres", icon: UserCheck, path: "/dashboard/parents" },
    { id: "grades", label: "Calificaciones", icon: Award, path: "/dashboard/grades" },
    { id: "attendance", label: "Asistencia", icon: Clock, path: "/dashboard/attendance" },
    { id: "staff", label: "Personal", icon: Briefcase, path: "/dashboard/employees" },
    { id: "communication", label: "Comunicación", icon: Megaphone, path: "/dashboard/communication" },
];

export function SchoolNavigation() {
    const pathname = usePathname();
    const router = useRouter();

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
