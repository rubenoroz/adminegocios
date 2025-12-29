"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Period {
    key: string;
    label: string;
    short: string;
    weight: number;
}

interface GradingConfig {
    periods: Period[];
    passingGrade: number;
}

export function AcademicSettings() {
    const { toast } = useToast();
    const [config, setConfig] = useState<GradingConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch("/api/settings/academic");
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!config) return;
        setSaving(true);
        try {
            // Validate weights sum to 1 (roughly) - only if there are periods
            if (config.periods.length > 0) {
                const totalWeight = config.periods.reduce((acc, p) => acc + p.weight, 0);
                if (Math.abs(totalWeight - 1) > 0.01) {
                    toast({
                        title: "Advertencia de Porcentajes",
                        description: `La suma de pesos es ${(totalWeight * 100).toFixed(0)}%, debería ser 100%`,
                        variant: "destructive"
                    });
                }
            }

            const res = await fetch("/api/settings/academic", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config)
            });

            if (res.ok) {
                toast({ title: "Configuración guardada correctamente" });
            } else {
                throw new Error("Failed to save");
            }
        } catch (error) {
            toast({ title: "Error al guardar", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const addPeriod = () => {
        if (!config) return;
        const count = config.periods.length + 1;
        const newPeriod: Period = {
            key: `PERIOD_${Date.now()}`,
            label: `Periodo ${count}`,
            short: `P${count}`,
            weight: 0
        };
        setConfig({ ...config, periods: [...config.periods, newPeriod] });
    };

    const removePeriod = (index: number) => {
        if (!config) return;
        const newPeriods = [...config.periods];
        newPeriods.splice(index, 1);
        setConfig({ ...config, periods: newPeriods });
    };

    const updatePeriod = (index: number, field: keyof Period, value: string | number) => {
        if (!config) return;
        const newPeriods = [...config.periods];
        newPeriods[index] = { ...newPeriods[index], [field]: value };
        setConfig({ ...config, periods: newPeriods });
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <Loader2 style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    if (!config) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', margin: 0 }}>
                    Evaluaciones y Periodos
                </h3>
                <p style={{ fontSize: '14px', color: '#64748B', margin: '4px 0 0' }}>
                    Define la estructura de calificaciones para tus cursos.
                </p>
            </div>

            {/* Info note */}
            <div style={{
                padding: '12px 16px',
                backgroundColor: '#F0F9FF',
                borderRadius: '8px',
                border: '1px solid #BAE6FD',
                fontSize: '13px',
                color: '#0369A1'
            }}>
                💡 Algunas escuelas no manejan periodos de evaluación. Si tu escuela evalúa el progreso continuo sin parciales, puedes dejar esta sección vacía.
            </div>

            {/* Periods header with add button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                    Periodos de Evaluación ({config.periods.length})
                </span>
                <button
                    type="button"
                    onClick={addPeriod}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        backgroundColor: '#2563EB',
                        color: 'white',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    <Plus style={{ width: '14px', height: '14px' }} />
                    Agregar Periodo
                </button>
            </div>

            {/* Periods list */}
            {config.periods.length === 0 ? (
                <div style={{
                    padding: '32px',
                    textAlign: 'center',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '12px',
                    border: '2px dashed #E2E8F0'
                }}>
                    <p style={{ color: '#64748B', margin: 0 }}>
                        No hay periodos configurados. Haz clic en "Agregar Periodo" para comenzar.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {config.periods.map((period, index) => (
                        <div
                            key={period.key}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                padding: '16px',
                                backgroundColor: '#F8FAFC',
                                borderRadius: '12px',
                                border: '1px solid #E2E8F0'
                            }}
                        >
                            {/* Period number badge */}
                            <div style={{
                                width: '32px',
                                height: '32px',
                                backgroundColor: '#DBEAFE',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                color: '#2563EB',
                                fontSize: '14px',
                                flexShrink: 0
                            }}>
                                {index + 1}
                            </div>

                            {/* Fields */}
                            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>
                                        Nombre
                                    </label>
                                    <Input
                                        value={period.label}
                                        onChange={(e) => updatePeriod(index, 'label', e.target.value)}
                                        style={{ height: '36px', backgroundColor: 'white' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>
                                        Etiqueta Corta
                                    </label>
                                    <Input
                                        value={period.short}
                                        onChange={(e) => updatePeriod(index, 'short', e.target.value)}
                                        style={{ height: '36px', backgroundColor: 'white' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>
                                        Porcentaje (%)
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={period.weight}
                                        onChange={(e) => updatePeriod(index, 'weight', parseFloat(e.target.value) || 0)}
                                        style={{ height: '36px', backgroundColor: 'white' }}
                                    />
                                </div>
                            </div>

                            {/* Delete button */}
                            <button
                                type="button"
                                onClick={() => removePeriod(index)}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    backgroundColor: '#FEE2E2',
                                    borderRadius: '8px',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    flexShrink: 0
                                }}
                            >
                                <X style={{ width: '16px', height: '16px', color: '#DC2626' }} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Footer with total and save */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '16px',
                borderTop: '1px solid #E2E8F0'
            }}>
                <div style={{ fontSize: '14px', color: '#64748B' }}>
                    {config.periods.length > 0 && (
                        <span>
                            Total: <strong style={{ color: config.periods.reduce((a, b) => a + b.weight, 0) === 1 ? '#059669' : '#DC2626' }}>
                                {(config.periods.reduce((a, b) => a + b.weight, 0) * 100).toFixed(0)}%
                            </strong>
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        backgroundColor: '#059669',
                        color: 'white',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: saving ? 'wait' : 'pointer',
                        opacity: saving ? 0.7 : 1
                    }}
                >
                    {saving && <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />}
                    Guardar Estructura
                </button>
            </div>
        </div>
    );
}
