"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, DollarSign, CreditCard, FileText, Ban, X } from "lucide-react";

import { CustomerFiscalModal } from "@/components/sales/customer-fiscal-modal";

// Cancellation reasons
const CANCELLATION_REASONS = [
    { value: "GROUP_CLOSED", label: "Grupo cerrado" },
    { value: "COURSE_ENDED", label: "Curso terminado" },
    { value: "STUDENT_DROPPED", label: "Alumno dado de baja" },
    { value: "DUPLICATE", label: "Cargo duplicado" },
    { value: "ERROR", label: "Error de captura" },
    { value: "OTHER", label: "Otro motivo" }
];

interface StudentPaymentModalProps {
    studentId: string | null;
    studentName: string;
    isOpen: boolean;
    onClose: () => void;
}

interface Fee {
    id: string;
    title: string;
    amount: number;
    status: string;
    dueDate: string;
    originalAmount?: number;
    discountApplied?: number;
    cancelledAt?: string;
    cancellationReason?: string;
    payments: Payment[];
    course?: {
        id: string;
        name: string;
        teacher?: {
            id: string;
            email: string;
            name: string;
        };
    };
}

interface Payment {
    id: string;
    amount: number;
    date: string;
}

export function StudentPaymentModal({
    studentId,
    studentName,
    isOpen,
    onClose,
}: StudentPaymentModalProps) {
    const [fees, setFees] = useState<Fee[]>([]);
    const [loading, setLoading] = useState(false);
    const [payingFeeId, setPayingFeeId] = useState<string | null>(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
    const [teachers, setTeachers] = useState<any[]>([]);
    const [defaultTeacher, setDefaultTeacher] = useState<any>(null);
    const { toast } = useToast();

    // Invoicing
    const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
    const [requiresInvoice, setRequiresInvoice] = useState(false);
    const [isFiscalModalOpen, setIsFiscalModalOpen] = useState(false);

    // Billing Profiles
    const [billingProfiles, setBillingProfiles] = useState<any[]>([]);

    // Configuration
    const [businessConfig, setBusinessConfig] = useState<any>(null);

    // Fetch business config
    useEffect(() => {
        fetch('/api/business')
            .then(res => res.json())
            .then(data => setBusinessConfig(data))
            .catch(err => console.error("Failed to load business config", err));
    }, []);

    // Cancellation
    const [cancellingFeeId, setCancellingFeeId] = useState<string | null>(null);
    const [cancellationReason, setCancellationReason] = useState("");
    const [customReason, setCustomReason] = useState("");
    const [cancelling, setCancelling] = useState(false);
    useEffect(() => {
        if (isOpen && studentId) {
            fetchBillingProfiles();
        }
    }, [isOpen, studentId]);

    const fetchBillingProfiles = async () => {
        if (!studentId) return;
        try {
            const res = await fetch(`/api/students/${studentId}/billing-profiles`);
            if (res.ok) {
                const data = await res.json();
                setBillingProfiles(data);
            }
        } catch (error) {
            console.error("Failed to fetch billing profiles", error);
        }
    };

    // Fetch teachers with commission setup AND student's default teacher
    useEffect(() => {
        if (isOpen && studentId) {
            fetchTeachers();
            fetchStudentDefaultTeacher();
        }
    }, [isOpen, studentId]);

    const fetchTeachers = async () => {
        try {
            const res = await fetch('/api/employees?role=TEACHER');
            if (res.ok) {
                const data = await res.json();
                // Filter only teachers with commission or mixed payment model
                const teachersWithCommission = data.filter((t: any) =>
                    t.paymentModel === 'COMMISSION' || t.paymentModel === 'MIXED'
                );
                setTeachers(teachersWithCommission);
            }
        } catch (error) {
            console.error('Failed to fetch teachers', error);
        }
    };

    // Fetch the student's default teacher from their enrolled courses
    const fetchStudentDefaultTeacher = async () => {
        if (!studentId) return;
        try {
            const res = await fetch(`/api/students/${studentId}/enrollment`);
            if (res.ok) {
                const enrollment = await res.json();
                if (enrollment?.course?.teacher) {
                    setDefaultTeacher(enrollment.course.teacher);
                }
            }
        } catch (error) {
            console.error('Failed to fetch student default teacher', error);
        }
    };

    // Calculate commission breakdown
    const getSelectedTeacher = () => teachers.find(t => t.id === selectedTeacherId);
    const calculateCommission = () => {
        const amount = parseFloat(paymentAmount) || 0;
        const teacher = getSelectedTeacher();
        if (!teacher || !teacher.commissionPercentage) return null;

        const commissionPercent = teacher.commissionPercentage / 100;
        const reservePercent = (teacher.reservePercentage || 0) / 100;

        const teacherGross = amount * commissionPercent;
        const reserveAmount = teacherGross * reservePercent;
        const teacherNet = teacherGross - reserveAmount;
        const schoolAmount = amount - teacherGross;

        return { teacherNet, reserveAmount, schoolAmount, teacherGross };
    };

    useEffect(() => {
        if (isOpen && studentId) {
            fetchFees();
        }
    }, [isOpen, studentId]);

    const fetchFees = async () => {
        if (!studentId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/students/${studentId}/fees`);
            if (res.ok) {
                const data = await res.json();
                setFees(data);
            }
        } catch (error) {
            console.error("Failed to fetch fees", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewCustomerSave = async (customer: any) => {
        setIsFiscalModalOpen(false);
        setSelectedCustomer(customer);
        setRequiresInvoice(true);

        // Auto-link to student
        if (studentId && customer.id) {
            try {
                await fetch(`/api/students/${studentId}/billing-profiles`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ customerId: customer.id })
                });
                fetchBillingProfiles(); // Refresh list
            } catch (error) {
                console.error("Failed to link profile", error);
            }
        }
    };

    const handlePayment = async () => {
        if (!payingFeeId || !paymentAmount || !studentId) return;

        const commission = calculateCommission();

        try {
            // 1. If we have a selected customer (not from profile list originally), make sure it's linked for future
            if (selectedCustomer && selectedCustomer.id) {
                // Optimistically link in background, don't await
                fetch(`/api/students/${studentId}/billing-profiles`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ customerId: selectedCustomer.id })
                }).then(() => fetchBillingProfiles()).catch(e => console.error(e));
            }

            const res = await fetch(`/api/students/${studentId}/fees`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    feeId: payingFeeId,
                    amount: parseFloat(paymentAmount),
                    method: paymentMethod,
                    // Commission data
                    teacherId: selectedTeacherId || null,
                    teacherCommission: commission?.teacherNet || null,
                    reserveAmount: commission?.reserveAmount || null,
                    schoolAmount: commission?.schoolAmount || null,
                    customerId: selectedCustomer?.id,
                    requiresInvoice: requiresInvoice,
                }),
            });

            if (res.ok) {
                const teacher = getSelectedTeacher();
                const msg = teacher
                    ? `Pago registrado. Comisión de ${teacher.firstName}: $${commission?.teacherNet?.toFixed(2)}`
                    : "El pago se ha guardado correctamente.";
                toast({ title: "Pago registrado", description: msg });
                setPayingFeeId(null);
                setPaymentAmount("");
                setSelectedTeacherId("");
                fetchFees(); // Refresh list
            } else {
                toast({ title: "Error", description: "No se pudo registrar el pago.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Ocurrió un error.", variant: "destructive" });
        }
    };

    const handleCancelFee = async () => {
        if (!cancellingFeeId || !cancellationReason || !studentId) return;

        setCancelling(true);
        try {
            const res = await fetch(`/api/students/${studentId}/fees/${cancellingFeeId}/cancel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reason: cancellationReason,
                    customReason: cancellationReason === "OTHER" ? customReason : undefined
                }),
            });

            if (res.ok) {
                const data = await res.json();
                toast({ title: "Cargo cancelado", description: data.message || "El cargo fue cancelado exitosamente." });
                setCancellingFeeId(null);
                setCancellationReason("");
                setCustomReason("");
                fetchFees();
            } else {
                const error = await res.json();
                toast({ title: "Error", description: error.error || "No se pudo cancelar el cargo.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Ocurrió un error.", variant: "destructive" });
        } finally {
            setCancelling(false);
        }
    };

    const getStatusBadge = (status: string, fee?: Fee) => {
        switch (status) {
            case "PAID": return <Badge className="bg-green-500">Pagado</Badge>;
            case "PARTIAL": return <Badge className="bg-yellow-500">Parcial</Badge>;
            case "PENDING": return <Badge variant="outline">Pendiente</Badge>;
            case "OVERDUE": return <Badge variant="destructive">Vencido</Badge>;
            case "CANCELLED":
                return (
                    <Badge
                        className="bg-gray-400 cursor-help"
                        title={fee?.cancellationReason ? `Motivo: ${fee.cancellationReason}` : "Cancelado"}
                    >
                        Cancelado
                    </Badge>
                );
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getRemainingBalance = (fee: Fee) => {
        const paid = fee.payments.reduce((sum, p) => sum + p.amount, 0);
        return fee.amount - paid;
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto pr-extra">
                <DialogHeader>
                    <DialogTitle>Pagos y Deudas: {studentName}</DialogTitle>
                    <DialogDescription>
                        Historial de cargos y registro de nuevos pagos.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Concepto</TableHead>
                                        <TableHead>Vence</TableHead>
                                        <TableHead>Original</TableHead>
                                        <TableHead>Desc.</TableHead>
                                        <TableHead>Final</TableHead>
                                        <TableHead>Pagado</TableHead>
                                        <TableHead>Saldo</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right" style={{ paddingRight: '24px' }}>Acción</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fees.map((fee, index) => {
                                        const balance = getRemainingBalance(fee);
                                        const isPaid = balance <= 0;
                                        const hasDiscount = fee.discountApplied && fee.discountApplied > 0;

                                        return (
                                            <TableRow
                                                key={fee.id}
                                                className="border-b border-gray-100 transition-colors hover:bg-slate-50"
                                                style={{ backgroundColor: index % 2 === 1 ? '#F8FAFC' : '#FFFFFF' }}
                                            >
                                                <TableCell className="font-medium">{fee.title}</TableCell>
                                                <TableCell>{new Date(fee.dueDate).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    {fee.originalAmount ? (
                                                        <span className={hasDiscount ? "line-through text-muted-foreground" : ""}>
                                                            ${fee.originalAmount.toFixed(2)}
                                                        </span>
                                                    ) : (
                                                        <span>${fee.amount.toFixed(2)}</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {hasDiscount ? (
                                                        <span className="text-green-600 font-semibold">
                                                            -${fee.discountApplied?.toFixed(2)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-bold">${fee.amount.toFixed(2)}</TableCell>
                                                <TableCell>${(fee.amount - balance).toFixed(2)}</TableCell>
                                                <TableCell className="font-bold text-red-600">
                                                    ${balance.toFixed(2)}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(fee.status, fee)}</TableCell>
                                                <TableCell className="text-right" style={{ paddingRight: '16px' }}>
                                                    {fee.status !== "PAID" && fee.status !== "CANCELLED" && (
                                                        <div className="flex gap-2 justify-end" style={{ marginRight: '8px' }}>
                                                            <button
                                                                className="button-modern bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                                                                onClick={() => {
                                                                    setPayingFeeId(fee.id);
                                                                    setCancellingFeeId(null); // Clear cancel mode
                                                                    setPaymentAmount(balance.toString());

                                                                    // Logic for auto-detecting teacher
                                                                    const title = fee.title.toLowerCase();
                                                                    const isInscription = title.includes("inscripción") || title.includes("inscription") || title.includes("matrícula");

                                                                    // Check global config for inscriptions
                                                                    // Default to FALSE if config not loaded yet, or strictly respect the setting
                                                                    const allowAutoSelect = !isInscription || (businessConfig?.commissionOnInscription === true);

                                                                    if (allowAutoSelect) {
                                                                        const courseTeacher = fee.course?.teacher;
                                                                        if (courseTeacher) {
                                                                            // Find employee with same email that has commission
                                                                            const matchingEmployee = teachers.find(
                                                                                t => t.email === courseTeacher.email
                                                                            );
                                                                            if (matchingEmployee) {
                                                                                setSelectedTeacherId(matchingEmployee.id);
                                                                            } else {
                                                                                setSelectedTeacherId(""); // Reset if no match found
                                                                            }
                                                                        } else {
                                                                            setSelectedTeacherId(""); // Reset if no teacher
                                                                        }
                                                                    } else {
                                                                        // If it's inscription and config says NO, ensure field is empty
                                                                        setSelectedTeacherId("");
                                                                    }
                                                                }}
                                                            >
                                                                Pagar
                                                            </button>
                                                            <button
                                                                className="button-modern bg-gradient-to-r from-gray-500 to-gray-400 hover:from-gray-600 hover:to-gray-500"
                                                                onClick={() => {
                                                                    setCancellingFeeId(fee.id);
                                                                    setPayingFeeId(null); // Clear pay mode
                                                                    setCancellationReason("");
                                                                    setCustomReason("");
                                                                }}
                                                                title="Cancelar cargo"
                                                            >
                                                                <Ban size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {fee.status === "CANCELLED" && (
                                                        <span className="text-sm text-gray-500 italic">
                                                            {fee.cancellationReason?.replace("OTHER: ", "") || "Cancelado"}
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {fees.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                                Este alumno no tiene cargos registrados.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Cancellation Form */}
                        {cancellingFeeId && (
                            <div className="bg-red-50 p-4 rounded-xl border border-red-200 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-red-800 flex items-center gap-2">
                                        <Ban size={18} /> Cancelar Cargo
                                    </h3>
                                    <button
                                        onClick={() => { setCancellingFeeId(null); setCancellationReason(""); setCustomReason(""); }}
                                        style={{
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "10px",
                                            border: "none",
                                            background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                                            color: "white",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
                                            transition: "all 0.2s ease",
                                            marginRight: "8px"
                                        }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                <p className="text-sm text-red-700">
                                    Cargo: <strong>{fees.find(f => f.id === cancellingFeeId)?.title}</strong>
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                    <div className="space-y-2">
                                        <Label>Motivo de Cancelación *</Label>
                                        <Select value={cancellationReason} onValueChange={setCancellationReason}>
                                            <SelectTrigger
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    padding: '10px 18px',
                                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                    border: 'none',
                                                    borderRadius: '14px',
                                                    color: 'white',
                                                    fontWeight: 600,
                                                    fontSize: '14px',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.35)',
                                                    height: '44px',
                                                    width: 'auto',
                                                    minWidth: '200px',
                                                    maxWidth: '280px'
                                                }}
                                            >
                                                <SelectValue placeholder="Seleccionar motivo..." />
                                            </SelectTrigger>
                                            <SelectContent
                                                style={{
                                                    background: 'white',
                                                    borderRadius: '16px',
                                                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                                                    padding: '8px',
                                                    border: 'none',
                                                    minWidth: '220px',
                                                    zIndex: 10001
                                                }}
                                            >
                                                <div style={{
                                                    fontSize: '11px',
                                                    textTransform: 'uppercase',
                                                    color: '#ef4444',
                                                    fontWeight: 700,
                                                    letterSpacing: '0.5px',
                                                    padding: '8px 12px',
                                                    marginBottom: '4px'
                                                }}>
                                                    Motivo de Cancelación
                                                </div>
                                                {CANCELLATION_REASONS.map(reason => (
                                                    <SelectItem
                                                        key={reason.value}
                                                        value={reason.value}
                                                        style={{
                                                            borderRadius: '10px',
                                                            marginBottom: '2px',
                                                            padding: '10px 12px',
                                                            cursor: 'pointer',
                                                            border: 'none'
                                                        }}
                                                        className="focus:bg-red-50 data-[state=checked]:bg-red-100 data-[state=checked]:text-red-700"
                                                    >
                                                        {reason.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {cancellationReason === "OTHER" && (
                                        <div className="space-y-2">
                                            <Label>Especificar motivo</Label>
                                            <Input
                                                value={customReason}
                                                onChange={(e) => setCustomReason(e.target.value)}
                                                placeholder="Describir motivo..."
                                                className="h-11 rounded-xl bg-white border-slate-200"
                                            />
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCancelFee}
                                            disabled={!cancellationReason || cancelling}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                padding: '12px 20px',
                                                background: (!cancellationReason || cancelling)
                                                    ? '#d1d5db'
                                                    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                border: 'none',
                                                borderRadius: '12px',
                                                color: 'white',
                                                fontWeight: 600,
                                                fontSize: '14px',
                                                cursor: (!cancellationReason || cancelling) ? 'not-allowed' : 'pointer',
                                                boxShadow: (!cancellationReason || cancelling)
                                                    ? 'none'
                                                    : '0 4px 15px rgba(239, 68, 68, 0.35)',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            {cancelling ? <Loader2 className="animate-spin h-4 w-4" /> : "Confirmar Cancelación"}
                                        </button>
                                        <button
                                            onClick={() => { setCancellingFeeId(null); setCancellationReason(""); setCustomReason(""); }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                padding: '12px 20px',
                                                background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                                                border: 'none',
                                                borderRadius: '12px',
                                                color: 'white',
                                                fontWeight: 600,
                                                fontSize: '14px',
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 15px rgba(107, 114, 128, 0.35)',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            No Cancelar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {payingFeeId && (
                            <div className="bg-muted/50 p-4 rounded-lg border space-y-4">
                                <h3 className="font-semibold">Registrar Pago</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                    <div className="space-y-2">
                                        <Label>Monto a Pagar</Label>
                                        <Input
                                            type="number"
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                            className="h-11 rounded-xl bg-white border-slate-200"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Método de Pago</Label>
                                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                            <SelectTrigger
                                                className="select-trigger-purple"
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    padding: '10px 18px',
                                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                                    border: 'none',
                                                    borderRadius: '14px',
                                                    color: 'white',
                                                    fontWeight: 600,
                                                    fontSize: '14px',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.35)',
                                                    height: '44px'
                                                }}
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent
                                                style={{
                                                    background: 'white',
                                                    borderRadius: '20px',
                                                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                                                    padding: '12px',
                                                    border: 'none',
                                                    minWidth: '260px',
                                                    zIndex: 10001
                                                }}
                                            >
                                                {/* Purple Header */}
                                                <div style={{
                                                    fontSize: '11px',
                                                    textTransform: 'uppercase',
                                                    color: '#8b5cf6',
                                                    fontWeight: 700,
                                                    letterSpacing: '0.5px',
                                                    padding: '8px 12px',
                                                    marginBottom: '4px'
                                                }}>
                                                    Método de Pago
                                                </div>
                                                <SelectItem value="CASH"
                                                    style={{
                                                        borderRadius: '14px',
                                                        marginBottom: '4px',
                                                        padding: '12px 14px',
                                                        cursor: 'pointer',
                                                        border: 'none'
                                                    }}
                                                    className="focus:bg-slate-50 data-[state=checked]:bg-[rgba(139,92,246,0.1)] data-[state=checked]:text-[#8b5cf6]"
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '10px',
                                                            background: '#10b981',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white'
                                                        }}>
                                                            <DollarSign size={16} />
                                                        </div>
                                                        <span style={{ fontWeight: 500, fontSize: '14px', color: '#475569' }}>Efectivo</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="CARD"
                                                    style={{
                                                        borderRadius: '14px',
                                                        marginBottom: '4px',
                                                        padding: '12px 14px',
                                                        cursor: 'pointer',
                                                        border: 'none'
                                                    }}
                                                    className="focus:bg-slate-50 data-[state=checked]:bg-[rgba(139,92,246,0.1)] data-[state=checked]:text-[#8b5cf6]"
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '10px',
                                                            background: '#3b82f6',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white'
                                                        }}>
                                                            <CreditCard size={16} />
                                                        </div>
                                                        <span style={{ fontWeight: 500, fontSize: '14px', color: '#475569' }}>Tarjeta</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="TRANSFER"
                                                    style={{
                                                        borderRadius: '14px',
                                                        marginBottom: '4px',
                                                        padding: '12px 14px',
                                                        cursor: 'pointer',
                                                        border: 'none'
                                                    }}
                                                    className="focus:bg-slate-50 data-[state=checked]:bg-[rgba(139,92,246,0.1)] data-[state=checked]:text-[#8b5cf6]"
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '10px',
                                                            background: '#8b5cf6',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white'
                                                        }}>
                                                            <FileText size={16} />
                                                        </div>
                                                        <span style={{ fontWeight: 500, fontSize: '14px', color: '#475569' }}>Transferencia</span>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {/* Teacher commission - auto-detected from student's course enrollment */}
                                    {(() => {
                                        // Try to find matching employee from defaultTeacher (from enrollment)
                                        // or from fee's course teacher as fallback
                                        const payingFee = fees.find(f => f.id === payingFeeId);
                                        const courseTeacher = payingFee?.course?.teacher || defaultTeacher;
                                        const defaultEmployee = courseTeacher
                                            ? teachers.find(t => t.email === courseTeacher.email)
                                            : null;

                                        // Auto-select if no teacher selected yet
                                        if (defaultEmployee && selectedTeacherId === "") {
                                            setTimeout(() => setSelectedTeacherId(defaultEmployee.id), 0);
                                        }

                                        // Only show if there are teachers with commission
                                        if (teachers.length === 0) return null;

                                        return (
                                            <div className="space-y-2">
                                                <Label>
                                                    Maestro
                                                    {defaultEmployee && (
                                                        <span className="text-xs text-emerald-600 ml-2">
                                                            (auto-detectado)
                                                        </span>
                                                    )}
                                                </Label>
                                                <Select
                                                    value={selectedTeacherId || "_none"}
                                                    onValueChange={(val) => setSelectedTeacherId(val === "_none" ? "" : val)}
                                                >
                                                    <SelectTrigger
                                                        className="h-[44px] rounded-[14px] bg-white border-none shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all"
                                                        style={{ width: 'auto', paddingRight: '12px', fontSize: '14px', color: '#1e293b' }}
                                                    >
                                                        <SelectValue placeholder="Sin comisión" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="_none">Sin comisión</SelectItem>
                                                        {teachers.map((teacher) => (
                                                            <SelectItem key={teacher.id} value={teacher.id}>
                                                                {teacher.firstName} {teacher.lastName} ({teacher.commissionPercentage}%)
                                                                {teacher.id === defaultEmployee?.id && " 📌"}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        );
                                    })()}
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={handlePayment}
                                            className="button-modern-sm button-modern-sm-blue"
                                        >
                                            Confirmar Pago
                                        </button>
                                        <button
                                            onClick={() => { setPayingFeeId(null); setSelectedTeacherId(""); }}
                                            className="button-modern-sm button-modern-sm-red"
                                        >
                                            Cancelar
                                        </button>
                                    </div>

                                    {/* Invoicing Section - Full Width */}
                                    <div className="col-span-full border-t pt-4 mt-2">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-slate-700">Datos de Facturación (Opcional)</span>
                                                <button
                                                    onClick={() => setIsFiscalModalOpen(true)}
                                                    className="button-modern-sm button-modern-sm-blue flex items-center gap-2"
                                                    style={{ height: '44px', paddingLeft: '16px', paddingRight: '16px' }}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Nuevo Cliente
                                                </button>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4">
                                                <div className="w-full md:w-auto md:flex-1 min-w-[200px]">
                                                    {billingProfiles.length > 0 ? (
                                                        <div className="flex items-center gap-3">
                                                            <Select
                                                                value={selectedCustomer?.id || ""}
                                                                onValueChange={(val) => {
                                                                    const profile = billingProfiles.find(p => p.id === val);
                                                                    setSelectedCustomer(profile || null);
                                                                    if (profile) setRequiresInvoice(true);
                                                                }}
                                                            >
                                                                <SelectTrigger
                                                                    className="select-trigger-purple"
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '10px',
                                                                        padding: '10px 18px',
                                                                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                                                        border: 'none',
                                                                        borderRadius: '14px',
                                                                        color: 'white',
                                                                        fontWeight: 600,
                                                                        fontSize: '14px',
                                                                        cursor: 'pointer',
                                                                        boxShadow: '0 4px 15px rgba(139, 92, 246, 0.35)',
                                                                        minWidth: '200px'
                                                                    }}
                                                                >
                                                                    <SelectValue placeholder="Seleccionar RFC..." />
                                                                </SelectTrigger>
                                                                <SelectContent
                                                                    style={{
                                                                        background: 'white',
                                                                        borderRadius: '20px',
                                                                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                                                                        padding: '12px',
                                                                        border: 'none',
                                                                        minWidth: '280px',
                                                                        zIndex: 10001
                                                                    }}
                                                                >
                                                                    {/* Purple Header like BranchSelector */}
                                                                    <div style={{
                                                                        fontSize: '11px',
                                                                        textTransform: 'uppercase',
                                                                        color: '#8b5cf6',
                                                                        fontWeight: 700,
                                                                        letterSpacing: '0.5px',
                                                                        padding: '8px 12px',
                                                                        marginBottom: '4px'
                                                                    }}>
                                                                        Seleccionar Perfil
                                                                    </div>
                                                                    {billingProfiles.map((profile) => (
                                                                        <SelectItem
                                                                            key={profile.id}
                                                                            value={profile.id}
                                                                            style={{
                                                                                borderRadius: '14px',
                                                                                marginBottom: '4px',
                                                                                padding: '12px 14px',
                                                                                cursor: 'pointer',
                                                                                border: 'none'
                                                                            }}
                                                                            className="focus:bg-slate-50 data-[state=checked]:bg-[rgba(139,92,246,0.1)] data-[state=checked]:text-[#8b5cf6]"
                                                                        >
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                                {/* Icon box like BranchSelector */}
                                                                                <div style={{
                                                                                    width: '32px',
                                                                                    height: '32px',
                                                                                    borderRadius: '10px',
                                                                                    background: '#8b5cf6',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    color: 'white'
                                                                                }}>
                                                                                    <FileText size={16} />
                                                                                </div>
                                                                                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                                                                    <span style={{ fontWeight: 500, fontSize: '14px', color: '#475569' }}>
                                                                                        {profile.legalName || profile.name}
                                                                                    </span>
                                                                                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                                                        {profile.taxId}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            {selectedCustomer && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedCustomer(null);
                                                                        setRequiresInvoice(false);
                                                                    }}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        width: '44px',
                                                                        height: '44px',
                                                                        borderRadius: '14px',
                                                                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                                        border: 'none',
                                                                        color: 'white',
                                                                        cursor: 'pointer',
                                                                        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.35)',
                                                                        transition: 'all 0.2s ease'
                                                                    }}
                                                                    title="Quitar perfil seleccionado"
                                                                >
                                                                    ✕
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-slate-500 italic py-2">
                                                            No hay perfiles guardados. Crea uno nuevo.
                                                        </p>
                                                    )}
                                                </div>

                                                <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 transition-all select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={requiresInvoice}
                                                        onChange={(e) => setRequiresInvoice(e.target.checked)}
                                                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                                                    />
                                                    <span className="text-sm font-medium text-slate-700">Requiere Factura</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Commission breakdown */}
                                {selectedTeacherId && selectedTeacherId !== "_none" && calculateCommission() && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                                        <p className="text-sm font-medium text-blue-800 mb-2">📊 Desglose de Comisión</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                            <div className="bg-white rounded p-2 text-center">
                                                <div className="text-xs text-slate-500">Total</div>
                                                <div className="font-bold">${parseFloat(paymentAmount || "0").toFixed(2)}</div>
                                            </div>
                                            <div className="bg-green-100 rounded p-2 text-center">
                                                <div className="text-xs text-green-700">Maestro</div>
                                                <div className="font-bold text-green-800">${calculateCommission()?.teacherNet?.toFixed(2)}</div>
                                            </div>
                                            <div className="bg-amber-100 rounded p-2 text-center">
                                                <div className="text-xs text-amber-700">Reserva</div>
                                                <div className="font-bold text-amber-800">${calculateCommission()?.reserveAmount?.toFixed(2)}</div>
                                            </div>
                                            <div className="bg-purple-100 rounded p-2 text-center">
                                                <div className="text-xs text-purple-700">Escuela</div>
                                                <div className="font-bold text-purple-800">${calculateCommission()?.schoolAmount?.toFixed(2)}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
                <CustomerFiscalModal
                    isOpen={isFiscalModalOpen}
                    onClose={() => setIsFiscalModalOpen(false)}
                    onSave={handleNewCustomerSave}
                />
            </DialogContent>
        </Dialog>
    );
}
