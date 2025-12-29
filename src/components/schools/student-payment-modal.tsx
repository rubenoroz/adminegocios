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
import { Loader2 } from "lucide-react";

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

    const handlePayment = async () => {
        if (!payingFeeId || !paymentAmount || !studentId) return;

        const commission = calculateCommission();

        try {
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PAID": return <Badge className="bg-green-500">Pagado</Badge>;
            case "PARTIAL": return <Badge className="bg-yellow-500">Parcial</Badge>;
            case "PENDING": return <Badge variant="outline">Pendiente</Badge>;
            case "OVERDUE": return <Badge variant="destructive">Vencido</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getRemainingBalance = (fee: Fee) => {
        const paid = fee.payments.reduce((sum, p) => sum + p.amount, 0);
        return fee.amount - paid;
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
                                        <TableHead className="text-right">Acción</TableHead>
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
                                                <TableCell>{getStatusBadge(fee.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    {!isPaid && (
                                                        <button
                                                            className="button-modern bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                                                            onClick={() => {
                                                                setPayingFeeId(fee.id);
                                                                setPaymentAmount(balance.toString());

                                                                // Auto-detect teacher from course
                                                                const courseTeacher = fee.course?.teacher;
                                                                if (courseTeacher) {
                                                                    // Find employee with same email that has commission
                                                                    const matchingEmployee = teachers.find(
                                                                        t => t.email === courseTeacher.email
                                                                    );
                                                                    if (matchingEmployee) {
                                                                        setSelectedTeacherId(matchingEmployee.id);
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            Pagar
                                                        </button>
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
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Método de Pago</Label>
                                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CASH">Efectivo</SelectItem>
                                                <SelectItem value="CARD">Tarjeta</SelectItem>
                                                <SelectItem value="TRANSFER">Transferencia</SelectItem>
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
                                                    <SelectTrigger style={{ width: 'auto', paddingRight: '8px' }}>
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
            </DialogContent>
        </Dialog>
    );
}
