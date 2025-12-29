"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranch } from "@/context/branch-context";
import { useToast } from "@/components/ui/use-toast";
import { SimpleDropdown } from "@/components/ui/simple-dropdown";

interface AssignFeeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function AssignFeeModal({ open, onOpenChange, onSuccess }: AssignFeeModalProps) {
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Data lists
    const [students, setStudents] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);

    // Form
    const [selectedStudentId, setSelectedStudentId] = useState<string>("");
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [dueDate, setDueDate] = useState("");

    useEffect(() => {
        if (open && selectedBranch?.businessId) {
            fetchStudents();
            fetchTemplates();
        }
    }, [open, selectedBranch]);

    const fetchStudents = async () => {
        if (!selectedBranch?.id) return;
        const res = await fetch(`/api/students?branchId=${selectedBranch.id}`);
        if (res.ok) setStudents(await res.json());
    };

    const fetchTemplates = async () => {
        if (!selectedBranch?.businessId) return;
        const res = await fetch(`/api/finance/templates?businessId=${selectedBranch.businessId}`);
        if (res.ok) setTemplates(await res.json());
    };

    const handleTemplateSelect = (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setTitle(template.name);
            setAmount(template.amount.toString());
        }
    };

    const handleAssign = async () => {
        if (!selectedStudentId || !title || !amount || !dueDate) return;

        setLoading(true);
        try {
            const res = await fetch("/api/finance/fees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentIds: [selectedStudentId],
                    title,
                    amount,
                    dueDate
                })
            });

            if (!res.ok) throw new Error("Failed to assign fee");

            toast({ title: "Cobro asignado exitosamente" });
            onSuccess();
            onOpenChange(false);
            // Reset form
            setSelectedStudentId("");
            setTitle("");
            setAmount("");
            setDueDate("");
        } catch (error) {
            console.error(error);
            toast({ title: "Error al asignar cobro", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Asignar Nuevo Cobro</DialogTitle>
                    <DialogDescription>Crea un cargo manual para un estudiante.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Estudiante</label>
                        <SimpleDropdown
                            options={students.map(s => ({ value: s.id, label: `${s.firstName} ${s.lastName}` }))}
                            onSelect={setSelectedStudentId}
                            searchPlaceholder="Buscar alumno..."
                            emptyMessage="No encontrado"
                            trigger={
                                <Button variant="outline" className="w-full justify-between text-left font-normal">
                                    {selectedStudentId
                                        ? students.find(s => s.id === selectedStudentId)?.firstName + " " + students.find(s => s.id === selectedStudentId)?.lastName
                                        : "Seleccionar alumno"}
                                </Button>
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Usar Plantilla (Opcional)</label>
                        <Select onValueChange={handleTemplateSelect}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar concepto..." />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.name} - ${t.amount}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Concepto</label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Colegiatura Enero" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Monto</label>
                            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Fecha Límite</label>
                            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleAssign} disabled={loading || !selectedStudentId || !title || !amount || !dueDate}>Asignar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
