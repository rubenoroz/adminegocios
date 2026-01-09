"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Users, DollarSign, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useBranch } from "@/context/branch-context";
import { useToast } from "@/components/ui/use-toast";

interface GenerateFeesModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function GenerateFeesModal({ open, onOpenChange, onSuccess }: GenerateFeesModalProps) {
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    // Form state
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    // Preview state
    const [preview, setPreview] = useState<any>(null);
    const [paymentSettings, setPaymentSettings] = useState({ paymentDay: 1, graceDays: 5 });

    useEffect(() => {
        if (open) {
            fetchPaymentSettings();
            setPreview(null);
        }
    }, [open]);

    const fetchPaymentSettings = async () => {
        try {
            const res = await fetch('/api/business/settings');
            if (res.ok) {
                const data = await res.json();
                setPaymentSettings({
                    paymentDay: data.defaultPaymentDay ?? 1,
                    graceDays: data.paymentGraceDays ?? 5
                });
            }
        } catch (error) {
            console.error("Error fetching payment settings:", error);
        }
    };

    const handlePreview = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/finance/generate-fees/preview?month=${selectedMonth}&year=${selectedYear}`);
            if (res.ok) {
                const data = await res.json();
                setPreview(data);
            }
        } catch (error) {
            console.error("Error previewing fees:", error);
            toast({ title: "Error al previsualizar", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await fetch('/api/finance/generate-fees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ month: selectedMonth, year: selectedYear })
            });

            if (res.ok) {
                const data = await res.json();
                toast({
                    title: "¡Mensualidades generadas!",
                    description: `Se crearon ${data.created} cobros para ${MONTHS[selectedMonth]} ${selectedYear}`
                });
                onSuccess();
                onOpenChange(false);
            } else {
                const error = await res.json();
                throw new Error(error.message || "Error al generar");
            }
        } catch (error: any) {
            console.error("Error generating fees:", error);
            toast({
                title: "Error al generar cobros",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setGenerating(false);
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        setPreview(null);
    };

    if (!open) return null;

    const dueDate = Math.min(28, paymentSettings.paymentDay + paymentSettings.graceDays);

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 50,
                padding: '20px'
            }}
            onClick={handleClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: 'white',
                    borderRadius: '24px',
                    width: '100%',
                    maxWidth: '540px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '24px',
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                    color: 'white'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
                                📅 Generar Mensualidades
                            </h2>
                            <p style={{ fontSize: '14px', opacity: 0.9, margin: '4px 0 0' }}>
                                Crea automáticamente los cobros mensuales para todos los alumnos inscritos
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '8px',
                                cursor: 'pointer',
                                color: 'white'
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Month/Year Selection */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#475569',
                                marginBottom: '8px'
                            }}>
                                <Calendar size={14} />
                                Mes
                            </label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => { setSelectedMonth(parseInt(e.target.value)); setPreview(null); }}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: '2px solid #E2E8F0',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    backgroundColor: '#F8FAFC',
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            >
                                {MONTHS.map((month, i) => (
                                    <option key={i} value={i}>{month}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#475569',
                                marginBottom: '8px'
                            }}>
                                Año
                            </label>
                            <select
                                value={selectedYear}
                                onChange={(e) => { setSelectedYear(parseInt(e.target.value)); setPreview(null); }}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: '2px solid #E2E8F0',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    backgroundColor: '#F8FAFC',
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            >
                                {[2025, 2026, 2027].map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div style={{
                        padding: '16px',
                        background: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            flexShrink: 0
                        }}>
                            <Calendar size={24} />
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#5B21B6', margin: 0 }}>
                                Fecha límite de pago
                            </p>
                            <p style={{ fontSize: '13px', color: '#7C3AED', margin: '2px 0 0' }}>
                                Día {dueDate} de {MONTHS[selectedMonth]} {selectedYear}
                            </p>
                            <p style={{ fontSize: '11px', color: '#8B5CF6', margin: '2px 0 0' }}>
                                (Día {paymentSettings.paymentDay} + {paymentSettings.graceDays} días de gracia)
                            </p>
                        </div>
                    </div>

                    {/* Preview Button */}
                    {!preview && (
                        <button
                            onClick={handlePreview}
                            disabled={loading}
                            style={{
                                padding: '14px',
                                borderRadius: '12px',
                                border: '2px solid #E2E8F0',
                                backgroundColor: 'white',
                                color: '#475569',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: loading ? 'wait' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                    Calculando...
                                </>
                            ) : (
                                <>
                                    <Users size={16} />
                                    Ver qué se va a generar
                                </>
                            )}
                        </button>
                    )}

                    {/* Preview Results */}
                    {preview && (
                        <div style={{
                            border: '2px solid #E2E8F0',
                            borderRadius: '16px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                padding: '16px',
                                backgroundColor: '#F8FAFC',
                                borderBottom: '1px solid #E2E8F0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontWeight: 600, color: '#1E293B' }}>
                                    Resumen de Generación
                                </span>
                                <button
                                    onClick={() => setPreview(null)}
                                    style={{
                                        padding: '4px 12px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        backgroundColor: '#E2E8F0',
                                        color: '#64748B',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cambiar mes
                                </button>
                            </div>
                            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748B' }}>Alumnos inscritos:</span>
                                    <span style={{ fontWeight: 600, color: '#1E293B' }}>{preview.totalStudents}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748B' }}>Cobros a generar:</span>
                                    <span style={{ fontWeight: 600, color: '#8B5CF6' }}>{preview.feesToCreate}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748B' }}>Total a cobrar:</span>
                                    <span style={{ fontWeight: 700, fontSize: '18px', color: '#059669' }}>
                                        ${preview.totalAmount?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                {preview.alreadyGenerated > 0 && (
                                    <div style={{
                                        padding: '12px',
                                        backgroundColor: '#FEF3C7',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '13px',
                                        color: '#92400E'
                                    }}>
                                        <AlertTriangle size={16} />
                                        {preview.alreadyGenerated} alumno(s) ya tienen cobro de {MONTHS[selectedMonth]}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '20px 24px',
                    backgroundColor: '#F8FAFC',
                    borderTop: '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px'
                }}>
                    <button
                        onClick={handleClose}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: '2px solid #E2E8F0',
                            backgroundColor: 'white',
                            color: '#64748B',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={!preview || preview.feesToCreate === 0 || generating}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            background: preview && preview.feesToCreate > 0
                                ? 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
                                : '#CBD5E1',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: preview && preview.feesToCreate > 0 && !generating ? 'pointer' : 'not-allowed',
                            boxShadow: preview && preview.feesToCreate > 0 ? '0 4px 15px rgba(139, 92, 246, 0.35)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {generating ? (
                            <>
                                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                Generando...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={16} />
                                Generar {preview?.feesToCreate || 0} Cobros
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
