"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Clock, AlertTriangle, Users, BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CourseCard } from "@/components/schools/course-card";

interface DashboardData {
    courses: {
        id: string;
        name: string;
        schedule: string | null;
        room: string | null;
        studentCount: number;
        attendanceTaken: boolean;
    }[];
    recentAlerts: {
        id: string;
        content: string;
        createdAt: string;
        student: {
            firstName: string;
            lastName: string;
        };
        course?: {
            name: string;
        };
        author: {
            name: string;
        };
    }[];
    userName: string;
}

export function TeacherDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await fetch("/api/teacher/dashboard");
            if (res.ok) {
                const dashboardData = await res.json();
                setData(dashboardData);
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!data) {
        return <div>Error al cargar el dashboard.</div>;
    }

    const today = new Date();

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Hola, {data.userName} 👋</h2>
                <p className="text-muted-foreground">
                    Aquí tienes el resumen de tu día - {format(today, "EEEE d 'de' MMMM", { locale: es })}
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cursos Asignados</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.courses.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Total de materias activas
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Alumnos Totales</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.courses.reduce((acc, curr) => acc + curr.studentCount, 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            En todos tus cursos
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Asistencias Hoy</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.courses.filter(c => c.attendanceTaken).length} / {data.courses.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Cursos con asistencia tomada
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Mis Cursos</CardTitle>
                        <CardDescription>
                            Estado de asistencia para hoy
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.courses.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No tienes cursos asignados.</p>
                            ) : (
                                data.courses.map((course, index) => (
                                    <CourseCard
                                        key={course.id}
                                        gradient="from-blue-600 to-indigo-600"
                                        course={{
                                            ...course,
                                            description: null,
                                            teacher: { id: "me", name: data.userName },
                                            _count: { enrollments: course.studentCount }
                                        }}
                                        customActions={
                                            <div className="flex items-center justify-between w-full gap-2">
                                                {course.attendanceTaken ? (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Completado
                                                    </Badge>
                                                ) : (
                                                    <Link href="/dashboard/attendance" className="flex-1">
                                                        <Button size="sm" variant="outline" className="w-full text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700">
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            Tomar Asistencia
                                                        </Button>
                                                    </Link>
                                                )}
                                                <Link href={`/dashboard/courses/${course.id}`}>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        }
                                    />
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Alertas Recientes</CardTitle>
                        <CardDescription>
                            Notas de conducta de los últimos 7 días
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.recentAlerts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                    <CheckCircle className="h-8 w-8 mb-2 text-green-500" />
                                    <p>Todo en orden</p>
                                    <p className="text-xs">No hay alertas de conducta recientes</p>
                                </div>
                            ) : (
                                data.recentAlerts.map((alert) => (
                                    <div key={alert.id} className="flex gap-3 p-3 border rounded-lg bg-red-50 border-red-100">
                                        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                        <div>
                                            <div className="font-medium text-red-900">
                                                {alert.student.lastName}, {alert.student.firstName}
                                            </div>
                                            <p className="text-sm text-red-800 mt-1">
                                                {alert.content}
                                            </p>
                                            <div className="flex gap-2 mt-2 text-xs text-red-600/80">
                                                <span>{alert.course?.name}</span>
                                                <span>•</span>
                                                <span>{alert.author.name}</span>
                                                <span>•</span>
                                                <span>{format(new Date(alert.createdAt), "d MMM", { locale: es })}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
