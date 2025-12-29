"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Play, Trash2, Pause, PlayCircle } from "lucide-react";
import { useBranch } from "@/context/branch-context";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ScheduledPayment {
    id: string;
    type: string;
    recurrence: string;
    nextRunDate: Date;
    active: boolean;
    student?: { firstName: string; lastName: string };
    employee?: { firstName: string; lastName: string };
    feeTemplate?: { name: string; amount: number };
}

export function ScheduledPaymentsManager() {
    const { selectedBranch } = useBranch();
    const [payments, setPayments] = useState<ScheduledPayment[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [running, setRunning] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        type: "STUDENT_FEE",
        studentId: "",
        employeeId: "",
        feeTemplateId: "",
        recurrence: "MONTHLY",
        startDate: "",
        endDate: "",
        dayOfMonth: "",
        dayOfWeek: ""
    });

    const fetchPayments = async () => {
        if (!selectedBranch?.businessId) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/finance/scheduled-payments?businessId=${selectedBranch.businessId}`);
            const data = await response.json();
            setPayments(data);
        } catch (error) {
            console.error("Error fetching scheduled payments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [selectedBranch]);

    const handleCreate = async () => {
        if (!selectedBranch?.businessId) return;

        try {
            const response = await fetch("/api/finance/scheduled-payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    businessId: selectedBranch.businessId,
                    dayOfMonth: formData.dayOfMonth ? parseInt(formData.dayOfMonth) : null,
                    dayOfWeek: formData.dayOfWeek ? parseInt(formData.dayOfWeek) : null
                })
            });

            if (response.ok) {
                setOpen(false);
                fetchPayments();
                setFormData({
                    type: "STUDENT_FEE",
                    studentId: "",
                    employeeId: "",
                    feeTemplateId: "",
                    recurrence: "MONTHLY",
                    startDate: "",
                    endDate: "",
                    dayOfMonth: "",
                    dayOfWeek: ""
                });
            }
        } catch (error) {
            console.error("Error creating scheduled payment:", error);
        }
    };

    const handleToggleActive = async (id: string, currentActive: boolean) => {
        try {
            await fetch("/api/finance/scheduled-payments", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, active: !currentActive })
            });
            fetchPayments();
        } catch (error) {
            console.error("Error toggling payment:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este pago programado?")) return;

        try {
            await fetch(`/api/finance/scheduled-payments?id=${id}`, {
                method: "DELETE"
            });
            fetchPayments();
        } catch (error) {
            console.error("Error deleting payment:", error);
        }
    };

    const handleRunNow = async () => {
        if (!selectedBranch?.businessId) return;

        setRunning(true);
        try {
            const response = await fetch("/api/finance/scheduled-payments/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ businessId: selectedBranch.businessId })
            });

            const result = await response.json();
            alert(`Procesados: ${result.processedCount} de ${result.totalDue}`);
            fetchPayments();
        } catch (error) {
            console.error("Error running payments:", error);
        } finally {
            setRunning(false);
        }
    };

    const getRecurrenceLabel = (recurrence: string) => {
        const labels: Record<string, string> = {
            DAILY: "Diario",
            WEEKLY: "Semanal",
            BIWEEKLY: "Quincenal",
            MONTHLY: "Mensual",
            YEARLY: "Anual"
        };
        return labels[recurrence] || recurrence;
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Pagos Programados</CardTitle>
                        <CardDescription>Gestiona cargos y pagos recurrentes automáticos</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleRunNow} disabled={running} variant="outline">
                            <Play className="mr-2 h-4 w-4" />
                            {running ? "Procesando..." : "Ejecutar Ahora"}
                        </Button>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nuevo Pago Programado
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Programar Pago Recurrente</DialogTitle>
                                    <DialogDescription>
                                        Configura un pago automático recurrente
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Tipo</Label>
                                            <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="STUDENT_FEE">Cargo de Estudiante</SelectItem>
                                                    <SelectItem value="EMPLOYEE_SALARY">Pago de Nómina</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Frecuencia</Label>
                                            <Select value={formData.recurrence} onValueChange={(v) => setFormData({ ...formData, recurrence: v })}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="DAILY">Diario</SelectItem>
                                                    <SelectItem value="WEEKLY">Semanal</SelectItem>
                                                    <SelectItem value="BIWEEKLY">Quincenal</SelectItem>
                                                    <SelectItem value="MONTHLY">Mensual</SelectItem>
                                                    <SelectItem value="YEARLY">Anual</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Fecha de Inicio</Label>
                                            <Input
                                                type="date"
                                                value={formData.startDate}
                                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Fecha de Fin (Opcional)</Label>
                                            <Input
                                                type="date"
                                                value={formData.endDate}
                                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    {formData.recurrence === "MONTHLY" && (
                                        <div className="space-y-2">
                                            <Label>Día del Mes (1-31)</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="31"
                                                value={formData.dayOfMonth}
                                                onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })}
                                            />
                                        </div>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        Nota: Debes configurar los IDs manualmente por ahora. Próximamente se agregará selector visual.
                                    </p>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleCreate}>Crear</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-8">Cargando...</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Destinatario</TableHead>
                                <TableHead>Frecuencia</TableHead>
                                <TableHead>Próxima Ejecución</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">
                                        No hay pagos programados
                                    </TableCell>
                                </TableRow>
                            ) : (
                                payments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell>
                                            {payment.type === "STUDENT_FEE" ? "Cargo Estudiante" : "Nómina"}
                                        </TableCell>
                                        <TableCell>
                                            {payment.student && `${payment.student.firstName} ${payment.student.lastName}`}
                                            {payment.employee && `${payment.employee.firstName} ${payment.employee.lastName}`}
                                            {payment.feeTemplate && ` - ${payment.feeTemplate.name}`}
                                        </TableCell>
                                        <TableCell>{getRecurrenceLabel(payment.recurrence)}</TableCell>
                                        <TableCell>
                                            {format(new Date(payment.nextRunDate), "dd MMM yyyy", { locale: es })}
                                        </TableCell>
                                        <TableCell>
                                            {payment.active ? (
                                                <Badge className="bg-green-500">Activo</Badge>
                                            ) : (
                                                <Badge variant="secondary">Pausado</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleToggleActive(payment.id, payment.active)}
                                                >
                                                    {payment.active ? <Pause className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(payment.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
