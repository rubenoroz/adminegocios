"use client";

import { CourseList } from "@/components/schools/course-list";
import { SchoolNavigation } from "@/components/schools/school-navigation";

export default function CoursesPage() {
    return (
        <div>
            <SchoolNavigation />
            <CourseList />
        </div>
    );
}
