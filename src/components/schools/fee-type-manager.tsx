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
import { Plus, Users } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";

interface FeeType {
    id: string;
    name: string;
    description: string;
    amount: number;
}

interface Student {
    id: string;
    firstName: string;
    lastName: string;
    matricula: string;
}

export function FeeTypeManager() {
    const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [selectedFeeType, setSelectedFeeType] = useState<FeeType | null>(null);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const { toast } = useToast();

    // Form states
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newAmount, setNewAmount] = useState("");
    const [assignDueDate, setAssignDueDate] = useState("");

    useEffect(() => {
        fetchFeeTypes();
        fetchStudents();
    }, []);

    const fetchFeeTypes = async () => {
        try {
            const res = await fetch("/api/schools/fees");
            if (res.ok) {
                const data = await res.json();
                setFeeTypes(data);
            }
        } catch (error) {
            console.error("Failed to fetch fee types", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const res = await fetch("/api/students"); // Assuming this endpoint exists or similar
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
            }
        } catch (error) {
            console.error("Failed to fetch students", error);
        }
    };

    const handleCreateFeeType = async () => {
        try {
            const res = await fetch("/api/schools/fees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newName,
                    description: newDesc,
                    amount: parseFloat(newAmount),
                }),
            });

            if (res.ok) {
                toast({ title: "Success", description: "Fee type created" });
                setIsCreateOpen(false);
                setNewName("");
                setNewDesc("");
                setNewAmount("");
                fetchFeeTypes();
            } else {
                toast({ title: "Error", description: "Failed to create fee type", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
        }
    };

    const handleAssignFee = async () => {
        if (!selectedFeeType || selectedStudents.length === 0 || !assignDueDate) return;

        try {
            const res = await fetch("/api/schools/fees/assign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentIds: selectedStudents,
                    feeTypeId: selectedFeeType.id,
                    title: selectedFeeType.name,
                    amount: selectedFeeType.amount,
                    dueDate: assignDueDate,
                }),
            });

            if (res.ok) {
                toast({ title: "Success", description: `Fee assigned to ${selectedStudents.length} students` });
                setIsAssignOpen(false);
                setSelectedStudents([]);
                setAssignDueDate("");
            } else {
                toast({ title: "Error", description: "Failed to assign fees", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
        }
    };

    const toggleStudentSelection = (studentId: string) => {
        setSelectedStudents((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev, studentId]
        );
    };

    const toggleAllStudents = () => {
        if (selectedStudents.length === students.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(students.map((s) => s.id));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Eventos y Cuotas</h2>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Evento/Cuota
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Crear Nuevo Tipo de Cobro</DialogTitle>
                            <DialogDescription>
                                Define un nuevo concepto de cobro (ej. Colegiatura, Excursión).
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nombre</Label>
                                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ej. Excursión al Museo" />
                            </div>
                            <div className="space-y-2">
                                <Label>Descripción</Label>
                                <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Opcional" />
                            </div>
                            <div className="space-y-2">
                                <Label>Monto ($)</Label>
                                <Input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="0.00" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateFeeType}>Guardar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Tipos de Cobro Disponibles</CardTitle>
                    <CardDescription>Gestiona los conceptos por los que puedes cobrar a los alumnos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Monto</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {feeTypes.map((fee) => (
                                <TableRow key={fee.id}>
                                    <TableCell className="font-medium">{fee.name}</TableCell>
                                    <TableCell>{fee.description}</TableCell>
                                    <TableCell>${fee.amount.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedFeeType(fee);
                                                setIsAssignOpen(true);
                                            }}
                                        >
                                            <Users className="mr-2 h-4 w-4" /> Asignar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {feeTypes.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No hay tipos de cobro registrados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Assign Modal */}
            <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Asignar Cobro: {selectedFeeType?.name}</DialogTitle>
                        <DialogDescription>
                            Selecciona los alumnos a los que deseas asignar este cobro de ${selectedFeeType?.amount}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="flex items-center gap-4">
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="dueDate">Fecha Límite de Pago</Label>
                                <Input
                                    type="date"
                                    id="dueDate"
                                    value={assignDueDate}
                                    onChange={(e) => setAssignDueDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="border rounded-md max-h-[400px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">
                                            <Checkbox
                                                checked={selectedStudents.length === students.length && students.length > 0}
                                                onCheckedChange={toggleAllStudents}
                                            />
                                        </TableHead>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Matrícula</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map((student) => (
                                        <TableRow key={student.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedStudents.includes(student.id)}
                                                    onCheckedChange={() => toggleStudentSelection(student.id)}
                                                />
                                            </TableCell>
                                            <TableCell>{student.firstName} {student.lastName}</TableCell>
                                            <TableCell>{student.matricula}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="text-sm text-muted-foreground text-right">
                            {selectedStudents.length} alumnos seleccionados
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAssignFee} disabled={selectedStudents.length === 0 || !assignDueDate}>
                            Confirmar Asignación
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
