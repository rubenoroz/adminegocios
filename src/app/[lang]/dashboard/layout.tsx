import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { OfflineIndicator } from "@/components/offline-indicator";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BranchProvider } from "@/context/branch-context";
import { prisma } from "@/lib/prisma";
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

    // Obtener branding completo del usuario en el servidor
    let sidebarColor = "#1e293b";
    let primaryColor = "#3b82f6";
    let businessType = "";
    let userRole = session.user?.role || "";
    let logoUrl: string | null = null;
    let logoOrientation = "SQUARE";
    let logoHeight = 64;

    if (session.user?.businessId) {
        try {
            const business = await prisma.business.findUnique({
                where: { id: session.user.businessId },
                select: {
                    sidebarColor: true,
                    primaryColor: true,
                    type: true,
                    logoUrl: true,
                    logoOrientation: true,
                    logoHeight: true
                }
            });
            if (business?.sidebarColor) sidebarColor = business.sidebarColor;
            if (business?.primaryColor) primaryColor = business.primaryColor;
            if (business?.type) businessType = business.type;
            if (business?.logoUrl) logoUrl = business.logoUrl;
            if (business?.logoOrientation) logoOrientation = business.logoOrientation;
            if (business?.logoHeight) logoHeight = business.logoHeight;
        } catch (error) {
            console.error("Error fetching branding:", error);
        }
    }

    return (
        <BranchProvider>
            <style dangerouslySetInnerHTML={{
                __html: `
                :root {
                    --sidebar-bg: ${sidebarColor};
                    --primary-color: ${primaryColor};
                }
            `}} />
            <div className="h-full relative" style={{ backgroundColor: '#f0fdf4' }}>
                {/* Desktop Sidebar */}
                <div
                    className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-80"
                    style={{ backgroundColor: sidebarColor }}
                >
                    <Sidebar
                        dict={dict}
                        serverBusinessType={businessType}
                        serverRole={userRole}
                        serverLogoUrl={logoUrl}
                        serverLogoOrientation={logoOrientation as "HORIZONTAL" | "VERTICAL" | "SQUARE"}
                        serverLogoHeight={logoHeight}
                    />
                </div>

                {/* Main content */}
                <main className="md:pl-72 h-full">
                    <Topbar
                        dict={dict}
                        serverBusinessType={businessType}
                        serverRole={userRole}
                        serverLogoUrl={logoUrl}
                        serverLogoOrientation={logoOrientation as "HORIZONTAL" | "VERTICAL" | "SQUARE"}
                        serverLogoHeight={logoHeight}
                        sidebarColor={sidebarColor}
                    />
                    <div className="p-4 sm:p-6 lg:p-8">
                        {children}
                    </div>
                    <OfflineIndicator />
                </main>
            </div>
        </BranchProvider>
    );
}
