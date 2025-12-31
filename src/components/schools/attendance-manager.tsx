"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useBranch } from "@/context/branch-context";
import { Calendar as CalendarIcon, BookOpen, Users, UserCheck, Clock } from "lucide-react";
import { AttendanceTaker } from "@/components/schools/attendance-taker";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";
import { ModernFilterBar } from "@/components/ui/modern-filter-bar";

export function AttendanceManager() {
    const { selectedBranch } = useBranch();
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>("");
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [searchValue, setSearchValue] = useState("");
    const [filterCourse, setFilterCourse] = useState<string[]>([]);

    useEffect(() => {
        if (selectedBranch?.businessId) {
            fetchCourses();
        }
    }, [selectedBranch]);

    const fetchCourses = async () => {
        if (!selectedBranch?.businessId) return;
        try {
            const res = await fetch(`/api/courses?businessId=${selectedBranch.businessId}`);
            if (res.ok) {
                const data = await res.json();
                setCourses(data);
            }
        } catch (error) {
            console.error("Error fetching courses", error);
        }
    };

    // Stats
    const totalCourses = courses.length;
    const totalStudents = courses.reduce((sum, c) => sum + (c._count?.enrollments || 0), 0);

    // Filter courses
    const filteredCourses = courses.filter(course => {
        const matchesSearch = searchValue === "" ||
            course.name.toLowerCase().includes(searchValue.toLowerCase()) ||
            course.teacher?.name?.toLowerCase().includes(searchValue.toLowerCase());

        const matchesFilter = filterCourse.length === 0 ||
            (filterCourse.includes("WITH_TEACHER") && course.teacher) ||
            (filterCourse.includes("NO_TEACHER") && !course.teacher) ||
            (filterCourse.includes("WITH_STUDENTS") && (course._count?.enrollments || 0) > 0);

        return matchesSearch && matchesFilter;
    });

    // Format today's date
    const today = new Date();
    const formattedDate = today.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="bg-slate-100 pb-16">
            {/* HEADER */}
            <div style={{ padding: 'var(--spacing-lg)', marginBottom: '32px' }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">Asistencia</h1>
                        <p className="text-muted-foreground text-lg">
                            {selectedBranch ? `Sucursal: ${selectedBranch.name}` : "Registro diario de asistencia por curso"}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-white rounded-xl px-4 py-2 shadow-sm border border-slate-200 flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-blue-600" />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="border-none outline-none bg-transparent font-medium text-slate-700"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* KPIS */}
            <motion.div
                style={{ padding: '0 var(--spacing-lg)', marginBottom: '32px' }}
                initial="hidden"
                animate="show"
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <ModernKpiCard title="Total Cursos" value={totalCourses.toString()} icon={BookOpen} gradientClass="gradient-courses" subtitle="Cursos activos" />
                    <ModernKpiCard title="Total Alumnos" value={totalStudents.toString()} icon={Users} gradientClass="gradient-students" subtitle="Inscritos en cursos" />
                    <ModernKpiCard title="Fecha Actual" value={formattedDate.split(',')[0]} icon={CalendarIcon} gradientClass="gradient-finance" subtitle={formattedDate.split(',').slice(1).join(',')} />
                    <ModernKpiCard title="Curso Seleccionado" value={selectedCourseId ? courses.find(c => c.id === selectedCourseId)?.name || "-" : "Ninguno"} icon={UserCheck} gradientClass="gradient-employees" subtitle="Tomar asistencia" />
                </div>
            </motion.div>

            {/* FILTROS */}
            <div style={{ padding: '0 var(--spacing-lg)', marginBottom: '24px' }}>
                <ModernFilterBar
                    searchValue={searchValue}
                    onSearchChange={setSearchValue}
                    placeholder="Buscar cursos..."
                    filters={[
                        { label: "Con Profesor", value: "WITH_TEACHER", color: "green" },
                        { label: "Sin Profesor", value: "NO_TEACHER", color: "orange" },
                        { label: "Con Alumnos", value: "WITH_STUDENTS", color: "blue" }
                    ]}
                    activeFilters={filterCourse}
                    onFilterToggle={(value) => {
                        setFilterCourse(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
                    }}
                />
            </div>

            {/* COURSE CARDS */}
            <section style={{ padding: '0 var(--spacing-lg)' }} className="pb-8">
                {filteredCourses.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">📋</div>
                        <p className="text-slate-500 text-lg">No hay cursos disponibles</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                        {filteredCourses.map((course, index) => {
                            const colors = [
                                { bg: '#DBEAFE', accent: '#2563EB' }, { bg: '#EDE9FE', accent: '#7C3AED' },
                                { bg: '#FCE7F3', accent: '#DB2777' }, { bg: '#FFEDD5', accent: '#EA580C' },
                                { bg: '#D1FAE5', accent: '#059669' }, { bg: '#CCFBF1', accent: '#0D9488' }
                            ][index % 6];
                            const isSelected = selectedCourseId === course.id;

                            return (
                                <div
                                    key={course.id}
                                    className="cursor-pointer transition-all hover:scale-[1.02]"
                                    style={{
                                        backgroundColor: colors.bg,
                                        borderRadius: '16px',
                                        padding: '20px',
                                        boxShadow: isSelected ? `0 0 0 3px ${colors.accent}` : '0 4px 12px rgba(0,0,0,0.08)',
                                    }}
                                    onClick={() => setSelectedCourseId(course.id)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: colors.accent, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Clock size={24} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1E293B' }}>{course.name}</h3>
                                            <span style={{ fontSize: '12px', color: colors.accent }}>{course.teacher?.name || 'Sin profesor'}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '14px', color: '#64748b' }}>{course._count?.enrollments || 0} alumnos</span>
                                        {isSelected && <span style={{ padding: '4px 10px', backgroundColor: colors.accent, color: 'white', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }}>Seleccionado</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ATTENDANCE TABLE */}
            {selectedCourseId && date && (
                <section style={{ padding: '0 var(--spacing-lg)' }} className="pt-8">
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200/60">
                        <div className="flex items-center gap-3 p-6 border-b border-slate-100">
                            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                                <UserCheck className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">
                                    Asistencia: {courses.find(c => c.id === selectedCourseId)?.name}
                                </h3>
                                <p className="text-sm text-slate-500 font-medium">
                                    Fecha: {new Date(date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                        <AttendanceTaker courseId={selectedCourseId} date={date} />
                    </div>
                </section>
            )}
        </div>
    );
}
