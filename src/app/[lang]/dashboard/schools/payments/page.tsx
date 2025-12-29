"use client";

import { FeeTypeManager } from "@/components/schools/fee-type-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SchoolPaymentsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Pagos y Cobros</h1>
                <p className="text-muted-foreground">
                    Gestiona los eventos de cobro, asigna cuotas y revisa el estado de pagos.
                </p>
            </div>

            <Tabs defaultValue="events" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="events">Eventos y Cuotas</TabsTrigger>
                    <TabsTrigger value="debtors">Deudores</TabsTrigger>
                    <TabsTrigger value="history">Historial de Pagos</TabsTrigger>
                </TabsList>

                <TabsContent value="events" className="space-y-4">
                    <FeeTypeManager />
                </TabsContent>

                <TabsContent value="debtors">
                    <Card>
                        <CardHeader>
                            <CardTitle>Reporte de Deudores</CardTitle>
                            <CardDescription>
                                Lista de estudiantes con pagos pendientes o vencidos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center h-40 text-muted-foreground">
                                Próximamente: Reporte detallado de deudores.
                                <br />
                                Por ahora, ve a la lista de estudiantes para ver y registrar pagos individuales.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial de Transacciones</CardTitle>
                            <CardDescription>
                                Todos los pagos recibidos recientemente.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center h-40 text-muted-foreground">
                                Próximamente: Historial global de pagos.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
