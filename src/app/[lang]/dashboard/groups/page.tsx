"use client";

import { GroupsList } from "@/components/schools/groups-list";
import { SchoolNavigation } from "@/components/schools/school-navigation";

export default function GroupsPage() {
    return (
        <div>
            <SchoolNavigation />
            <GroupsList />
        </div>
    );
}
