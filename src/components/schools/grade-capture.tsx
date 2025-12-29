"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Save, Calculator } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

interface Course {
    id: string;
    name: string;
}

interface Student {
    id: string;
    firstName: string;
    lastName: string;
    matricula: string;
}

interface GradeData {
    studentId: string;
    type: string;
    value: string;
}

const PERIODS = [
    { value: "PARTIAL_1", label: "Parcial 1" },
    { value: "PARTIAL_2", label: "Parcial 2" },
    { value: "PARTIAL_3", label: "Parcial 3" },
    { value: "FINAL", label: "Final" },
];

const GRADE_TYPES = [
    { value: "EXAM", label: "Examen", weight: 40 },
    { value: "HOMEWORK", label: "Tareas", weight: 20 },
    { value: "PROJECT", label: "Proyecto", weight: 30 },
    { value: "PARTICIPATION", label: "Participación", weight: 10 },
];

export function GradeCapture() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState("");
    const [selectedPeriod, setSelectedPeriod] = useState("PARTIAL_1");
    const [students, setStudents] = useState<Student[]>([]);
    const [grades, setGrades] = useState<Map<string, Map<string, string>>>(new Map());
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (selectedCourse) {
            fetchCourseStudents();
            fetchExistingGrades();
        }
    }, [selectedCourse, selectedPeriod]);

    const fetchCourses = async () => {
        try {
            const res = await fetch("/api/courses");
            if (res.ok) {
                const data = await res.json();
                setCourses(data);
            }
        } catch (error) {
            console.error("Failed to fetch courses", error);
        }
    };

    const fetchCourseStudents = async () => {
        try {
            const res = await fetch(`/api/courses/${selectedCourse}`);
            if (res.ok) {
                const data = await res.json();
                const enrolledStudents = data.enrollments?.map((e: any) => e.student) || [];
                enrolledStudents.sort((a: Student, b: Student) =>
                    a.lastName.localeCompare(b.lastName)
                );
                setStudents(enrolledStudents);
            }
        } catch (error) {
            console.error("Failed to fetch students", error);
        }
    };

    const fetchExistingGrades = async () => {
        try {
            const res = await fetch(
                `/api/grades?courseId=${selectedCourse}&period=${selectedPeriod}`
            );
            if (res.ok) {
                const data = await res.json();
                const gradeMap = new Map<string, Map<string, string>>();

                data.forEach((grade: any) => {
                    if (!gradeMap.has(grade.studentId)) {
                        gradeMap.set(grade.studentId, new Map());
                    }
                    gradeMap.get(grade.studentId)!.set(grade.type, grade.value.toString());
                });

                setGrades(gradeMap);
            }
        } catch (error) {
            console.error("Failed to fetch grades", error);
        }
    };

    const handleGradeChange = (studentId: string, type: string, value: string) => {
        setGrades((prev) => {
            const newMap = new Map(prev);
            if (!newMap.has(studentId)) {
                newMap.set(studentId, new Map());
            }
            newMap.get(studentId)!.set(type, value);
            return newMap;
        });
    };

    const calculateAverage = (studentId: string): number => {
        const studentGrades = grades.get(studentId);
        if (!studentGrades || studentGrades.size === 0) return 0;

        let totalWeighted = 0;
        let totalWeight = 0;

        GRADE_TYPES.forEach((gradeType) => {
            const value = studentGrades.get(gradeType.value);
            if (value && value !== "") {
                totalWeighted += parseFloat(value) * gradeType.weight;
                totalWeight += gradeType.weight;
            }
        });

        return totalWeight > 0 ? totalWeighted / totalWeight : 0;
    };

    const handleSaveGrades = async () => {
        if (!selectedCourse) {
            toast({
                title: "Error",
                description: "Selecciona un curso",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const gradesList: any[] = [];

            grades.forEach((studentGrades, studentId) => {
                studentGrades.forEach((value, type) => {
                    if (value && value !== "") {
                        gradesList.push({
                            studentId,
                            type,
                            value: parseFloat(value),
                            maxValue: 100,
                            weight: GRADE_TYPES.find((t) => t.value === type)?.weight,
                        });
                    }
                });
            });

            if (gradesList.length === 0) {
                toast({
                    title: "Error",
                    description: "Captura al menos una calificación",
                    variant: "destructive",
                });
                setLoading(false);
                return;
            }

            const res = await fetch("/api/grades/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    courseId: selectedCourse,
                    period: selectedPeriod,
                    grades: gradesList,
                }),
            });

            if (res.ok) {
                toast({
                    title: "Calificaciones guardadas",
                    description: `Se guardaron ${gradesList.length} calificación(es)`,
                });
            } else {
                toast({
                    title: "Error",
                    description: "No se pudieron guardar las calificaciones",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Ocurrió un error",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Captura de Calificaciones</h2>
                <p className="text-muted-foreground">
                    Registra las calificaciones de tus alumnos por período
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Seleccionar Curso y Período</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Curso</Label>
                            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un curso" />
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
                        <div className="space-y-2">
                            <Label>Período</Label>
                            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PERIODS.map((period) => (
                                        <SelectItem key={period.value} value={period.value}>
                                            {period.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {selectedCourse && students.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Calificaciones</CardTitle>
                                <CardDescription>
                                    {students.length} alumno(s) inscritos
                                </CardDescription>
                            </div>
                            <Button onClick={handleSaveGrades} disabled={loading}>
                                <Save className="h-4 w-4 mr-2" />
                                {loading ? "Guardando..." : "Guardar Calificaciones"}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[200px]">Alumno</TableHead>
                                        {GRADE_TYPES.map((type) => (
                                            <TableHead key={type.value} className="text-center">
                                                <div>{type.label}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {type.weight}%
                                                </div>
                                            </TableHead>
                                        ))}
                                        <TableHead className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Calculator className="h-3 w-3" />
                                                Promedio
                                            </div>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map((student) => {
                                        const average = calculateAverage(student.id);
                                        return (
                                            <TableRow key={student.id}>
                                                <TableCell className="font-medium">
                                                    {student.lastName}, {student.firstName}
                                                </TableCell>
                                                {GRADE_TYPES.map((type) => (
                                                    <TableCell key={type.value}>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.1"
                                                            value={grades.get(student.id)?.get(type.value) || ""}
                                                            onChange={(e) =>
                                                                handleGradeChange(student.id, type.value, e.target.value)
                                                            }
                                                            className="w-20 text-center"
                                                            placeholder="0-100"
                                                        />
                                                    </TableCell>
                                                ))}
                                                <TableCell className="text-center">
                                                    <Badge
                                                        className={
                                                            average >= 70
                                                                ? "bg-green-500"
                                                                : average >= 60
                                                                    ? "bg-yellow-500"
                                                                    : average > 0
                                                                        ? "bg-red-500"
                                                                        : "bg-gray-500"
                                                        }
                                                    >
                                                        {average > 0 ? average.toFixed(1) : "-"}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {selectedCourse && students.length === 0 && (
                <Card>
                    <CardContent className="py-8">
                        <div className="text-center text-muted-foreground">
                            No hay alumnos inscritos en este curso
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
