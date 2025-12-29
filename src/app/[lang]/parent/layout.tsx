"use client";

import ParentPortalLayout from "@/components/parents/parent-portal-layout";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
    return <ParentPortalLayout>{children}</ParentPortalLayout>;
}
