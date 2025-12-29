"use client";

import { DataImporter } from "@/components/data/data-importer";
import { UploadCloud } from "lucide-react";

export default function ImportPage() {
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
                        Importación de Datos
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Carga masiva de alumnos, maestros y cursos desde Excel/CSV
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto" style={{ padding: '0 var(--spacing-lg)' }}>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-8">
                    <DataImporter />
                </div>
            </div>
        </div>
    );
}
