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
import { Plus, Sparkles } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

interface Template {
    id: string;
    name: string;
    category: string;
    amount: number;
    recurrence: string;
    dayDue: number | null;
    lateFee: number | null;
}

interface Student {
    id: string;
    firstName: string;
    lastName: string;
    matricula: string;
}

export function TemplateManager() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const { toast } = useToast();

    // Form states
    const [newName, setNewName] = useState("");
    const [newCategory, setNewCategory] = useState("TUITION");
    const [newAmount, setNewAmount] = useState("");
    const [newRecurrence, setNewRecurrence] = useState("MONTHLY");
    const [newDayDue, setNewDayDue] = useState("");
    const [newLateFee, setNewLateFee] = useState("");
    const [generateDueDate, setGenerateDueDate] = useState("");

    useEffect(() => {
        fetchTemplates();
        fetchStudents();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await fetch("/api/schools/finance/templates");
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error("Failed to fetch templates", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const res = await fetch("/api/students");
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
            }
        } catch (error) {
            console.error("Failed to fetch students", error);
        }
    };

    const handleCreateTemplate = async () => {
        try {
            const res = await fetch("/api/schools/finance/templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newName,
                    category: newCategory,
                    amount: parseFloat(newAmount),
                    recurrence: newRecurrence,
                    dayDue: newDayDue ? parseInt(newDayDue) : null,
                    lateFee: newLateFee ? parseFloat(newLateFee) : null,
                }),
            });

            if (res.ok) {
                toast({ title: "Plantilla creada", description: "La plantilla se ha guardado correctamente" });
                setIsCreateOpen(false);
                resetForm();
                fetchTemplates();
            } else {
                toast({ title: "Error", description: "No se pudo crear la plantilla", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Ocurrió un error", variant: "destructive" });
        }
    };

    const handleGenerateFees = async () => {
        if (!selectedTemplate || selectedStudents.length === 0 || !generateDueDate) return;

        try {
            const res = await fetch("/api/schools/finance/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    templateId: selectedTemplate.id,
                    studentIds: selectedStudents,
                    dueDate: generateDueDate,
                    title: selectedTemplate.name,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                toast({
                    title: "Cobros generados",
                    description: `Se generaron ${data.count} cobros exitosamente`
                });
                setIsGenerateOpen(false);
                setSelectedStudents([]);
                setGenerateDueDate("");
            } else {
                toast({ title: "Error", description: "No se pudieron generar los cobros", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Ocurrió un error", variant: "destructive" });
        }
    };

    const resetForm = () => {
        setNewName("");
        setNewCategory("TUITION");
        setNewAmount("");
        setNewRecurrence("MONTHLY");
        setNewDayDue("");
        setNewLateFee("");
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

    const getCategoryBadge = (category: string) => {
        const colors: Record<string, string> = {
            TUITION: "bg-blue-500",
            REGISTRATION: "bg-green-500",
            EVENT: "bg-purple-500",
            MATERIAL: "bg-orange-500",
            TRANSPORT: "bg-yellow-500",
            OTHER: "bg-gray-500",
        };
        return <Badge className={colors[category] || "bg-gray-500"}>{category}</Badge>;
    };

    const getRecurrenceBadge = (recurrence: string) => {
        return recurrence === "MONTHLY" ? (
            <Badge variant="outline">Mensual</Badge>
        ) : recurrence === "ANNUAL" ? (
            <Badge variant="outline">Anual</Badge>
        ) : (
            <Badge variant="outline">Único</Badge>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Plantillas de Cobro</h2>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Nueva Plantilla
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Crear Plantilla de Cobro</DialogTitle>
                            <DialogDescription>
                                Define un concepto de cobro reutilizable.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nombre</Label>
                                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ej. Colegiatura Primaria 2024" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Categoría</Label>
                                    <Select value={newCategory} onValueChange={setNewCategory}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="TUITION">Colegiatura</SelectItem>
                                            <SelectItem value="REGISTRATION">Inscripción</SelectItem>
                                            <SelectItem value="EVENT">Evento</SelectItem>
                                            <SelectItem value="MATERIAL">Material</SelectItem>
                                            <SelectItem value="TRANSPORT">Transporte</SelectItem>
                                            <SelectItem value="OTHER">Otro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Recurrencia</Label>
                                    <Select value={newRecurrence} onValueChange={setNewRecurrence}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MONTHLY">Mensual</SelectItem>
                                            <SelectItem value="ANNUAL">Anual</SelectItem>
                                            <SelectItem value="ONE_TIME">Único</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Monto ($)</Label>
                                    <Input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="0.00" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Día de Vencimiento</Label>
                                    <Input type="number" value={newDayDue} onChange={(e) => setNewDayDue(e.target.value)} placeholder="5" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Recargo por Mora ($)</Label>
                                <Input type="number" value={newLateFee} onChange={(e) => setNewLateFee(e.target.value)} placeholder="0.00" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateTemplate}>Guardar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Plantillas Disponibles</CardTitle>
                    <CardDescription>Gestiona las plantillas para generar cobros automáticamente.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead>Recurrencia</TableHead>
                                <TableHead>Monto</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {templates.map((template) => (
                                <TableRow key={template.id}>
                                    <TableCell className="font-medium">{template.name}</TableCell>
                                    <TableCell>{getCategoryBadge(template.category)}</TableCell>
                                    <TableCell>{getRecurrenceBadge(template.recurrence)}</TableCell>
                                    <TableCell>${template.amount.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedTemplate(template);
                                                setIsGenerateOpen(true);
                                            }}
                                        >
                                            <Sparkles className="mr-2 h-4 w-4" /> Generar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {templates.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No hay plantillas registradas.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Generate Modal */}
            <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Generar Cobros: {selectedTemplate?.name}</DialogTitle>
                        <DialogDescription>
                            Selecciona los alumnos y fecha de vencimiento. El sistema aplicará descuentos automáticamente.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="flex items-center gap-4">
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="dueDate">Fecha de Vencimiento</Label>
                                <Input
                                    type="date"
                                    id="dueDate"
                                    value={generateDueDate}
                                    onChange={(e) => setGenerateDueDate(e.target.value)}
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
                        <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>Cancelar</Button>
                        <Button onClick={handleGenerateFees} disabled={selectedStudents.length === 0 || !generateDueDate}>
                            Generar Cobros
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
