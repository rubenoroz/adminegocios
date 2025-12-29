"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import { useBranch } from "@/context/branch-context";

export function FeeScheduler() {
    const { selectedBranch } = useBranch();
    const [generating, setGenerating] = useState(false);
    const [checking, setChecking] = useState(false);
    const [result, setResult] = useState<{ type: string; message: string } | null>(null);

    const handleGenerateFees = async () => {
        if (!selectedBranch?.businessId) return;

        setGenerating(true);
        setResult(null);

        try {
            const response = await fetch("/api/finance/fees/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ businessId: selectedBranch.businessId })
            });

            const data = await response.json();

            if (response.ok) {
                setResult({
                    type: "success",
                    message: `Se generaron ${data.generatedCount} cargos exitosamente.`
                });
            } else {
                setResult({
                    type: "error",
                    message: "Error al generar cargos."
                });
            }
        } catch (error) {
            setResult({
                type: "error",
                message: "Error de conexión."
            });
        } finally {
            setGenerating(false);
        }
    };

    const handleCheckOverdue = async () => {
        if (!selectedBranch?.businessId) return;

        setChecking(true);
        setResult(null);

        try {
            const response = await fetch("/api/finance/fees/check-overdue", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ businessId: selectedBranch.businessId })
            });

            const data = await response.json();

            if (response.ok) {
                setResult({
                    type: "success",
                    message: `Se actualizaron ${data.updatedCount} cargos vencidos.`
                });
            } else {
                setResult({
                    type: "error",
                    message: "Error al verificar vencimientos."
                });
            }
        } catch (error) {
            setResult({
                type: "error",
                message: "Error de conexión."
            });
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Programación de Cargos</CardTitle>
                    <CardDescription>
                        Genera cargos mensuales automáticamente y verifica pagos vencidos
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                            onClick={handleGenerateFees}
                            disabled={generating || !selectedBranch}
                            className="w-full"
                        >
                            <Calendar className="mr-2 h-4 w-4" />
                            {generating ? "Generando..." : "Generar Cargos del Mes"}
                        </Button>

                        <Button
                            onClick={handleCheckOverdue}
                            disabled={checking || !selectedBranch}
                            variant="outline"
                            className="w-full"
                        >
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            {checking ? "Verificando..." : "Verificar Vencidos"}
                        </Button>
                    </div>

                    {result && (
                        <div
                            className={`p-4 rounded-lg flex items-center gap-2 ${result.type === "success"
                                    ? "bg-green-50 text-green-800 border border-green-200"
                                    : "bg-red-50 text-red-800 border border-red-200"
                                }`}
                        >
                            {result.type === "success" ? (
                                <CheckCircle className="h-5 w-5" />
                            ) : (
                                <AlertTriangle className="h-5 w-5" />
                            )}
                            <span>{result.message}</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
