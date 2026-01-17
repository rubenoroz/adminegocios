"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Award, Trash2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

interface Scholarship {
    id: string;
    name: string;
    percentage: number | null;
    amount: number | null;
    active: boolean;
    scheduleId: string | null;
    schedule?: {
        id: string;
        groupName: string;
        course?: {
            name: string;
        };
    } | null;
    student: {
        id: string;
        firstName: string;
        lastName: string;
        matricula: string;
    };
}

interface Student {
    id: string;
    firstName: string;
    lastName: string;
    matricula: string;
    scheduleEnrollments?: {
        scheduleId: string;
        schedule: {
            id: string;
            groupName: string;
            course?: {
                name: string;
            };
        };
    }[];
}

export function ScholarshipManager() {
    const [scholarships, setScholarships] = useState<Scholarship[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const { toast } = useToast();

    // Form states
    const [selectedStudent, setSelectedStudent] = useState("");
    const [selectedSchedule, setSelectedSchedule] = useState("");
    const [scholarshipName, setScholarshipName] = useState("");
    const [discountType, setDiscountType] = useState<"percentage" | "amount">("percentage");
    const [discountValue, setDiscountValue] = useState("");

    // Get enrollments for selected student
    const selectedStudentData = students.find(s => s.id === selectedStudent);
    const studentEnrollments = selectedStudentData?.scheduleEnrollments || [];
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchScholarships();
        fetchStudents();
    }, []);

    const fetchScholarships = async () => {
        try {
            const res = await fetch("/api/schools/finance/scholarships");
            if (res.ok) {
                const data = await res.json();
                setScholarships(data);
            }
        } catch (error) {
            console.error("Failed to fetch scholarships", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            // Fetch enhanced students with enrollments
            const res = await fetch("/api/students/enhanced");
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
            }
        } catch (error) {
            console.error("Failed to fetch students", error);
        }
    };

    const handleCreateScholarship = async () => {
        if (!selectedStudent || !scholarshipName || !discountValue) {
            toast({
                title: "Error",
                description: "Por favor completa todos los campos",
                variant: "destructive"
            });
            return;
        }
        if (isSaving) return;
        setIsSaving(true);

        try {
            const payload: any = {
                studentId: selectedStudent,
                name: scholarshipName,
                scheduleId: selectedSchedule || null, // null = applies to all groups
            };

            if (discountType === "percentage") {
                payload.percentage = parseFloat(discountValue);
            } else {
                payload.amount = parseFloat(discountValue);
            }

            const res = await fetch("/api/schools/finance/scholarships", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast({
                    title: "Beca creada",
                    description: "La beca se ha asignado correctamente"
                });
                setIsCreateOpen(false);
                resetForm();
                fetchScholarships();
            } else {
                toast({
                    title: "Error",
                    description: "No se pudo crear la beca",
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Ocurrió un error",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteScholarship = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar esta beca?")) return;

        try {
            const res = await fetch(`/api/schools/finance/scholarships/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast({ title: "Beca eliminada" });
                fetchScholarships();
            } else {
                toast({
                    title: "Error",
                    description: "No se pudo eliminar la beca",
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Ocurrió un error",
                variant: "destructive"
            });
        }
    };

    const resetForm = () => {
        setSelectedStudent("");
        setSelectedSchedule("");
        setScholarshipName("");
        setDiscountType("percentage");
        setDiscountValue("");
    };

    const getDiscountDisplay = (scholarship: Scholarship) => {
        if (scholarship.percentage) {
            return `${scholarship.percentage}%`;
        } else if (scholarship.amount) {
            return `$${scholarship.amount.toFixed(2)}`;
        }
        return "-";
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Gestión de Becas</h2>
                    <p className="text-muted-foreground">
                        Asigna y administra becas para estudiantes
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Nueva Beca
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Asignar Beca</DialogTitle>
                            <DialogDescription>
                                Otorga un descuento permanente a un estudiante.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Estudiante</Label>
                                <Select value={selectedStudent} onValueChange={(val) => { setSelectedStudent(val); setSelectedSchedule(""); }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un estudiante" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {students.map((student) => (
                                            <SelectItem key={student.id} value={student.id}>
                                                {student.firstName} {student.lastName} - {student.matricula}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedStudent && studentEnrollments.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Grupo (opcional - déjalo vacío para aplicar a todos)</Label>
                                    <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos los grupos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Todos los grupos</SelectItem>
                                            {studentEnrollments.map((enrollment: any) => (
                                                <SelectItem key={enrollment.scheduleId} value={enrollment.scheduleId}>
                                                    {enrollment.schedule?.groupName || 'Grupo'} - {enrollment.schedule?.course?.name || 'Sin curso'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Si seleccionas un grupo, la beca solo aplica a ese grupo específico.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Nombre de la Beca</Label>
                                <Input
                                    value={scholarshipName}
                                    onChange={(e) => setScholarshipName(e.target.value)}
                                    placeholder="Ej. Beca Excelencia Académica"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tipo de Descuento</Label>
                                    <Select
                                        value={discountType}
                                        onValueChange={(v) => setDiscountType(v as "percentage" | "amount")}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                                            <SelectItem value="amount">Monto Fijo ($)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Valor</Label>
                                    <Input
                                        type="number"
                                        value={discountValue}
                                        onChange={(e) => setDiscountValue(e.target.value)}
                                        placeholder={discountType === "percentage" ? "20" : "500.00"}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateScholarship} disabled={isSaving} className="flex items-center gap-2">
                                {isSaving && <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />}
                                {isSaving ? "Asignando..." : "Asignar Beca"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Becas Activas</CardTitle>
                    <CardDescription>
                        Lista de todos los estudiantes con becas asignadas.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Estudiante</TableHead>
                                <TableHead>Matrícula</TableHead>
                                <TableHead>Grupo</TableHead>
                                <TableHead>Nombre de Beca</TableHead>
                                <TableHead>Descuento</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {scholarships.map((scholarship) => (
                                <TableRow key={scholarship.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Award className="h-4 w-4 text-yellow-500" />
                                            {scholarship.student.firstName} {scholarship.student.lastName}
                                        </div>
                                    </TableCell>
                                    <TableCell>{scholarship.student.matricula}</TableCell>
                                    <TableCell>
                                        {scholarship.schedule ? (
                                            <Badge variant="outline" className="text-xs">
                                                {scholarship.schedule.groupName || 'Grupo'} - {scholarship.schedule.course?.name || ''}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">Todos los grupos</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{scholarship.name}</TableCell>
                                    <TableCell className="font-semibold text-green-600">
                                        {getDiscountDisplay(scholarship)}
                                    </TableCell>
                                    <TableCell>
                                        {scholarship.active ? (
                                            <Badge className="bg-green-500">Activa</Badge>
                                        ) : (
                                            <Badge variant="secondary">Inactiva</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteScholarship(scholarship.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {scholarships.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No hay becas asignadas aún.
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
