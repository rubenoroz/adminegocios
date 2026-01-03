"use client";

import { CourseDetail } from "@/components/schools/course-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, MapPin, Users, User, Layout, Settings } from "lucide-react";
import Link from "next/link";
import { use, useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseStudentsManager } from "@/components/schools/course-students-manager";
import { CourseScheduleManager } from "@/components/schools/course-schedule-manager";
import { CourseBuilder } from "@/components/schools/course-builder";
import { Badge } from "@/components/ui/badge";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";
import { SchoolNavigation } from "@/components/schools/school-navigation";

export default function CourseDetailPage({ params }: { params: Promise<{ lang: string; courseId: string }> }) {
    const { lang, courseId } = use(params);
    const [course, setCourse] = useState<any>(null);

    useEffect(() => {
        fetchCourse();
    }, [courseId]);

    const fetchCourse = async () => {
        try {
            const res = await fetch(`/api/courses/${courseId}`);
            if (res.ok) {
                const data = await res.json();
                setCourse(data);
            }
        } catch (error) {
            console.error("Failed to fetch course", error);
        }
    };

    // Derived gradient based on ID (consistent with CourseList)
    const cardGradients = [
        "from-blue-600 to-blue-500",
        "from-purple-600 to-purple-500",
        "from-pink-600 to-pink-500",
        "from-orange-600 to-orange-500",
        "from-green-600 to-green-500",
        "from-teal-600 to-teal-500",
    ];
    // Simple hash for consistency
    const gradientIndex = courseId ? courseId.charCodeAt(courseId.length - 1) % cardGradients.length : 0;
    const selectedGradient = cardGradients[gradientIndex];

    return (
        <div className="bg-slate-100 min-h-screen pb-20">
            {/* School Navigation Bar */}
            <div style={{ padding: 'var(--spacing-lg) var(--spacing-lg) 0' }}>
                <SchoolNavigation />
            </div>

            {/* HEADER - MISMO PATRÓN QUE EMPLEADOS/ALUMNOS */}
            <div style={{
                padding: 'var(--spacing-lg)',
                marginBottom: '64px',
                position: 'relative',
                zIndex: 10
            }}>
                <div className="flex items-center gap-4 mb-8">
                    <Link href={`/${lang}/dashboard/courses`}>
                        <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all shadow-sm">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                    </Link>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                                {course?.name || "Cargando curso..."}
                            </h1>
                            <div className="flex gap-2">
                                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 px-3 py-1 rounded-lg">
                                    Activo
                                </Badge>
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1 rounded-lg">
                                    Presencial
                                </Badge>
                            </div>
                        </div>
                        <p className="text-muted-foreground text-lg max-w-4xl leading-relaxed">
                            {course?.description || "Sin descripción disponible para este curso."}
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ padding: '0 var(--spacing-lg)', marginBottom: '48px' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <ModernKpiCard
                        title="Profesor"
                        value={course?.teacher?.name || "Sin asignar"}
                        icon={User}
                        gradientClass="gradient-courses"
                        subtitle="Docente titular"
                    />
                    <ModernKpiCard
                        title="Horario"
                        value={course?.scheduleSummary || course?.schedule || "Sin horario"}
                        icon={Clock}
                        gradientClass="gradient-students"
                        subtitle="Sesiones semanales"
                    />
                    <ModernKpiCard
                        title="Ubicación"
                        value={course?.roomFromSchedules || course?.room || "Por asignar"}
                        icon={MapPin}
                        gradientClass="gradient-employees"
                        subtitle="Salón de clases"
                    />
                    <ModernKpiCard
                        title="Alumnos"
                        value={(course?._count?.enrollments || course?.enrollments?.length || 0).toString()}
                        icon={Users}
                        gradientClass="gradient-finance"
                        subtitle="Estudiantes inscritos"
                    />
                </div>
            </div>

            <div style={{ padding: '0 var(--spacing-lg)' }}>
                {/* TABS NAVIGATION */}
                <Tabs defaultValue="content" className="w-full">
                    <div className="mb-8 flex justify-center sticky top-0 z-10 bg-slate-50 py-4 -mx-6 px-6" style={{ scrollMarginTop: '100px' }}>
                        <TabsList className="course-tabs-container">
                            <TabsTrigger value="content" className="course-tab">
                                <Layout size={16} strokeWidth={2.5} />
                                Contenido
                            </TabsTrigger>
                            <TabsTrigger value="students" className="course-tab">
                                <Users size={16} strokeWidth={2.5} />
                                Alumnos
                            </TabsTrigger>
                            <TabsTrigger value="schedule" className="course-tab">
                                <Clock size={16} strokeWidth={2.5} />
                                Horario
                            </TabsTrigger>
                            <TabsTrigger value="details" className="course-tab">
                                <Settings size={16} strokeWidth={2.5} />
                                Configuración
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* CONTENT AREA */}

                    <TabsContent value="content" className="min-h-[500px]">
                        <CourseBuilder courseId={courseId} />
                    </TabsContent>

                    <TabsContent value="students" className="min-h-[500px]">
                        {/* Wrapping existing manager in a Card to ensure background consistency */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-1">
                            <CourseStudentsManager courseId={courseId} onUpdate={fetchCourse} />
                        </div>
                    </TabsContent>

                    <TabsContent value="schedule" className="min-h-[500px]">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <CourseScheduleManager onUpdate={fetchCourse} />
                        </div>
                    </TabsContent>

                    <TabsContent value="details" className="min-h-[500px]">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <CourseDetail courseId={courseId} />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
