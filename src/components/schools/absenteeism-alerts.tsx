"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Mail, Phone, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Alert {
    student: {
        id: string;
        name: string;
        matricula: string;
        email: string | null;
    };
    course: {
        id: string;
        name: string;
    };
    stats: {
        totalClasses: number;
        absences: number;
        absenceRate: number;
    };
    riskLevel: "HIGH" | "MODERATE";
}

export function AbsenteeismAlerts() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const res = await fetch("/api/reports/attendance/alerts");
            if (res.ok) {
                const data = await res.json();
                setAlerts(data);
            }
        } catch (error) {
            console.error("Error fetching alerts:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <Card className="border-red-100">
            <CardHeader className="bg-red-50/50">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <CardTitle className="text-red-900">Alerta de Ausentismo</CardTitle>
                </div>
                <CardDescription className="text-red-800/80">
                    Alumnos con alto riesgo de reprobación por faltas (últimos 30 días)
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                {alerts.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                        <div className="flex justify-center mb-2">
                            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-xl">👍</span>
                            </div>
                        </div>
                        No hay alumnos en riesgo actualmente.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {alerts.map((alert, index) => (
                            <div
                                key={`${alert.student.id}-${alert.course.id}`}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-white shadow-sm gap-4"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">{alert.student.name}</span>
                                        <Badge
                                            variant={alert.riskLevel === "HIGH" ? "destructive" : "secondary"}
                                            className={alert.riskLevel === "MODERATE" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : ""}
                                        >
                                            {alert.riskLevel === "HIGH" ? "Riesgo Alto" : "Riesgo Moderado"}
                                        </Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {alert.course.name} • {alert.student.matricula}
                                    </div>
                                    <div className="text-sm font-medium text-red-600">
                                        {alert.stats.absences} faltas de {alert.stats.totalClasses} clases ({alert.stats.absenceRate}%)
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {alert.student.email && (
                                        <a
                                            href={`mailto:${alert.student.email}`}
                                            className="inline-flex items-center justify-center h-9 px-3 text-sm font-medium border rounded-md hover:bg-accent"
                                        >
                                            <Mail className="h-4 w-4 mr-2" />
                                            Contactar
                                        </a>
                                    )}
                                    <Link href={`/dashboard/students/${alert.student.id}/notes`}>
                                        <Button variant="ghost" size="sm">
                                            Ver Notas
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
