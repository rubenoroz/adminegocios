"use client";

import { StudentNotes } from "@/components/schools/student-notes";
import { use } from "react";

export default function StudentNotesPage({ params }: { params: Promise<{ lang: string; studentId: string }> }) {
    const { studentId } = use(params);

    return (
        <div className="max-w-4xl mx-auto py-6">
            <h1 className="text-2xl font-bold mb-6">Notas del Alumno</h1>
            <StudentNotes studentId={studentId} />
        </div>
    );
}
