"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, Check, CreditCard, Calendar } from "lucide-react";
import { SimpleDropdown } from "@/components/ui/simple-dropdown";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface EnrollmentManagerProps {
    courseId: string;
}

export function EnrollmentManager({ courseId }: EnrollmentManagerProps) {
    const [students, setStudents] = useState<any[]>([]);
    const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
    const [courseDetails, setCourseDetails] = useState<any>(null);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchStudents();
        fetchEnrollments();
        fetchCourseDetails();
    }, [courseId]);

    const fetchCourseDetails = async () => {
        try {
            const res = await fetch(`/api/courses/${courseId}`);
            if (res.ok) {
                const data = await res.json();
                setCourseDetails(data);
            }
        } catch (error) {
            console.error("Error fetching course details:", error);
        }
    };

    const fetchStudents = async () => {
        const res = await fetch("/api/students");
        const data = await res.json();
        setStudents(data);
    };

    const fetchEnrollments = async () => {
        const res = await fetch(`/api/enrollments?courseId=${courseId}`);
        const data = await res.json();
        setEnrolledStudents(data.map((e: any) => e.student));
    };

    const handleStudentSelect = (studentId: string) => {
        setSelectedStudentId(studentId);
        setIsPaymentModalOpen(true);
    };

    const confirmEnrollment = async (scheme: "MONTHLY" | "UPFRONT") => {
        if (!selectedStudentId) return;
        setIsEnrolling(true);

        try {
            const res = await fetch("/api/enrollments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentIds: [selectedStudentId],
                    courseId,
                    paymentScheme: scheme
                })
            });

            if (res.ok) {
                toast({ title: "Alumno inscrito exitosamente" });
                setIsPaymentModalOpen(false);
                setSelectedStudentId(null);
                fetchEnrollments();
            } else {
                toast({ title: "Error al inscribir", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error al inscribir", variant: "destructive" });
        } finally {
            setIsEnrolling(false);
        }
    };

    // Filtrar estudiantes que no están inscritos
    const availableStudents = students
        .filter(s => !enrolledStudents.find(e => e.id === s.id))
        .map(student => ({
            value: student.id,
            label: `${student.firstName} ${student.lastName}`
        }));

    const getStudentName = (id: string | null) => {
        if (!id) return "";
        const s = students.find(s => s.id === id);
        return s ? `${s.firstName} ${s.lastName}` : "";
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);
    };

    return (
        <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Alumnos Inscritos ({enrolledStudents.length})</h3>
            <div className="flex flex-wrap gap-2 mb-4">
                {enrolledStudents.map((student) => (
                    <div key={student.id} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center shadow-sm border border-border">
                        {student.firstName} {student.lastName}
                    </div>
                ))}
            </div>

            <SimpleDropdown
                trigger={
                    <Button variant="outline" className="w-[200px] justify-between">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Inscribir Alumno
                    </Button>
                }
                options={availableStudents}
                onSelect={handleStudentSelect}
                searchPlaceholder="Buscar alumno..."
                emptyMessage="No hay alumnos disponibles"
            />

            {/* PAYMENT SCHEME SELECTION MODAL */}
            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Inscribir a {getStudentName(selectedStudentId)}</DialogTitle>
                        <DialogDescription>
                            Selecciona el esquema de pago para este alumno.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* MONTHLY OPTION */}
                        <div
                            onClick={() => confirmEnrollment("MONTHLY")}
                            className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-200">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-900">Mensualidad Recurrente</div>
                                    <div className="text-sm text-slate-500">Se cobrará cada mes</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-lg text-slate-900">{formatCurrency(courseDetails?.price)}</div>
                                <div className="text-xs text-slate-500">/ mes</div>
                            </div>
                        </div>

                        {/* UPFRONT OPTION */}
                        {courseDetails?.upfrontPrice && courseDetails.upfrontPrice > 0 && (
                            <div
                                onClick={() => confirmEnrollment("UPFRONT")}
                                className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 hover:border-green-500 hover:bg-green-50 cursor-pointer transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 group-hover:bg-green-200">
                                        <CreditCard size={20} />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-900">Pago Completo (Adelantado)</div>
                                        <div className="text-sm text-slate-500">Un solo pago, sin mensualidades</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-lg text-green-700">{formatCurrency(courseDetails?.upfrontPrice)}</div>
                                    <div className="text-xs text-green-600 font-medium">Pago Único</div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <p className="text-xs text-center w-full text-slate-400">
                            Al seleccionar una opción, se generará el cargo correspondiente inmediatamente.
                        </p>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
