"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface Student {
    id: string;
    firstName: string;
    lastName: string;
    matricula: string;
}

interface GradeRecord {
    id?: string;
    type: string;
    value: number;
    studentId: string;
}

interface GradesTableProps {
    courseId: string;
    period: string;
    config?: any;
}

// Default criteria for grades
const CRITERIA = [
    { key: "EXAM", label: "Examen", weight: 0.4 },
    { key: "HOMEWORK", label: "Tareas", weight: 0.3 },
    { key: "PROJECT", label: "Proyecto", weight: 0.3 }
];

export function GradesTable({ courseId, period, config }: GradesTableProps) {
    const { toast } = useToast();
    const [students, setStudents] = useState<Student[]>([]);
    const [grades, setGrades] = useState<Record<string, Record<string, number>>>({}); // studentId -> type -> value
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Fallback if config not yet loaded
    const periods = config?.periods || [];

    useEffect(() => {
        loadData();
    }, [courseId, period]);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Get Students
            const studentsRes = await fetch(`/api/courses/${courseId}/students`);
            if (!studentsRes.ok) throw new Error("Failed to load students");
            const studentsData = await studentsRes.json();
            setStudents(studentsData);

            // 2. Get Existing Grades
            const gradesRes = await fetch(`/api/grades?courseId=${courseId}&period=${period}`);
            if (gradesRes.ok) {
                const gradesData: GradeRecord[] = await gradesRes.json();
                const gradesMap: Record<string, Record<string, number>> = {};

                studentsData.forEach((s: Student) => { gradesMap[s.id] = {}; });

                gradesData.forEach(g => {
                    if (gradesMap[g.studentId]) {
                        gradesMap[g.studentId][g.type] = g.value;
                    }
                });
                setGrades(gradesMap);
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error al cargar datos", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (studentId: string, type: string, value: string) => {
        const numValue = parseFloat(value);
        if (value === "") {
            const newGrades = { ...grades };
            delete newGrades[studentId][type];
            setGrades(newGrades);
            return;
        }

        if (isNaN(numValue) || numValue < 0 || numValue > 100) return;

        setGrades(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [type]: numValue
            }
        }));
    };

    const calculateAverage = (studentId: string) => {
        const studentGrades = grades[studentId] || {};
        let total = 0;
        let totalWeight = 0;

        // Note: The logic here depends on what the columns represent.
        // If "periods" are actually the columns (Exam, Homework, etc), we use it.
        // BUT wait. In the previous static code `CRITERIA` was [Exam, Homework, Project].
        // The `gradingConfig.periods` I designed was [Partial 1, Partial 2, Final].
        // This is a mismatch in my mental model.
        // The user request was "configurar si van a ser parciales, mensulaes, etc".
        // This usually refers to the "Evaluation Periods" (The dropdown selection).
        // INSIDE a period, we usually have "Criteria" (Exam, Homework).

        // IF the user meant "configure the criteria inside a period", that's one thing.
        // IF the user meant "configure the periods themselves" (Dropdown), that's another.
        // The user said: "si van a ser parciales y final... o si va a ser mensual".
        // This strongly suggests configuring the *Dropdown* options (Periods).

        // HOWEVER, `GradesTable` rendered `CRITERIA` (Exam, Homework) as columns.
        // Does the user also want to configure the columns?
        // Usually yes. But let's assume valid criteria for now.

        // WAIT. If I select "Parcial 1", what columns do I see?
        // In the static code `CRITERIA` was [Exam, Homework...].
        // The previous code had `selectedPeriod` prop.
        // So `GradesTable` shows the breakdown for ONE selected period.

        // So `config.periods` configured the DROPDOWN in GradesPage.
        // `GradesTable` needs to know the CRITERIA columns.
        // I haven't added `config.criteria` to the schema/JSON.
        // I likely missed that requirement or assumed standard criteria.

        // Let's look at `CRITERIA` in existing code:
        // const CRITERIA = [ { key: "EXAM" ... }, { key: "HOMEWORK" ... } ];

        // If I don't make THIS configurable, the table will still show "Exam, Homework, Project".
        // Is that what the user wants?
        // The user specifically talked about "Periods" (Parcial y Final vs Mensual).
        // So my layout in `GradesPage` (updated Dropdown) is correct.

        // But `GradesTable` columns...
        // If `GradesTable` logic remains `CRITERIA`, then it works for ANY selected period.
        // The `calculateAverage` logic iterates `CRITERIA`.

        // SO, I don't necessarily need to change `GradesTable` columns UNLESS the user also wants custom criteria.
        // The user request: "configuracion de la evaluación... si van a ser parciales y final... si va a ser calificacion mensual".
        // This confirms `GradesPage` Dropdown is the key.

        // BUT, what about `GradesTable`? It takes `period` as prop.
        // It saves grades with `type` (Exam, Homework) and `period` (P1, P2).
        // So `GradesTable` is mostly fine as is, using static `CRITERIA`.

        // Wait, did I misinterpret?
        // If the user selects "Month 1", the table shows Exam/Homework for Month 1.
        // If the user selects "Month 2", the table shows Exam/Homework for Month 2.
        // This seems correct.

        // So `GradesTable` doesn't need huge refactoring, EXCEPT maybe ensuring `calculateAverage` is robust.
        // AND `calculateAverage` in the TABLE is for the specific period (columns average).
        // It does NOT calculate the final course grade (average of periods).
        // That would be a separate view.

        // So `GradesTable` can keep `CRITERIA` static for now unless I add "Evaluation Criteria" to the config too.
        // I'll stick to static `CRITERIA` inside the table for now to keep it simple, 
        // OR I can add a quick `criteria` array to the default config I created in the API 
        // so it's fully ready for future config, even if the UI doesn't edit it yet.

        // Let's modify `GradesTable` to accept `criteria` from config if available, or fallback to static.
        // This makes it future proof.

        return total.toFixed(1);
    };

    // Use config criteria or default
    const currentCriteria = config?.criteria || CRITERIA;

    const handleSave = async () => {
        setSaving(true);
        try {
            const promises: Promise<any>[] = [];
            Object.entries(grades).forEach(([studentId, criterionMap]) => {
                Object.entries(criterionMap).forEach(([type, value]) => {
                    promises.push(
                        fetch("/api/grades", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                studentId,
                                courseId,
                                period,
                                type,
                                value,
                                maxValue: 100,
                                weight: currentCriteria.find((c: any) => c.key === type)?.weight || 0
                            })
                        })
                    );
                });
            });
            await Promise.all(promises);
            toast({ title: "Calificaciones guardadas exitosamente" });
        } catch (error) {
            console.error(error);
            toast({ title: "Error al guardar", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
    if (students.length === 0) return <div className="text-center p-8 text-slate-500">No hay alumnos inscritos.</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-end items-center mb-2 px-6 py-4">
                <button onClick={handleSave} disabled={saving} className="button-modern bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 flex items-center gap-2 disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Guardar Calificaciones
                </button>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/80 border-b border-slate-100">
                            <TableHead className="py-5 w-[250px] font-bold text-slate-700 pl-6">Alumno</TableHead>
                            {currentCriteria.map((c: any) => (
                                <TableHead key={c.key} className="text-center font-bold text-slate-700 py-5">{c.label}</TableHead>
                            ))}
                            <TableHead className="text-center font-bold text-slate-800 bg-slate-100/50 py-5">Promedio</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map((student, index) => {
                            // Calculate average inline or via function
                            const studentGrades = grades[student.id] || {};
                            let total = 0;
                            // let totalWeight = 0;
                            currentCriteria.forEach((c: any) => {
                                const val = studentGrades[c.key];
                                if (val !== undefined) total += val * c.weight;
                            });
                            const avg = total.toFixed(1);

                            return (
                                <TableRow
                                    key={student.id}
                                    className="hover:bg-slate-50/30 border-slate-100 group transition-colors"
                                    style={{ backgroundColor: index % 2 === 1 ? '#F8FAFC' : '#FFFFFF' }}
                                >
                                    <TableCell className="font-medium text-slate-900 py-4 pl-6">
                                        {student.firstName} {student.lastName}
                                        <div className="text-xs text-slate-500 font-medium opacity-70 mt-0.5">{student.matricula}</div>
                                    </TableCell>
                                    {currentCriteria.map((c: any) => (
                                        <TableCell key={c.key} className="p-2 text-center">
                                            <Input
                                                type="number"
                                                className="text-center h-10 w-24 mx-auto bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm rounded-lg font-medium text-slate-700 transition-all placeholder:text-slate-300"
                                                placeholder="-"
                                                min="0" max="100"
                                                value={grades[student.id]?.[c.key] ?? ""}
                                                onChange={(e) => handleInputChange(student.id, c.key, e.target.value)}
                                            />
                                        </TableCell>
                                    ))}
                                    <TableCell className="text-center py-4">
                                        <div className={cn(
                                            "inline-flex items-center justify-center w-14 h-9 rounded-lg font-bold text-sm shadow-sm",
                                            parseFloat(avg) >= config?.passingGrade || 70 ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
                                        )}>
                                            {avg}
                                        </div>
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
