"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { SimpleDropdown } from "@/components/ui/simple-dropdown";

export function EnrollmentManager({ courseId }: { courseId: string }) {
    const [students, setStudents] = useState<any[]>([]);
    const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);

    useEffect(() => {
        fetchStudents();
        fetchEnrollments();
    }, [courseId]);

    const fetchStudents = async () => {
        const res = await fetch("/api/students");
        const data = await res.json();
        setStudents(data);
    };

    const fetchEnrollments = async () => {
        const res = await fetch(`/api/enrollments?courseId=${courseId}`);
        const data = await res.json();
        setEnrolledStudents(data.map((e: any) => e.student));
    };

    const handleEnroll = async (studentId: string) => {
        await fetch("/api/enrollments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentId, courseId })
        });
        fetchEnrollments();
    };

    // Filtrar estudiantes que no están inscritos
    const availableStudents = students
        .filter(s => !enrolledStudents.find(e => e.id === s.id))
        .map(student => ({
            value: student.id,
            label: `${student.firstName} ${student.lastName}`
        }));

    return (
        <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Alumnos Inscritos ({enrolledStudents.length})</h3>
            <div className="flex flex-wrap gap-2 mb-4">
                {enrolledStudents.map((student) => (
                    <div key={student.id} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center">
                        {student.firstName} {student.lastName}
                    </div>
                ))}
            </div>

            <SimpleDropdown
                trigger={
                    <Button variant="outline" className="w-[200px] justify-between">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Inscribir Alumno
                    </Button>
                }
                options={availableStudents}
                onSelect={handleEnroll}
                searchPlaceholder="Buscar alumno..."
                emptyMessage="No hay alumnos disponibles"
            />
        </div>
    );
}
