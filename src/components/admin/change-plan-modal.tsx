
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { X, Check } from "lucide-react";
import ReactConfetti from 'react-confetti';

interface Plan {
    id: string;
    name: string;
    price: number;
    description: string | null;
    features: string[]; // Assuming features is parsed JSON or array
    maxCourses: number | null;
    maxTeachers: number | null;
    maxStudents: number | null;
}

interface ChangePlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    businessId: string;
    currentPlanId: string | null | undefined;
    onComplete: () => void;
}

export function ChangePlanModal({ isOpen, onClose, businessId, currentPlanId, onComplete }: ChangePlanModalProps) {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(currentPlanId || null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchPlans();
            setSelectedPlanId(currentPlanId || null);
            setError(null);
        }
    }, [isOpen, currentPlanId]);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/plans");
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Error al cargar planes");
            }
            const data = await res.json();
            setPlans(data);
            if (data.length === 0) {
                setError("No se encontraron planes disponibles en el sistema.");
            }
        } catch (error: any) {
            console.error("Error fetching plans:", error);
            setError("Error al cargar los planes. Por favor intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedPlanId) return;

        setSaving(true);
        try {
            console.log("Saving plan:", selectedPlanId, "for business:", businessId);
            const res = await fetch(`/api/admin/businesses/${businessId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planId: selectedPlanId }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to update plan");
            }

            console.log("Plan updated successfully");
            setShowConfetti(true);
            setTimeout(() => {
                setShowConfetti(false);
                onComplete();
                onClose();
            }, 3000);
        } catch (error: any) {
            console.error("Error updating plan:", error);
            alert(`Error al actualizar el plan: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-5xl bg-slate-50 p-0 overflow-hidden border-0 shadow-2xl max-h-[90vh] flex flex-col" style={{ borderRadius: '16px', border: 'none' }}>
                {showConfetti && (
                    <div className="fixed inset-0 pointer-events-none z-50">
                        <ReactConfetti
                            width={window.innerWidth}
                            height={window.innerHeight}
                            recycle={false}
                            numberOfPieces={500}
                        />
                    </div>
                )}

                <div className="p-6 md:p-8 bg-white border-b border-slate-100" style={{ padding: '32px', borderBottom: '1px solid #e2e8f0' }}>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-slate-900" style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                            Cambiar Plan de Suscripción
                        </DialogTitle>
                        <DialogDescription className="text-base text-slate-500 mt-1" style={{ fontSize: '16px', color: '#64748b', lineHeight: '1.5' }}>
                            Selecciona el nuevo plan para este negocio. Los cambios se aplicarán inmediatamente.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8" style={{ padding: '32px', backgroundColor: '#f8fafc' }}>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" />
                            <p className="text-slate-500 font-medium">Cargando planes disponibles...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto">
                            <div className="bg-red-50 text-red-600 p-4 rounded-full mb-4">
                                <X size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Error al cargar planes</h3>
                            <p className="text-slate-500 mb-6">{error}</p>
                            <button
                                onClick={fetchPlans}
                                className="px-6 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 shadow-sm transition-colors"
                            >
                                Intentar de nuevo
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                            {plans.map((plan) => {
                                const isSelected = selectedPlanId === plan.id;
                                const isCurrent = currentPlanId === plan.id;
                                const isPopular = plan.name.toLowerCase().includes('growth');

                                return (
                                    <div
                                        key={plan.id}
                                        onClick={() => setSelectedPlanId(plan.id)}
                                        style={{
                                            position: 'relative',
                                            cursor: 'pointer',
                                            borderRadius: '16px',
                                            padding: '24px',
                                            transition: 'all 0.2s ease',
                                            backgroundColor: 'white',
                                            border: isSelected ? '2px solid #2563eb' : '2px solid #e2e8f0',
                                            boxShadow: isSelected ? '0 10px 15px -3px rgba(37, 99, 235, 0.1), 0 4px 6px -2px rgba(37, 99, 235, 0.05)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                                            transform: isSelected ? 'translateY(-2px)' : 'none'
                                        }}
                                        className="group"
                                    >
                                        {/* Status Badges */}
                                        <div style={{ position: 'absolute', top: '-12px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '8px', pointerEvents: 'none' }}>
                                            {isCurrent && (
                                                <span style={{ backgroundColor: '#0f172a', color: 'white', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '999px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                                                    Plan Actual
                                                </span>
                                            )}
                                            {isPopular && !isCurrent && (
                                                <span style={{ background: 'linear-gradient(to right, #2563eb, #4f46e5)', color: 'white', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '999px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    Recomendado
                                                </span>
                                            )}
                                        </div>

                                        {/* Selection Checkmark */}
                                        <div style={{
                                            position: 'absolute', top: '16px', right: '16px',
                                            opacity: isSelected ? 1 : 0,
                                            transform: isSelected ? 'scale(1)' : 'scale(0.8)',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                        }}>
                                            <div style={{ backgroundColor: '#2563eb', color: 'white', borderRadius: '50%', padding: '4px', display: 'flex', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                        </div>

                                        {/* Plan Header */}
                                        <div style={{ marginBottom: '24px', paddingTop: '8px' }}>
                                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                                                {plan.name}
                                            </h3>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                                <span style={{ fontSize: '30px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>
                                                    ${plan.price}
                                                </span>
                                                <span style={{ fontSize: '14px', fontWeight: '500', color: '#64748b' }}>/mes</span>
                                            </div>
                                            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px', lineHeight: '1.4', minHeight: '36px' }}>
                                                {plan.description || "Plan perfecto para impulsar tu negocio al siguiente nivel."}
                                            </p>
                                        </div>

                                        {/* Divider */}
                                        <div style={{ height: '1px', width: '100%', backgroundColor: '#f1f5f9', marginBottom: '24px' }} />

                                        {/* Features List */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                                <span style={{ color: '#64748b' }}>Cursos</span>
                                                <span style={{ fontWeight: '600', color: '#0f172a' }}>
                                                    {plan.maxCourses === null ? '∞ Ilimitados' : plan.maxCourses}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                                <span style={{ color: '#64748b' }}>Maestros</span>
                                                <span style={{ fontWeight: '600', color: '#0f172a' }}>
                                                    {plan.maxTeachers === null ? '∞ Ilimitados' : plan.maxTeachers}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                                <span style={{ color: '#64748b' }}>Alumnos</span>
                                                <span style={{ fontWeight: '600', color: '#0f172a' }}>
                                                    {plan.maxStudents === null ? '∞ Ilimitados' : plan.maxStudents}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Select Button */}
                                        <div style={{ marginTop: 'auto' }}>
                                            <div style={{
                                                width: '100%', padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', textAlign: 'center', transition: 'all 0.2s',
                                                backgroundColor: isSelected ? '#2563eb' : '#f8fafc',
                                                color: isSelected ? 'white' : '#475569',
                                                boxShadow: isSelected ? '0 4px 6px -1px rgba(37, 99, 235, 0.3)' : 'none',
                                                border: isSelected ? 'none' : '1px solid #e2e8f0'
                                            }}>
                                                {isSelected ? 'Seleccionado' : 'Seleccionar Plan'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div style={{ padding: '24px', backgroundColor: 'white', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '12px', position: 'sticky', bottom: 0, zIndex: 10 }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '500',
                            backgroundColor: 'white', color: '#334155', border: '1px solid #cbd5e1', cursor: 'pointer'
                        }}
                        disabled={saving}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !selectedPlanId || selectedPlanId === currentPlanId}
                        style={{
                            padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '700',
                            backgroundColor: saving || !selectedPlanId ? '#94a3b8' : '#2563eb',
                            color: 'white', border: 'none', cursor: (saving || !selectedPlanId) ? 'not-allowed' : 'pointer',
                            backgroundImage: saving || !selectedPlanId ? 'none' : 'linear-gradient(to right, #2563eb, #4f46e5)',
                            boxShadow: saving || !selectedPlanId ? 'none' : '0 4px 6px -1px rgba(37, 99, 235, 0.3)',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                                Guardando...
                            </>
                        ) : (
                            "Confirmar Cambio"
                        )}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
