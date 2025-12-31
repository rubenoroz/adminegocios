"use client";

import { useState } from "react";
import { CourseList } from "@/components/schools/course-list";
import { StudentList } from "@/components/schools/student-list";
import { ParentAccountsManager } from "@/components/parents/parent-accounts-manager";
import { GradesManager } from "@/components/schools/grades-manager";
import { AttendanceManager } from "@/components/schools/attendance-manager";
import { SchoolStaff } from "@/components/schools/school-staff";
import { CommunicationHub } from "@/components/schools/communication-hub";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Users, UserCheck, Award, Clock, Briefcase, Megaphone } from "lucide-react";

type TabType = "courses" | "students" | "parents" | "grades" | "attendance" | "staff" | "communication";

export default function SchoolPage() {
    const [activeTab, setActiveTab] = useState<TabType>("courses");

    const tabs = [
        { id: "courses" as TabType, label: "Cursos", icon: BookOpen },
        { id: "students" as TabType, label: "Alumnos", icon: Users },
        { id: "parents" as TabType, label: "Padres", icon: UserCheck },
        { id: "grades" as TabType, label: "Calificaciones", icon: Award },
        { id: "attendance" as TabType, label: "Asistencia", icon: Clock },
        { id: "staff" as TabType, label: "Personal", icon: Briefcase },
        { id: "communication" as TabType, label: "Comunicación", icon: Megaphone },
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
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

