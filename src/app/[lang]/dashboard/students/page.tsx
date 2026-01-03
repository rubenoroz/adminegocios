"use client";

import { StudentList } from "@/components/schools/student-list";
import { SchoolNavigation } from "@/components/schools/school-navigation";

export default function StudentsPage() {
    return (
        <div>
            <SchoolNavigation />
            <StudentList />
        </div>
    );
}
