"use client";

import { EmployeeList } from "@/components/employees/employee-list";
import { SchoolNavigation } from "@/components/schools/school-navigation";

export default function EmployeesPage() {
    return (
        <div>
            <SchoolNavigation />
            <EmployeeList />
        </div>
    );
}
