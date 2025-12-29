"use client";

import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Users, AlertCircle } from "lucide-react";

interface FinancialStats {
    totalExpected: number;
    totalCollected: number;
    totalPending: number;
    totalOverdue: number;
    studentsWithDebt: number;
    totalStudents: number;
    activeScholarships: number;
    debtors: Array<{
        id: string;
        name: string;
        matricula: string;
        totalDebt: number;
        overdueCount: number;
    }>;
}

export function FinancialOverview() {
    const [stats, setStats] = useState<FinancialStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/schools/finance/stats");
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Failed to fetch stats", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-8">Cargando estadísticas...</div>;
    }

    if (!stats) {
        return <div className="text-center py-8 text-muted-foreground">No hay datos disponibles</div>;
    }

    const collectionRate = stats.totalExpected > 0
        ? (stats.totalCollected / stats.totalExpected) * 100
        : 0;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Resumen Financiero</h2>
                <p className="text-muted-foreground">
                    Vista general del estado de cobros y pagos
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos Esperados</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.totalExpected.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            Total de cobros generados
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recaudado</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">${stats.totalCollected.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            {collectionRate.toFixed(1)}% del total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pendiente</CardTitle>
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">${stats.totalPending.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            Por cobrar
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vencido</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">${stats.totalOverdue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            Pagos atrasados
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Alumnos con Deuda</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {stats.studentsWithDebt} / {stats.totalStudents}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.totalStudents > 0
                                ? ((stats.studentsWithDebt / stats.totalStudents) * 100).toFixed(1)
                                : 0}% del total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Becas Activas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">
                            {stats.activeScholarships}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Estudiantes con descuentos
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Tasa de Cobranza</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {collectionRate.toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Efectividad de cobro
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Debtors Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Alumnos con Deuda</CardTitle>
                    <CardDescription>
                        Lista de estudiantes con pagos pendientes o vencidos
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Matrícula</TableHead>
                                <TableHead>Deuda Total</TableHead>
                                <TableHead>Pagos Vencidos</TableHead>
                                <TableHead>Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.debtors.map((debtor) => (
                                <TableRow key={debtor.id}>
                                    <TableCell className="font-medium">{debtor.name}</TableCell>
                                    <TableCell>{debtor.matricula}</TableCell>
                                    <TableCell className="font-bold text-red-600">
                                        ${debtor.totalDebt.toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        {debtor.overdueCount > 0 ? (
                                            <Badge variant="destructive">{debtor.overdueCount}</Badge>
                                        ) : (
                                            <Badge variant="outline">0</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {debtor.overdueCount > 0 ? (
                                            <Badge variant="destructive">Moroso</Badge>
                                        ) : (
                                            <Badge className="bg-yellow-500">Pendiente</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {stats.debtors.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        ¡Excelente! No hay alumnos con deudas pendientes.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
