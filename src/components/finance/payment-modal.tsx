"use client";

import { useState, useEffect } from "react";
import { X, DollarSign, CreditCard, Banknote, ArrowRightLeft, Loader2, CheckCircle2 } from "lucide-react";
import { useBranch } from "@/context/branch-context";
import { useToast } from "@/components/ui/use-toast";

interface PaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fee: any;
    onSuccess: () => void;
}

const PAYMENT_METHODS = [
    { value: 'CASH', label: 'Efectivo', icon: Banknote, color: '#10B981' },
    { value: 'CARD', label: 'Tarjeta', icon: CreditCard, color: '#3B82F6' },
    { value: 'TRANSFER', label: 'Transferencia', icon: ArrowRightLeft, color: '#8B5CF6' }
];

export function PaymentModal({ open, onOpenChange, fee, onSuccess }: PaymentModalProps) {
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("CASH");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && fee) {
            // Default amount to remaining balance
            const paid = fee.payments?.reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0;
            const remaining = Math.max(0, fee.amount - paid);
            setAmount(remaining.toString());
            setMethod("CASH");
        }
    }, [open, fee]);

    const handlePayment = async () => {
        if (!amount || !fee || !selectedBranch?.businessId || loading) return;

        setLoading(true);
        try {
            const res = await fetch("/api/finance/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    feeId: fee.id,
                    amount: parseFloat(amount),
                    method,
                    businessId: selectedBranch.businessId
                })
            });

            if (!res.ok) throw new Error("Failed to register payment");

            toast({
                title: "✅ Pago registrado",
                description: `Se ha registrado el pago de $${parseFloat(amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })} exitosamente.`
            });
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error al registrar pago",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            onOpenChange(false);
        }
    };

    if (!open || !fee) return null;

    const paidSoFar = fee.payments?.reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0;
    const remaining = Math.max(0, fee.amount - paidSoFar);
    const paymentAmount = parseFloat(amount) || 0;
    const isValidAmount = paymentAmount > 0 && paymentAmount <= remaining;

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
                    maxWidth: '440px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '24px',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: 'white'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
                                💵 Registrar Pago
                            </h2>
                            <p style={{ fontSize: '14px', opacity: 0.9, margin: '4px 0 0' }}>
                                {fee.title}
                            </p>
                            <p style={{ fontSize: '13px', opacity: 0.8, margin: '2px 0 0' }}>
                                {fee.student.firstName} {fee.student.lastName}
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            disabled={loading}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '8px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                color: 'white',
                                opacity: loading ? 0.5 : 1
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Summary Card */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '12px'
                    }}>
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#F1F5F9',
                            borderRadius: '12px',
                            textAlign: 'center'
                        }}>
                            <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>Total</p>
                            <p style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', margin: '4px 0 0' }}>
                                ${fee.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#DCFCE7',
                            borderRadius: '12px',
                            textAlign: 'center'
                        }}>
                            <p style={{ fontSize: '11px', color: '#16A34A', margin: 0 }}>Pagado</p>
                            <p style={{ fontSize: '16px', fontWeight: 700, color: '#16A34A', margin: '4px 0 0' }}>
                                ${paidSoFar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div style={{
                            padding: '12px',
                            backgroundColor: remaining > 0 ? '#FEF3C7' : '#DCFCE7',
                            borderRadius: '12px',
                            textAlign: 'center'
                        }}>
                            <p style={{ fontSize: '11px', color: remaining > 0 ? '#D97706' : '#16A34A', margin: 0 }}>Pendiente</p>
                            <p style={{ fontSize: '16px', fontWeight: 700, color: remaining > 0 ? '#D97706' : '#16A34A', margin: '4px 0 0' }}>
                                ${remaining.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>

                    {/* Amount Input */}
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
                            <DollarSign size={14} />
                            Monto a Registrar
                        </label>
                        <div style={{ position: 'relative' }}>
                            <span style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '18px',
                                fontWeight: 700,
                                color: '#64748B'
                            }}>$</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    padding: '16px 16px 16px 40px',
                                    borderRadius: '12px',
                                    border: `2px solid ${isValidAmount || !amount ? '#E2E8F0' : '#FCA5A5'}`,
                                    fontSize: '24px',
                                    fontWeight: 700,
                                    backgroundColor: '#F8FAFC',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#10B981'}
                                onBlur={(e) => e.target.style.borderColor = isValidAmount || !amount ? '#E2E8F0' : '#FCA5A5'}
                            />
                        </div>
                        {paymentAmount > remaining && (
                            <p style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px' }}>
                                El monto excede el saldo pendiente
                            </p>
                        )}
                    </div>

                    {/* Payment Method Pills */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#475569',
                            marginBottom: '12px'
                        }}>
                            Método de Pago
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {PAYMENT_METHODS.map(pm => {
                                const Icon = pm.icon;
                                const isSelected = method === pm.value;
                                return (
                                    <button
                                        key={pm.value}
                                        type="button"
                                        onClick={() => setMethod(pm.value)}
                                        disabled={loading}
                                        style={{
                                            flex: 1,
                                            padding: '12px 8px',
                                            borderRadius: '12px',
                                            border: `2px solid ${isSelected ? pm.color : '#E2E8F0'}`,
                                            backgroundColor: isSelected ? `${pm.color}10` : 'white',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '6px',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <Icon size={20} style={{ color: isSelected ? pm.color : '#94A3B8' }} />
                                        <span style={{
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            color: isSelected ? pm.color : '#64748B'
                                        }}>
                                            {pm.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
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
                        disabled={loading}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: '2px solid #E2E8F0',
                            backgroundColor: 'white',
                            color: '#64748B',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.5 : 1
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handlePayment}
                        disabled={!isValidAmount || loading}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            background: isValidAmount && !loading
                                ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                                : '#CBD5E1',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: isValidAmount && !loading ? 'pointer' : 'not-allowed',
                            boxShadow: isValidAmount && !loading ? '0 4px 15px rgba(16, 185, 129, 0.35)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={16} />
                                Confirmar Pago
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
