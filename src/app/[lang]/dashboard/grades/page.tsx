"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useBranch } from "@/context/branch-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, BookOpen, GraduationCap, Users, TrendingUp, Award } from "lucide-react";
import { GradesTable } from "@/components/schools/grades-table";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";
import { ModernFilterBar } from "@/components/ui/modern-filter-bar";

export default function GradesPage() {
    const { selectedBranch } = useBranch();
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>("");

    // Detectar mes actual
    const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    const currentMonth = monthNames[new Date().getMonth()];

    const [selectedPeriod, setSelectedPeriod] = useState<string>(currentMonth);
    const [searchValue, setSearchValue] = useState("");
    const [filterPeriod, setFilterPeriod] = useState<string[]>([currentMonth]);

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
    const coursesWithGrades = courses.filter(c => c.hasGrades).length;

    // Filter courses
    const filteredCourses = courses.filter(course =>
        searchValue === "" ||
        course.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        course.teacher?.name?.toLowerCase().includes(searchValue.toLowerCase())
    );

    const periodLabels: Record<string, string> = {
        "JANUARY": "Enero",
        "FEBRUARY": "Febrero",
        "MARCH": "Marzo",
        "APRIL": "Abril",
        "MAY": "Mayo",
        "JUNE": "Junio",
        "JULY": "Julio",
        "AUGUST": "Agosto",
        "SEPTEMBER": "Septiembre",
        "OCTOBER": "Octubre",
        "NOVEMBER": "Noviembre",
        "DECEMBER": "Diciembre"
    };

    return (
        <div className="bg-slate-100 pb-16 min-h-screen">
            {/* HEADER - MISMO PATRÓN QUE EMPLEADOS */}
            <div style={{
                padding: 'var(--spacing-lg)',
                marginBottom: '64px',
                position: 'relative',
                zIndex: 10
            }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
                            Calificaciones
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            {selectedBranch ? `Sucursal: ${selectedBranch.name}` : "Gestión académica y evaluaciones"}
                        </p>
                    </div>
                </div>
            </div>

            {/* KPIS - MISMO PATRÓN QUE EMPLEADOS */}
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
                        title="Total Cursos"
                        value={totalCourses.toString()}
                        icon={BookOpen}
                        gradientClass="gradient-courses"
                        subtitle="Cursos activos"
                    />
                    <ModernKpiCard
                        title="Total Alumnos"
                        value={totalStudents.toString()}
                        icon={Users}
                        gradientClass="gradient-students"
                        subtitle="Inscritos en cursos"
                    />
                    <ModernKpiCard
                        title="Periodo Actual"
                        value={selectedPeriod ? periodLabels[selectedPeriod] : "Todo el Año"}
                        icon={CalendarIcon}
                        gradientClass="gradient-finance"
                        subtitle="Evaluación activa"
                    />
                    <ModernKpiCard
                        title="Cursos Evaluados"
                        value={coursesWithGrades.toString()}
                        icon={Award}
                        gradientClass="gradient-employees"
                        subtitle="Con calificaciones"
                    />
                </div>
            </motion.div>

            {/* FILTROS - MISMO PATRÓN QUE EMPLEADOS */}
            <div style={{ padding: '0 var(--spacing-lg)', marginBottom: '40px' }}>
                <ModernFilterBar
                    searchValue={searchValue}
                    onSearchChange={setSearchValue}
                    placeholder="Buscar cursos..."
                    filters={[
                        { label: "Ene", value: "JANUARY", color: "blue" },
                        { label: "Feb", value: "FEBRUARY", color: "purple" },
                        { label: "Mar", value: "MARCH", color: "green" },
                        { label: "Abr", value: "APRIL", color: "orange" },
                        { label: "May", value: "MAY", color: "blue" },
                        { label: "Jun", value: "JUNE", color: "purple" },
                        { label: "Jul", value: "JULY", color: "green" },
                        { label: "Ago", value: "AUGUST", color: "orange" },
                        { label: "Sep", value: "SEPTEMBER", color: "blue" },
                        { label: "Oct", value: "OCTOBER", color: "purple" },
                        { label: "Nov", value: "NOVEMBER", color: "green" },
                        { label: "Dic", value: "DECEMBER", color: "orange" }
                    ]}
                    activeFilters={filterPeriod}
                    onFilterToggle={(value) => {
                        if (filterPeriod.includes(value)) {
                            // Si ya está activo, lo quitamos
                            setFilterPeriod([]);
                            setSelectedPeriod("");
                        } else {
                            // Si no está activo, lo activamos
                            setFilterPeriod([value]);
                            setSelectedPeriod(value);
                        }
                    }}
                />
            </div>

            {/* COURSE CARDS - MISMO PATRÓN QUE EMPLEADOS */}
            <section style={{ padding: '0 var(--spacing-lg)', minHeight: '400px' }} className="pb-8">
                {filteredCourses.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">📚</div>
                        <p className="text-slate-500 text-lg">No hay cursos disponibles</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '32px' }}>
                        {filteredCourses.map((course, index) => {
                            const courseColors: Record<number, { bg: string; accent: string }> = {
                                0: { bg: '#DBEAFE', accent: '#2563EB' },
                                1: { bg: '#EDE9FE', accent: '#7C3AED' },
                                2: { bg: '#FCE7F3', accent: '#DB2777' },
                                3: { bg: '#FFEDD5', accent: '#EA580C' },
                                4: { bg: '#D1FAE5', accent: '#059669' },
                                5: { bg: '#CCFBF1', accent: '#0D9488' },
                            };
                            const colors = courseColors[index % 6];
                            const isSelected = selectedCourseId === course.id;

                            return (
                                <div
                                    key={course.id}
                                    className="course-card cursor-pointer transition-all hover:scale-[1.02]"
                                    style={{
                                        backgroundColor: colors.bg,
                                        borderRadius: '20px',
                                        padding: '28px',
                                        minHeight: '280px',
                                        boxShadow: isSelected ? `0 0 0 3px ${colors.accent}` : '0 10px 40px rgba(0,0,0,0.12)',
                                        display: 'flex',
                                        flexDirection: 'column' as const
                                    }}
                                    onClick={() => setSelectedCourseId(course.id)}
                                >
                                    {/* ICON */}
                                    <div
                                        style={{
                                            width: '72px',
                                            height: '72px',
                                            borderRadius: '16px',
                                            backgroundColor: colors.accent,
                                            color: 'white',
                                            fontSize: '24px',
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '20px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                        }}
                                    >
                                        <BookOpen size={32} />
                                    </div>

                                    {/* NAME */}
                                    <h3 style={{
                                        fontSize: '22px',
                                        fontWeight: 'bold',
                                        color: '#1E293B',
                                        marginBottom: '8px'
                                    }}>
                                        {course.name}
                                    </h3>

                                    {/* TEACHER (as role badge) */}
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '6px 14px',
                                        backgroundColor: 'rgba(255,255,255,0.8)',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        color: colors.accent,
                                        marginBottom: '16px',
                                        width: 'fit-content'
                                    }}>
                                        {course.teacher?.name || 'Sin profesor'}
                                    </span>

                                    {/* SPACER */}
                                    <div style={{ flex: 1 }} />

                                    {/* FOOTER */}
                                    <div style={{
                                        marginTop: '16px',
                                        paddingTop: '16px',
                                        borderTop: '2px solid rgba(255,255,255,0.5)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '28px', fontWeight: '900', color: '#0F172A' }}>
                                                {course._count?.enrollments || 0}
                                            </div>
                                            <div style={{ fontSize: '10px', fontWeight: 'bold', color: colors.accent, textTransform: 'uppercase' }}>
                                                Alumnos
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div style={{
                                                padding: '8px 16px',
                                                backgroundColor: colors.accent,
                                                color: 'white',
                                                borderRadius: '10px',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}>
                                                Seleccionado
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* GRADES TABLE - MODAL-LIKE SECTION */}
            {selectedCourseId && (
                <section style={{ padding: '0 var(--spacing-lg)' }} className="pt-8">
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200/60">
                        <div className="flex items-center gap-3 p-6 border-b border-slate-100">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                <GraduationCap className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">
                                    Calificaciones: {courses.find(c => c.id === selectedCourseId)?.name}
                                </h3>
                                <p className="text-sm text-slate-500 font-medium">
                                    Periodo: {periodLabels[selectedPeriod]}
                                </p>
                            </div>
                        </div>
                        <GradesTable
                            courseId={selectedCourseId}
                            period={selectedPeriod}
                        />
                    </div>
                </section>
            )}
        </div>
    );
}
