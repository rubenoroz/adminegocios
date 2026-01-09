import { getDictionary } from "@/lib/dictionaries";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BillingProfilesManager } from "@/components/settings/billing-profiles-manager";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BillingProfilesPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang as any);
    const session = await getServerSession(authOptions);

    if (!session?.user?.businessId) {
        return (
            <div className="bg-slate-100 pb-16 min-h-screen flex items-center justify-center">
                <p className="text-slate-500">No tienes acceso a esta página.</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-100 pb-16 min-h-screen">
            {/* HEADER */}
            <div style={{
                padding: 'var(--spacing-lg)',
                marginBottom: '32px',
                position: 'relative',
                zIndex: 10
            }}>
                <Link
                    href={`/${lang}/dashboard/settings`}
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Volver a Configuración
                </Link>
                <div className="flex items-center gap-4">
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        boxShadow: '0 4px 15px rgba(139, 92, 246, 0.35)'
                    }}>
                        <FileText size={28} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-1">
                            Clientes de Facturación
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Administra los datos fiscales y vincula a estudiantes
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ padding: '0 var(--spacing-lg)' }}>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-6">
                    <BillingProfilesManager />
                </div>
            </div>
        </div>
    );
}
