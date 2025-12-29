"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar } from "lucide-react";
import { useBranch } from "@/context/branch-context";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PayrollEmployee {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    salary: number | null;
    paymentFrequency: string;
    lastPaymentDate: Date | null;
    isDue: boolean;
    nextPaymentDate: Date | null;
}

export function PayrollManager() {
    const { selectedBranch } = useBranch();
    const [employees, setEmployees] = useState<PayrollEmployee[]>([]);
    const [loading, setLoading] = useState(false);
    const [paying, setPaying] = useState<string | null>(null);

    const fetchPayroll = async () => {
        if (!selectedBranch?.businessId) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/finance/payroll?businessId=${selectedBranch.businessId}`);
            const data = await response.json();
            setEmployees(data);
        } catch (error) {
            console.error("Error fetching payroll:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayroll();
    }, [selectedBranch]);

    const handlePayEmployee = async (employeeId: string, amount: number) => {
        setPaying(employeeId);

        try {
            const response = await fetch("/api/finance/payroll", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ employeeId, amount })
            });

            if (response.ok) {
                await fetchPayroll(); // Refresh list
            }
        } catch (error) {
            console.error("Error paying employee:", error);
        } finally {
            setPaying(null);
        }
    };

    const getFrequencyLabel = (freq: string) => {
        const labels: Record<string, string> = {
            WEEKLY: "Semanal",
            BIWEEKLY: "Quincenal",
            MONTHLY: "Mensual",
            CUSTOM: "Personalizado"
        };
        return labels[freq] || freq;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Nómina de Empleados</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-8">Cargando...</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Empleado</TableHead>
                                <TableHead>Puesto</TableHead>
                                <TableHead>Salario</TableHead>
                                <TableHead>Frecuencia</TableHead>
                                <TableHead>Último Pago</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center">
                                        No hay empleados registrados
                                    </TableCell>
                                </TableRow>
                            ) : (
                                employees.map((employee) => (
                                    <TableRow key={employee.id}>
                                        <TableCell className="font-medium">
                                            {employee.firstName} {employee.lastName}
                                        </TableCell>
                                        <TableCell>{employee.role}</TableCell>
                                        <TableCell>
                                            {employee.salary ? `$${employee.salary.toFixed(2)}` : "N/A"}
                                        </TableCell>
                                        <TableCell>{getFrequencyLabel(employee.paymentFrequency)}</TableCell>
                                        <TableCell>
                                            {employee.lastPaymentDate
                                                ? format(new Date(employee.lastPaymentDate), "dd MMM yyyy", { locale: es })
                                                : "Nunca"}
                                        </TableCell>
                                        <TableCell>
                                            {employee.isDue ? (
                                                <Badge variant="destructive">Pendiente</Badge>
                                            ) : (
                                                <Badge className="bg-green-500">Al corriente</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {employee.isDue && employee.salary && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handlePayEmployee(employee.id, employee.salary!)}
                                                    disabled={paying === employee.id}
                                                >
                                                    <DollarSign className="mr-1 h-4 w-4" />
                                                    {paying === employee.id ? "Procesando..." : "Pagar"}
                                                </Button>
                                            )}
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
