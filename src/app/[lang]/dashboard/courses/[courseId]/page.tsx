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
import { CourseGroupsList } from "@/components/schools/course-groups-list";

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

    // KPI Calculations
    const uniqueStudentsFromGroups = course?.schedules
        ? new Set(course.schedules.flatMap((s: any) => s.enrollments?.map((e: any) => e.studentId) || [])).size
        : 0;

    // Total Students: Max of direct enrollments or group enrollments
    const totalStudents = Math.max(course?._count?.enrollments || 0, uniqueStudentsFromGroups);

    // Active Groups: Count unique group names (not individual schedule slots)
    // If schedules share the same groupName, they are ONE group
    const uniqueGroupNames = course?.schedules
        ? new Set(course.schedules.map((s: any) => s.groupName || "Grupo General"))
        : new Set();
    const activeGroups = uniqueGroupNames.size;

    // Content Count (Modules)
    // Assuming we might have modules count in future, for now placeholder or 0
    const modulesCount = 0; // Needs update if API returns module count

    return (
        <div className="bg-slate-100 min-h-screen pb-80">
            {/* HEADER */}
            <div style={{
                padding: 'var(--spacing-lg)',
                marginBottom: '64px',
                position: 'relative',
                zIndex: 10
            }}>
                <div className="flex items-center gap-4 mb-4">
                    <Link href={`/${lang}/dashboard/school?section=academico&tab=cursos`}>
                        <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all shadow-sm">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                    </Link>
                    <div className="flex gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 px-3 py-1 rounded-lg">
                            Activo
                        </Badge>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1 rounded-lg">
                            Presencial
                        </Badge>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
                            {course?.name || "Cargando curso..."}
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-4xl leading-relaxed">
                            {course?.description || "Gestiona el contenido, alumnos y grupos de este curso."}
                        </p>
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <div style={{ padding: '0 var(--spacing-lg)', marginBottom: '48px' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <ModernKpiCard
                        title="Total Alumnos"
                        value={totalStudents.toString()}
                        icon={Users}
                        gradientClass="gradient-courses"
                        subtitle="Alumnos activos"
                    />
                    <ModernKpiCard
                        title="Grupos Activos"
                        value={activeGroups.toString()}
                        icon={Layout} // Or a specific icon for groups
                        gradientClass="gradient-students"
                        subtitle="Grupos únicos"
                    />
                    <ModernKpiCard
                        title="Contenido"
                        value={modulesCount.toString()} // Placeholder until we fetch modules count
                        icon={Layout}
                        gradientClass="gradient-employees"
                        subtitle="Módulos creados"
                    />
                    <ModernKpiCard
                        title="Promedio"
                        value={activeGroups > 0 ? Math.round(totalStudents / activeGroups).toString() : "0"}
                        icon={Users}
                        gradientClass="gradient-finance"
                        subtitle="Alumnos por grupo"
                    />
                </div>
            </div>

            <div style={{ padding: '0 var(--spacing-lg)' }}>
                <Tabs defaultValue="groups" className="w-full">
                    <div className="mb-8 flex justify-center overflow-x-auto bg-slate-100 py-4 -mx-6 px-6">
                        <TabsList className="course-tabs-container">
                            <TabsTrigger value="content" className="course-tab">
                                <Layout size={16} strokeWidth={2.5} />
                                <span className="ml-2">Contenido</span>
                            </TabsTrigger>
                            <TabsTrigger value="students" className="course-tab">
                                <Users size={16} strokeWidth={2.5} />
                                <span className="ml-2">Alumnos</span>
                            </TabsTrigger>
                            <TabsTrigger value="groups" className="course-tab">
                                <Clock size={16} strokeWidth={2.5} />
                                <span className="ml-2">Grupos</span>
                            </TabsTrigger>
                            <TabsTrigger value="details" className="course-tab">
                                <Settings size={16} strokeWidth={2.5} />
                                <span className="ml-2">Configuración</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* CONTENT AREA */}
                    <TabsContent value="content" className="min-h-[500px]" style={{ marginTop: '100px' }}>
                        <CourseBuilder courseId={courseId} />
                    </TabsContent>

                    <TabsContent value="students" className="min-h-[500px]" style={{ marginTop: '100px' }}>
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-1">
                            {/* Will be updated to match the new requirement */}
                            <CourseStudentsManager course={course} onUpdate={fetchCourse} />
                        </div>
                    </TabsContent>

                    <TabsContent value="groups" className="min-h-[500px]" style={{ marginTop: '100px', paddingBottom: '80px' }}>
                        <CourseGroupsList
                            schedules={course?.schedules || []}
                            courseId={courseId}
                        />
                    </TabsContent>

                    <TabsContent value="details" className="min-h-[500px]" style={{ marginTop: '100px' }}>
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <CourseDetail courseId={courseId} />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
