"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, TrendingDown, Users, Award, AlertCircle, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface StudentPerformance {
    student: {
        id: string;
        name: string;
    };
    average: number;
    hasGrades: boolean;
}

interface CourseReport {
    courseId: string;
    courseName: string;
    stats: {
        average: number;
        totalStudents: number;
        activeStudents: number;
        passingCount: number;
        failingCount: number;
        passRate: number;
    };
    students: StudentPerformance[];
}

interface Course {
    id: string;
    name: string;
}

export function AcademicPerformanceReport() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>("");
    const [reportData, setReportData] = useState<CourseReport | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (selectedCourse) {
            fetchReport();
        }
    }, [selectedCourse]);

    const fetchCourses = async () => {
        try {
            const res = await fetch("/api/courses");
            if (res.ok) {
                const data = await res.json();
                setCourses(data);
            }
        } catch (error) {
            console.error("Error fetching courses:", error);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reports/academic/performance?courseId=${selectedCourse}`);
            if (res.ok) {
                const data = await res.json();
                // API returns an array, but we are filtering by one course
                if (data.length > 0) {
                    setReportData(data[0]);
                }
            }
        } catch (error) {
            console.error("Error fetching report:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!selectedCourse) return;
        try {
            const res = await fetch(`/api/reports/academic/performance/pdf?courseId=${selectedCourse}`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `rendimiento_academico.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error("Error downloading PDF:", error);
        }
    };

    const getGradeColor = (grade: number) => {
        if (grade >= 90) return "text-green-600";
        if (grade >= 80) return "text-blue-600";
        if (grade >= 60) return "text-yellow-600";
        return "text-red-600";
    };

    const getGradeBarColor = (grade: number) => {
        if (grade >= 90) return "bg-green-500";
        if (grade >= 80) return "bg-blue-500";
        if (grade >= 60) return "bg-yellow-500";
        return "bg-red-500";
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Rendimiento Académico</h2>
                    <p className="text-muted-foreground">Análisis de calificaciones y promedios</p>
                </div>
                <div className="flex gap-2 items-center">
                    <Button variant="outline" onClick={handleDownloadPDF} disabled={!selectedCourse}>
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                    </Button>
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Seleccionar curso" />
                        </SelectTrigger>
                        <SelectContent>
                            {courses.map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                    {course.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : reportData ? (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${getGradeColor(reportData.stats.average)}`}>
                                    {reportData.stats.average}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Calificación media del grupo
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Tasa de Aprobación</CardTitle>
                                <Award className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">
                                    {reportData.stats.passRate}%
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {reportData.stats.passingCount} de {reportData.stats.activeStudents} alumnos aprobados
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Alumnos en Riesgo</CardTitle>
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">
                                    {reportData.stats.failingCount}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Alumnos con promedio menor a 60
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Evaluados</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {reportData.stats.activeStudents}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    De {reportData.stats.totalStudents} inscritos
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Student Ranking List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Ranking del Grupo</CardTitle>
                            <CardDescription>
                                Listado de alumnos ordenado por promedio actual
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {reportData.students.filter(s => s.hasGrades).map((student, index) => (
                                    <div key={student.student.id} className="flex items-center gap-4">
                                        <div className="w-8 text-center font-bold text-muted-foreground">
                                            #{index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className="font-medium">{student.student.name}</span>
                                                <span className={`font-bold ${getGradeColor(student.average)}`}>
                                                    {student.average}
                                                </span>
                                            </div>
                                            <Progress
                                                value={student.average}
                                                className="h-2"
                                                indicatorClassName={getGradeBarColor(student.average)}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {reportData.students.filter(s => !s.hasGrades).length > 0 && (
                                    <div className="pt-4 border-t">
                                        <p className="text-sm text-muted-foreground mb-2">Sin calificaciones registradas:</p>
                                        <div className="text-sm text-gray-500">
                                            {reportData.students.filter(s => !s.hasGrades).map(s => s.student.name).join(", ")}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="text-center py-12 border rounded-lg bg-muted/10">
                    <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Selecciona un curso</h3>
                    <p className="text-muted-foreground">
                        Elige un grupo para ver el análisis de rendimiento académico.
                    </p>
                </div>
            )}
        </div>
    );
}
