"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, GraduationCap, CreditCard, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PaymentModal } from "@/components/parents/payment-modal";
import { ParentCommunicationFeed } from "@/components/parents/communication-feed";

export default function ParentDashboardPage() {
    const [parent, setParent] = useState<any>(null);
    const [selectedStudentId, setSelectedStudentId] = useState<string>("");
    const [studentData, setStudentData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Payment state
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedFee, setSelectedFee] = useState<any>(null);

    useEffect(() => {
        const parentData = localStorage.getItem("parentData");
        if (parentData) {
            const parsed = JSON.parse(parentData);
            setParent(parsed);
            if (parsed.students && parsed.students.length > 0) {
                setSelectedStudentId(parsed.students[0].student.id);
            }
        }
    }, []);

    useEffect(() => {
        if (selectedStudentId) {
            fetchStudentData(selectedStudentId);
        }
    }, [selectedStudentId]);

    const fetchStudentData = async (studentId: string) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("parentToken");
            const response = await fetch(`/api/parents/student-data?studentId=${studentId}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setStudentData(data);
            }
        } catch (error) {
            console.error("Error fetching student data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!parent) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Resumen Académico</h2>
                    <p className="text-muted-foreground">
                        Vista general del desempeño y estado de cuenta
                    </p>
                </div>

                {parent.students.length > 1 && (
                    <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Seleccionar hijo" />
                        </SelectTrigger>
                        <SelectContent>
                            {parent.students.map((s: any) => (
                                <SelectItem key={s.student.id} value={s.student.id}>
                                    {s.student.firstName} {s.student.lastName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            <ParentCommunicationFeed />

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader className="h-24 bg-gray-100" />
                            <CardContent className="h-32 bg-gray-50" />
                        </Card>
                    ))}
                </div>
            ) : studentData ? (
                <>
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {studentData.grades.length > 0
                                        ? (studentData.grades.reduce((acc: number, curr: any) => acc + curr.score, 0) / studentData.grades.length).toFixed(1)
                                        : "-"}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Basado en {studentData.grades.length} calificaciones
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Asistencia (Mes)</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {studentData.attendance.filter((a: any) => a.status === "PRESENT").length} / {studentData.attendance.length}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Días asistidos último mes
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">
                                    ${studentData.fees.reduce((acc: number, curr: any) => acc + curr.amount, 0).toFixed(2)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {studentData.fees.length} cargos por pagar
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="grades" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="grades">Calificaciones</TabsTrigger>
                            <TabsTrigger value="attendance">Asistencia</TabsTrigger>
                            <TabsTrigger value="finance">Pagos</TabsTrigger>
                        </TabsList>

                        <TabsContent value="grades" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Calificaciones Recientes</CardTitle>
                                    <CardDescription>Últimas evaluaciones registradas</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {studentData.grades.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-4">No hay calificaciones registradas</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {studentData.grades.map((grade: any) => (
                                                <div key={grade.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                                    <div>
                                                        <p className="font-medium">{grade.course.name}</p>
                                                        <p className="text-sm text-muted-foreground">{grade.type}</p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-sm text-muted-foreground">
                                                            {format(new Date(grade.createdAt), "d MMM", { locale: es })}
                                                        </span>
                                                        <Badge variant={grade.score >= 70 ? "default" : "destructive"}>
                                                            {grade.score}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="attendance" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Historial de Asistencia</CardTitle>
                                    <CardDescription>Registro del último mes</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {studentData.attendance.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-4">No hay registros de asistencia recientes</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {studentData.attendance.map((record: any) => (
                                                <div key={record.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <span>{format(new Date(record.date), "EEEE d 'de' MMMM", { locale: es })}</span>
                                                    </div>
                                                    <Badge variant={
                                                        record.status === "PRESENT" ? "outline" :
                                                            record.status === "ABSENT" ? "destructive" : "secondary"
                                                    }>
                                                        {record.status === "PRESENT" ? "Presente" :
                                                            record.status === "ABSENT" ? "Ausente" :
                                                                record.status === "LATE" ? "Retardo" : "Justificado"}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="finance" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Estado de Cuenta</CardTitle>
                                    <CardDescription>Cargos pendientes de pago</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {studentData.fees.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                                                <CreditCard className="h-6 w-6 text-green-600" />
                                            </div>
                                            <p className="font-medium text-green-700">¡Al día!</p>
                                            <p className="text-sm text-muted-foreground">No tienes pagos pendientes</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {studentData.fees.map((fee: any) => (
                                                <div key={fee.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                                    <div>
                                                        <p className="font-medium">{fee.title || "Colegiatura"}</p>
                                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                                            <AlertCircle className="h-3 w-3" />
                                                            Vence: {format(new Date(fee.dueDate), "d MMM yyyy", { locale: es })}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold">${fee.amount.toFixed(2)}</p>
                                                        <Button
                                                            size="sm"
                                                            className="mt-1"
                                                            onClick={() => {
                                                                setSelectedFee(fee);
                                                                setIsPaymentModalOpen(true);
                                                            }}
                                                        >
                                                            Pagar
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {selectedFee && (
                        <PaymentModal
                            isOpen={isPaymentModalOpen}
                            onClose={() => {
                                setIsPaymentModalOpen(false);
                                setSelectedFee(null);
                            }}
                            feeId={selectedFee.id}
                            amount={selectedFee.amount}
                            title={selectedFee.title || "Colegiatura"}
                        />
                    )}
                </>
            ) : (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Selecciona un alumno para ver su información</p>
                </div>
            )}
        </div>
    );
}
