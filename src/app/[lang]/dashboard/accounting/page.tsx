"use client";

import { AccountingDashboard } from "@/components/accounting/accounting-dashboard";

export default function AccountingPage() {
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
                        Contabilidad
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Resumen financiero, ingresos y gastos
                    </p>
                </div>
            </div>

            <div style={{ padding: '0 var(--spacing-lg)' }}>
                <AccountingDashboard />
            </div>
        </div>
    );
}
