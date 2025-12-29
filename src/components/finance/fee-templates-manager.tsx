"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Tag, Trash2, Calendar, DollarSign } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranch } from "@/context/branch-context";
import { useToast } from "@/components/ui/use-toast";

export function FeeTemplatesManager() {
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("TUITION");
    const [recurrence, setRecurrence] = useState("MONTHLY");

    const fetchTemplates = async () => {
        if (!selectedBranch?.businessId) return;
        try {
            const res = await fetch(`/api/finance/templates?businessId=${selectedBranch.businessId}`);
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error("Error fetching templates:", error);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, [selectedBranch]);

    const handleCreate = async () => {
        if (!name || !amount || !selectedBranch?.businessId) return;

        setLoading(true);
        try {
            const res = await fetch("/api/finance/templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    amount,
                    category,
                    recurrence,
                    businessId: selectedBranch.businessId
                })
            });

            if (!res.ok) throw new Error("Failed to create template");

            toast({ title: "Concepto creado exitosamente" });
            fetchTemplates();
            setIsAddOpen(false);
            setName("");
            setAmount("");
        } catch (error) {
            console.error(error);
            toast({ title: "Error al crear concepto", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Conceptos de Cobro</h2>
                    <p className="text-sm text-slate-500 mt-1">Define los cargos estándar (colegiaturas, inscripciones, etc.)</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <button className="button-modern bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 flex items-center gap-2" style={{ borderRadius: '8px' }}>
                            <Plus className="h-4 w-4" /> Nuevo Concepto
                        </button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Crear Nuevo Concepto</DialogTitle>
                            <DialogDescription>Define un cargo recurrente o único.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nombre del Concepto</label>
                                <Input
                                    placeholder="Ej: Colegiatura Mensual - Primaria"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Monto</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input
                                            type="number"
                                            className="pl-8"
                                            placeholder="0.00"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Categoría</label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="TUITION">Colegiatura</SelectItem>
                                            <SelectItem value="REGISTRATION">Inscripción</SelectItem>
                                            <SelectItem value="MATERIAL">Materiales</SelectItem>
                                            <SelectItem value="EVENT">Evento</SelectItem>
                                            <SelectItem value="TRANSPORT">Transporte</SelectItem>
                                            <SelectItem value="OTHER">Otro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Frecuencia Sugerida</label>
                                <Select value={recurrence} onValueChange={setRecurrence}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MONTHLY">Mensual</SelectItem>
                                        <SelectItem value="ONE_TIME">Pago Único</SelectItem>
                                        <SelectItem value="ANNUAL">Anual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
                            <Button onClick={handleCreate} disabled={!name || !amount || loading}>crear</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template, index) => {
                    const colors = [
                        { bg: '#DBEAFE', accent: '#2563EB', iconBg: '#3B82F6' },
                        { bg: '#EDE9FE', accent: '#7C3AED', iconBg: '#8B5CF6' },
                        { bg: '#D1FAE5', accent: '#059669', iconBg: '#10B981' },
                        { bg: '#FCE7F3', accent: '#DB2777', iconBg: '#EC4899' },
                        { bg: '#FFEDD5', accent: '#EA580C', iconBg: '#F97316' },
                        { bg: '#CCFBF1', accent: '#0D9488', iconBg: '#14B8A6' },
                    ];
                    const colorSet = colors[index % 6];

                    return (
                        <div
                            key={template.id}
                            className="rounded-2xl transition-all hover:scale-[1.02] cursor-pointer"
                            style={{
                                backgroundColor: colorSet.bg,
                                padding: '24px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                            }}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        backgroundColor: colorSet.iconBg,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                    }}
                                >
                                    <Tag className="h-6 w-6 text-white" />
                                </div>
                            </div>
                            <h3 className="font-bold text-lg mb-2" style={{ color: '#1E293B' }}>{template.name}</h3>
                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="text-3xl font-bold" style={{ color: colorSet.accent }}>
                                    ${template.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-sm font-medium" style={{ color: '#64748B' }}>MXN</span>
                            </div>
                            <div
                                className="flex items-center gap-2 text-sm font-medium"
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.6)',
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    color: colorSet.accent
                                }}
                            >
                                <Calendar className="h-4 w-4" />
                                <span>{template.recurrence === 'MONTHLY' ? 'Mensual' : template.recurrence === 'ONE_TIME' ? 'Pago Único' : 'Anual'}</span>
                            </div>
                        </div>
                    );
                })}

                {templates.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                        No hay conceptos definidos. Crea uno para comenzar.
                    </div>
                )}
            </div>
        </div>
    );
}
