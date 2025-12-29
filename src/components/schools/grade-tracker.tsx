"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function GradeTracker({ courseId }: { courseId: string }) {
    const [students, setStudents] = useState<any[]>([]);
    const [grades, setGrades] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    // New assignment state
    const [assignmentName, setAssignmentName] = useState("");
    const [maxScore, setMaxScore] = useState("100");
    const [weight, setWeight] = useState("1");
    const [scores, setScores] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchData();
    }, [courseId]);

    const fetchData = async () => {
        const [studentsRes, gradesRes] = await Promise.all([
            fetch(`/api/enrollments?courseId=${courseId}`),
            fetch(`/api/grades?courseId=${courseId}`)
        ]);

        const studentsData = await studentsRes.json();
        const gradesData = await gradesRes.json();

        setStudents(studentsData.map((e: any) => e.student));
        setGrades(gradesData);
    };

    const handleSave = async () => {
        setLoading(true);
        const gradesPayload = Object.entries(scores).map(([studentId, score]) => ({
            studentId,
            score
        }));

        await fetch("/api/grades", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                courseId,
                name: assignmentName,
                maxScore,
                weight,
                grades: gradesPayload
            })
        });

        setLoading(false);
        setOpen(false);
        setAssignmentName("");
        setScores({});
        fetchData();
    };

    // Group grades by assignment name
    const assignments = Array.from(new Set(grades.map(g => g.name)));

    return (
        <div className="space-y-4 mt-6 border-t pt-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Calificaciones</h3>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" /> Nueva Tarea/Examen
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Registrar Calificaciones</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-3 gap-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nombre (Ej. Examen 1)</label>
                                <Input value={assignmentName} onChange={(e) => setAssignmentName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Puntaje Máximo</label>
                                <Input type="number" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Peso (1 = Normal)</label>
                                <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Alumnos</h4>
                            {students.map(student => (
                                <div key={student.id} className="flex items-center justify-between border p-2 rounded">
                                    <span>{student.firstName} {student.lastName}</span>
                                    <Input
                                        type="number"
                                        className="w-24"
                                        placeholder="0"
                                        value={scores[student.id] || ""}
                                        onChange={(e) => setScores({ ...scores, [student.id]: e.target.value })}
                                    />
                                </div>
                            ))}
                        </div>

                        <DialogFooter>
                            <Button onClick={handleSave} disabled={loading}>Guardar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Alumno</TableHead>
                            {assignments.map(a => (
                                <TableHead key={a} className="text-center">{a}</TableHead>
                            ))}
                            <TableHead className="text-center font-bold">Promedio</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map(student => {
                            const studentGrades = grades.filter(g => g.studentId === student.id);
                            const totalScore = studentGrades.reduce((acc, g) => acc + g.score, 0);
                            const totalMax = studentGrades.reduce((acc, g) => acc + g.maxScore, 0);
                            const average = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;

                            return (
                                <TableRow key={student.id}>
                                    <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
                                    {assignments.map(a => {
                                        const grade = studentGrades.find(g => g.name === a);
                                        return (
                                            <TableCell key={a} className="text-center">
                                                {grade ? grade.score : "-"}
                                            </TableCell>
                                        );
                                    })}
                                    <TableCell className="text-center font-bold">
                                        {average.toFixed(1)}%
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
