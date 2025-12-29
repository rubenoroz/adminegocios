"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface PayrollSettingsProps {
    initialExpenseReserve: number;
    initialBenefitsReserve: number;
}

export function PayrollSettings({ initialExpenseReserve, initialBenefitsReserve }: PayrollSettingsProps) {
    const [expenseReserve, setExpenseReserve] = useState(initialExpenseReserve);
    const [benefitsReserve, setBenefitsReserve] = useState(initialBenefitsReserve);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/business/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    expenseReservePercentage: expenseReserve,
                    benefitsReservePercentage: benefitsReserve
                })
            });

            if (!res.ok) throw new Error("Failed to update settings");

            toast({
                title: "Configuración actualizada",
                description: "Los porcentajes de nómina se han guardado correctamente.",
            });
            router.refresh();
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo guardar la configuración.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Configuración de Nómina</CardTitle>
                <CardDescription>
                    Define los porcentajes de reserva para el cálculo de nómina de maestros por comisión.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Reserva para Gastos Inesperados (%)</label>
                        <Input
                            type="number"
                            min="0"
                            max="100"
                            value={expenseReserve}
                            onChange={(e) => setExpenseReserve(parseFloat(e.target.value) || 0)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Porcentaje descontado del ingreso bruto para cubrir imprevistos.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Reserva para Prestaciones/Aguinaldo (%)</label>
                        <Input
                            type="number"
                            min="0"
                            max="100"
                            value={benefitsReserve}
                            onChange={(e) => setBenefitsReserve(parseFloat(e.target.value) || 0)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Porcentaje reservado para pagos de fin de año y beneficios.
                        </p>
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#059669',
                            color: 'white',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: loading ? 'wait' : 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? "Guardando..." : "Guardar Cambios"}
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}
