import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { OfflineIndicator } from "@/components/offline-indicator";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BranchProvider } from "@/context/branch-context";

import { getDictionary } from "@/lib/dictionaries";

export default async function DashboardLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}) {
    const session = await getServerSession(authOptions);
    const { lang } = await params;
    const dict = await getDictionary(lang as any);

    if (!session) {
        redirect(`/${lang}/login`);
    }

    return (
        <BranchProvider>
            <div className="h-full relative">
                <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-80 bg-gray-900">
                    <Sidebar dict={dict} />
                </div>
                <main className="md:pl-72 h-full">
                    <Topbar dict={dict} />
                    <div className="p-8">
                        {children}
                    </div>
                    <OfflineIndicator />
                </main>
            </div>
        </BranchProvider>
    );
}
