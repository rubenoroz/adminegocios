import { getDictionary } from "@/lib/dictionaries";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { BrandingSettings } from "@/components/settings/branding-settings";
import { UserManagement } from "@/components/settings/user-management";
import { PayrollSettings } from "@/components/settings/payroll-settings";
import { AcademicSettings } from "@/components/settings/academic-settings";
import { Settings, Building, Palette, Wallet, GraduationCap, Users } from "lucide-react";

export default async function SettingsPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang as any);
    const session = await getServerSession(authOptions);

    if (!session?.user?.businessId) {
        return <div>Error: No business found</div>;
    }

    const business = await prisma.business.findUnique({
        where: { id: session.user.businessId }
    });

    const t = dict.settings;
    const isOwnerOrAdmin = session.user.role === "OWNER" || session.user.role === "ADMIN";

    return (
        <div className="bg-slate-100 pb-16 min-h-screen">
            {/* HEADER */}
            <div style={{
                padding: 'var(--spacing-lg)',
                marginBottom: '32px',
                position: 'relative',
                zIndex: 10
            }}>
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
                        {t.title}
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Administra tu negocio, sucursales y preferencias
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8" style={{ padding: '0 var(--spacing-lg)' }}>

                {/* Business Info Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-bold text-lg text-slate-800">{t.businessInfo}</h3>
                        <p className="text-sm text-slate-500">Información general de tu empresa</p>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">{t.businessName}</label>
                                <Input defaultValue={business?.name} disabled className="bg-slate-50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">{t.businessType}</label>
                                <Input defaultValue={dict.businessTypes[business?.type?.toLowerCase() as keyof typeof dict.businessTypes] || business?.type} disabled className="bg-slate-50" />
                            </div>
                        </div>

                        <div style={{ marginTop: '24px' }}>
                            <Link href={`/${lang}/dashboard/settings/branches`} className="button-modern bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-800 hover:to-slate-700 inline-flex items-center gap-2" style={{ borderRadius: '8px' }}>
                                <Settings className="h-4 w-4" />
                                {t.manageBranches}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Other Settings Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="font-bold text-lg text-slate-800">Apariencia</h3>
                            </div>
                            <div className="p-6">
                                <BrandingSettings />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="font-bold text-lg text-slate-800">Nómina y Finanzas</h3>
                            </div>
                            <div className="p-6">
                                <PayrollSettings
                                    initialExpenseReserve={business?.expenseReservePercentage || 0}
                                    initialBenefitsReserve={business?.benefitsReservePercentage || 0}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="font-bold text-lg text-slate-800">Configuración Académica</h3>
                            </div>
                            <div className="p-6">
                                <AcademicSettings />
                            </div>
                        </div>

                        {isOwnerOrAdmin && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="font-bold text-lg text-slate-800">Gestión de Usuarios</h3>
                                </div>
                                <div className="p-6">
                                    <UserManagement />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
