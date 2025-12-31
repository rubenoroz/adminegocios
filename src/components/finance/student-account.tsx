"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, DollarSign, CreditCard, AlertCircle, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface StudentAccountProps {
    studentId: string;
}

interface Payment {
    id: string;
    amount: number;
    date: string;
    method: string;
}

interface Fee {
    id: string;
    title: string;
    amount: number;
    dueDate: string;
    status: string;
    originalAmount: number | null;
    discountApplied: number;
    payments: Payment[];
    template?: {
        name: string;
    };
}

interface AccountData {
    student: {
        id: string;
        name: string;
        matricula: string;
    };
    scholarships: Array<{
        id: string;
        name: string;
        percentage: number | null;
        amount: number | null;
    }>;
    fees: Fee[];
    summary: {
        totalCharges: number;
        totalPaid: number;
        totalPending: number;
        balance: number;
    };
}

export function StudentAccount({ studentId }: StudentAccountProps) {
    const [data, setData] = useState<AccountData | null>(null);
    const [loading, setLoading] = useState(true);
    const [paymentDialog, setPaymentDialog] = useState(false);
    const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const { toast } = useToast();

    useEffect(() => {
        fetchAccount();
    }, [studentId]);

    const fetchAccount = async () => {
        try {
            const res = await fetch(`/api/finance/students/${studentId}/account`);
            if (res.ok) {
                const accountData = await res.json();
                setData(accountData);
            }
        } catch (error) {
            console.error("Error fetching account:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!selectedFee || !paymentAmount) return;

        try {
            const res = await fetch("/api/finance/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentFeeId: selectedFee.id,
                    amount: paymentAmount,
                    method: paymentMethod,
                }),
            });

            if (res.ok) {
                toast({
                    title: "Pago registrado",
                    description: "El pago ha sido registrado correctamente.",
                });
                setPaymentDialog(false);
                setPaymentAmount("");
                fetchAccount();
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo registrar el pago.",
                variant: "destructive",
            });
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { label: string; className: string }> = {
            PAID: { label: "Pagado", className: "bg-green-100 text-green-800" },
            PARTIAL: { label: "Parcial", className: "bg-yellow-100 text-yellow-800" },
            PENDING: { label: "Pendiente", className: "bg-gray-100 text-gray-800" },
            OVERDUE: { label: "Vencido", className: "bg-red-100 text-red-800" },
        };
        const variant = variants[status] || variants.PENDING;
        return <Badge className={variant.className}>{variant.label}</Badge>;
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!data) {
        return <div>Error al cargar el estado de cuenta.</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Estado de Cuenta</h2>
                <p className="text-muted-foreground">
                    {data.student.name} • {data.student.matricula}
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cargos</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${data.summary.totalCharges.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">${data.summary.totalPaid.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saldo Pendiente</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">${data.summary.totalPending.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Becas Activas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.scholarships.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Fees Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Cargos y Pagos</CardTitle>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Crear Cargo
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Crear Nuevo Cargo</DialogTitle>
                            </DialogHeader>
                            <CreateFeeForm studentId={studentId} onSuccess={fetchAccount} />
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Concepto</TableHead>
                                <TableHead>Vencimiento</TableHead>
                                <TableHead>Monto</TableHead>
                                <TableHead>Pagado</TableHead>
                                <TableHead>Saldo</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.fees.map((fee) => {
                                const totalPaid = fee.payments.reduce((sum, p) => sum + p.amount, 0);
                                const balance = fee.amount - totalPaid;
                                return (
                                    <TableRow key={fee.id}>
                                        <TableCell className="font-medium">{fee.title}</TableCell>
                                        <TableCell>{format(new Date(fee.dueDate), "dd MMM yyyy", { locale: es })}</TableCell>
                                        <TableCell>${fee.amount.toFixed(2)}</TableCell>
                                        <TableCell className="text-green-600">${totalPaid.toFixed(2)}</TableCell>
                                        <TableCell className="text-red-600">${balance.toFixed(2)}</TableCell>
                                        <TableCell>{getStatusBadge(fee.status)}</TableCell>
                                        <TableCell className="text-right">
                                            {fee.status !== "PAID" && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedFee(fee);
                                                        setPaymentAmount(balance.toString());
                                                        setPaymentDialog(true);
                                                    }}
                                                >
                                                    Pagar
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Payment Dialog */}
            <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Pago</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Concepto</Label>
                            <Input value={selectedFee?.title || ""} disabled />
                        </div>
                        <div>
                            <Label>Monto a Pagar</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                            />
                        </div>
                        <div>
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
                        <Button onClick={handlePayment} className="w-full">
                            Registrar Pago
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function CreateFeeForm({ studentId, onSuccess }: { studentId: string; onSuccess: () => void }) {
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (!title || !amount || !dueDate) {
            toast({ title: "Error", description: "Todos los campos son requeridos", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/finance/fees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentId,
                    title,
                    amount: parseFloat(amount),
                    dueDate: new Date(dueDate).toISOString(),
                }),
            });

            if (res.ok) {
                toast({ title: "Cargo creado exitosamente" });
                onSuccess();
            } else {
                toast({ title: "Error", description: "No se pudo crear el cargo", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Ocurrió un error", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Concepto</Label>
                <Input placeholder="Ej. Colegiatura Diciembre" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label>Monto</Label>
                <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label>Fecha de Vencimiento</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Crear Cargo
            </Button>
        </div>
    );
}
