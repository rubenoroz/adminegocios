"use client";

import { ParentAccountsManager } from "@/components/parents/parent-accounts-manager";
import { SchoolNavigation } from "@/components/schools/school-navigation";

export default function ParentAccountsPage() {
    return (
        <div>
            <SchoolNavigation />
            <ParentAccountsManager />
        </div>
    );
}
