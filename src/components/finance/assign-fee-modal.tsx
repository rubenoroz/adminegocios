"use client";

import { useState, useEffect } from "react";
import { X, DollarSign, User, FileText, Calendar, Loader2 } from "lucide-react";
import { useBranch } from "@/context/branch-context";
import { useToast } from "@/components/ui/use-toast";

interface AssignFeeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function AssignFeeModal({ open, onOpenChange, onSuccess }: AssignFeeModalProps) {
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Data lists
    const [students, setStudents] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);

    // Form
    const [selectedStudentId, setSelectedStudentId] = useState<string>("");
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

    // Calculate default due date based on payment settings
    const calculateDefaultDueDate = (paymentDay: number, graceDays: number) => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        let dueDateDay = Math.min(28, paymentDay + graceDays);
        let dueMonth = currentMonth;
        let dueYear = currentYear;

        if (today.getDate() > dueDateDay) {
            dueMonth += 1;
            if (dueMonth > 11) {
                dueMonth = 0;
                dueYear += 1;
            }
        }

        const dueDateObj = new Date(dueYear, dueMonth, dueDateDay);
        return dueDateObj.toISOString().split('T')[0];
    };

    useEffect(() => {
        if (open && selectedBranch?.businessId) {
            fetchStudents();
            fetchTemplates();
            fetchPaymentSettings();
        }
    }, [open, selectedBranch]);

    const fetchPaymentSettings = async () => {
        try {
            const res = await fetch('/api/business/settings');
            if (res.ok) {
                const data = await res.json();
                const paymentDay = data.defaultPaymentDay ?? 1;
                const graceDays = data.paymentGraceDays ?? 5;
                const defaultDate = calculateDefaultDueDate(paymentDay, graceDays);
                setDueDate(defaultDate);
            }
        } catch (error) {
            console.error("Error fetching payment settings:", error);
            const fallbackDate = calculateDefaultDueDate(1, 5);
            setDueDate(fallbackDate);
        }
    };

    const fetchStudents = async () => {
        if (!selectedBranch?.id) return;
        const res = await fetch(`/api/students?branchId=${selectedBranch.id}`);
        if (res.ok) setStudents(await res.json());
    };

    const fetchTemplates = async () => {
        if (!selectedBranch?.businessId) return;
        const res = await fetch(`/api/finance/templates?businessId=${selectedBranch.businessId}`);
        if (res.ok) setTemplates(await res.json());
    };

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplateId(templateId);
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setTitle(template.name);
            setAmount(template.amount.toString());
        }
    };

    const handleAssign = async () => {
        if (!selectedStudentId || !title || !amount || !dueDate) return;

        setLoading(true);
        try {
            const res = await fetch("/api/finance/fees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentIds: [selectedStudentId],
                    title,
                    amount,
                    dueDate
                })
            });

            if (!res.ok) throw new Error("Failed to assign fee");

            toast({ title: "Cobro asignado exitosamente" });
            onSuccess();
            onOpenChange(false);
            // Reset form
            setSelectedStudentId("");
            setSelectedTemplateId("");
            setTitle("");
            setAmount("");
            setDueDate("");
        } catch (error) {
            console.error(error);
            toast({ title: "Error al asignar cobro", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        setSelectedStudentId("");
        setSelectedTemplateId("");
        setTitle("");
        setAmount("");
    };

    if (!open) return null;

    const selectedStudent = students.find(s => s.id === selectedStudentId);
    const canSubmit = selectedStudentId && title && amount && dueDate;

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
                    maxWidth: '480px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '24px',
                    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                    color: 'white'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
                                💰 Cargo Manual
                            </h2>
                            <p style={{ fontSize: '14px', opacity: 0.9, margin: '4px 0 0' }}>
                                Crea un cobro extraordinario para un estudiante
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
                    {/* Student Select */}
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
                            <User size={14} />
                            Estudiante
                        </label>
                        <select
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: '2px solid #E2E8F0',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: selectedStudentId ? '#1E293B' : '#94A3B8',
                                backgroundColor: '#F8FAFC',
                                cursor: 'pointer',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                            onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                        >
                            <option value="">Seleccionar alumno...</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.firstName} {s.lastName} {s.matricula ? `(${s.matricula})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Template Select */}
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
                            <FileText size={14} />
                            Plantilla (Opcional)
                        </label>
                        <select
                            value={selectedTemplateId}
                            onChange={(e) => handleTemplateSelect(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: '2px solid #E2E8F0',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: selectedTemplateId ? '#1E293B' : '#94A3B8',
                                backgroundColor: '#F8FAFC',
                                cursor: 'pointer',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                            onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                        >
                            <option value="">Seleccionar concepto...</option>
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.name} - ${t.amount.toLocaleString('es-MX')}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Title */}
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
                            <FileText size={14} />
                            Concepto
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej. Material extra, Uniforme, etc."
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: '2px solid #E2E8F0',
                                fontSize: '14px',
                                fontWeight: 500,
                                backgroundColor: '#F8FAFC',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                            onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                        />
                    </div>

                    {/* Amount and Date Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                                Monto
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: '2px solid #E2E8F0',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    backgroundColor: '#F8FAFC',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                                onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                            />
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
                                <Calendar size={14} />
                                Fecha Límite
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: '2px solid #E2E8F0',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    backgroundColor: '#F8FAFC',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                                onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                            />
                        </div>
                    </div>

                    {/* Info note */}
                    <div style={{
                        padding: '12px 16px',
                        backgroundColor: '#FEF3C7',
                        borderRadius: '12px',
                        fontSize: '13px',
                        color: '#92400E'
                    }}>
                        💡 <strong>Tip:</strong> Este modal es para cobros extraordinarios. Las mensualidades se generan automáticamente desde el botón "Generar Cobros del Mes".
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
                        style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: '2px solid #E2E8F0',
                            backgroundColor: 'white',
                            color: '#64748B',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={!canSubmit || loading}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            background: canSubmit ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : '#CBD5E1',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
                            boxShadow: canSubmit ? '0 4px 15px rgba(16, 185, 129, 0.35)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                Asignando...
                            </>
                        ) : (
                            <>
                                <DollarSign size={16} />
                                Asignar Cobro
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
