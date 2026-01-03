"use client";

import { CommunicationHub } from "@/components/schools/communication-hub";
import { SchoolNavigation } from "@/components/schools/school-navigation";

export default function CommunicationPage() {
    return (
        <div>
            <SchoolNavigation />
            <CommunicationHub />
        </div>
    );
}
