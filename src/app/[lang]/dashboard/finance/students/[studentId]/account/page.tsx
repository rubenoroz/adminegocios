"use client";

import { StudentAccount } from "@/components/finance/student-account";
import { use } from "react";

export default function StudentAccountPage({ params }: { params: Promise<{ lang: string; studentId: string }> }) {
    const { studentId } = use(params);

    return <StudentAccount studentId={studentId} />;
}
