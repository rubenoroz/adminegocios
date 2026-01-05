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
// Removed Select imports as they are replaced by PremiumSelect
import { useBranch } from "@/context/branch-context";
import { useToast } from "@/components/ui/use-toast";
import { PremiumSelect } from "@/components/ui/premium-select";

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

    // Template selection state
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

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
        setSelectedTemplateId(templateId);
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
            setSelectedTemplateId("");
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
            <DialogContent className="max-w-[500px] p-0 overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-2xl">
                <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Asignar Nuevo Cobro
                    </DialogTitle>
                    <DialogDescription className="text-slate-500">
                        Crea un cargo manual para un estudiante.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 px-6 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Estudiante</label>
                        <PremiumSelect
                            value={selectedStudentId}
                            onValueChange={setSelectedStudentId}
                            options={students.map(s => ({
                                value: s.id,
                                label: `${s.firstName} ${s.lastName}`,
                                // image prop removed as it's not in the interface either
                            }))}
                            placeholder="Seleccionar alumno..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Usar Plantilla (Opcional)</label>
                        <PremiumSelect
                            value={selectedTemplateId}
                            onValueChange={handleTemplateSelect}
                            options={templates.map(t => ({
                                value: t.id,
                                label: `${t.name} - $${t.amount}`
                            }))}
                            placeholder="Seleccionar concepto..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Concepto</label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej. Colegiatura Enero"
                            className="modern-input"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Monto</label>
                            <Input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="modern-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Fecha Límite</label>
                            <Input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="modern-input"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="button-modern !bg-white !text-slate-700 !border !border-slate-200 hover:!bg-slate-50 shadow-sm transition-all"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleAssign}
                        disabled={loading || !selectedStudentId || !title || !amount || !dueDate}
                        className="button-modern bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md border-none"
                    >
                        {loading ? "Asignando..." : "Asignar Cobro"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
