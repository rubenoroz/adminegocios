"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Building2, Users, MapPin, DoorOpen, X, Eye, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

interface Classroom {
    id: string;
    name: string;
    capacity?: number;
    building?: string;
}

export function ClassroomManager() {
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [newCapacity, setNewCapacity] = useState("");
    const [newBuilding, setNewBuilding] = useState("");
    const { toast } = useToast();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);


    useEffect(() => {
        fetchClassrooms();
    }, []);

    const fetchClassrooms = async () => {
        try {
            const res = await fetch("/api/classrooms");
            if (res.ok) {
                const data = await res.json();
                setClassrooms(data);
            }
        } catch (error) {
            console.error("Error fetching classrooms:", error);
        }
    };

    const openCreate = () => {
        setEditingId(null);
        setNewName("");
        setNewCapacity("");
        setNewBuilding("");
        setIsCreateOpen(true);
    };

    const openEdit = (cls: Classroom) => {
        setEditingId(cls.id);
        setNewName(cls.name);
        setNewCapacity(cls.capacity?.toString() || "");
        setNewBuilding(cls.building || "");
        setIsCreateOpen(true);
    };

    const handleSave = async () => {
        if (!newName.trim()) {
            toast({ title: "El nombre es requerido", variant: "destructive" });
            return;
        }

        try {
            const url = editingId ? `/api/classrooms/${editingId}` : "/api/classrooms";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newName,
                    capacity: newCapacity ? parseInt(newCapacity) : null,
                    building: newBuilding || null,
                }),
            });

            if (res.ok) {
                toast({ title: editingId ? "Salón actualizado" : "Salón creado" });
                setIsCreateOpen(false);
                fetchClassrooms();
                setEditingId(null);
            } else {
                throw new Error("Failed");
            }
        } catch (error) {
            toast({ title: "Error al guardar", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este salón?")) return;

        try {
            const res = await fetch(`/api/classrooms/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast({ title: "Salón eliminado" });
                fetchClassrooms();
            }
        } catch (error) {
            toast({ title: "Error al eliminar", variant: "destructive" });
        }
    };

    // ... render ...

    // En el botón de Crear del header: onClick={openCreate}
    // En el Dialog:
    //   Título: {editingId ? "Editar Salón" : "Nuevo Salón"}
    //   Botón Guardar: onClick={handleSave} {editingId ? "Guardar Cambios" : "Crear Salón"}

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Salones</h3>
                    <p className="text-sm text-slate-500 font-medium tracking-tight">Gestiona los salones disponibles</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <button onClick={openCreate} className="button-modern flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-sm py-2 px-6">
                            <Plus className="h-4 w-4" />
                            Nuevo Salón
                        </button>
                    </DialogTrigger>

                    <DialogContent
                        className="dialog-content rounded-3xl"
                        style={{ padding: '32px', maxWidth: '512px', border: 'none', backgroundColor: 'white' }}
                    >
                        <DialogTitle className="sr-only">{editingId ? "Editar salón" : "Nuevo salón"}</DialogTitle>
                        {/* Header */}
                        <div className="space-y-1" style={{ marginBottom: '18px' }}>
                            <h2 className="text-2xl font-bold text-gray-900">{editingId ? "Editar salón" : "Nuevo salón"}</h2>
                            <p className="text-sm text-gray-500 font-medium">
                                Gestiona horarios, capacidad y ubicación del espacio
                            </p>
                        </div>

                        {/* Form */}
                        <div className="flex flex-col">
                            <div className="space-y-2.5">
                                <Label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                    <DoorOpen className="h-5 w-5 text-blue-600" /> Nombre del salón
                                </Label>
                                <Input
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Ej. Aula 101, Laboratorio A"
                                    className="rounded-xl border-gray-200"
                                    style={{ height: '48px' }}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6" style={{ marginTop: '20px' }}>
                                <div className="space-y-2.5">
                                    <Label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                        <Users className="h-5 w-5 text-purple-600" /> Capacidad
                                    </Label>
                                    <Input
                                        type="number"
                                        value={newCapacity}
                                        onChange={(e) => setNewCapacity(e.target.value)}
                                        placeholder="Ej. 30"
                                        className="rounded-xl border-gray-200"
                                        style={{ height: '48px' }}
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <Label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                        <MapPin className="h-5 w-5 text-orange-600" /> Edificio / Piso
                                    </Label>
                                    <Input
                                        value={newBuilding}
                                        onChange={(e) => setNewBuilding(e.target.value)}
                                        placeholder="Ej. Edificio A, Piso 2"
                                        className="rounded-xl border-gray-200"
                                        style={{ height: '48px' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end items-center gap-4 border-t border-gray-50" style={{ paddingTop: '16px', marginTop: '12px' }}>
                            <button
                                onClick={() => setIsCreateOpen(false)}
                                className="button-modern gradient-red flex items-center gap-2 py-2.5 px-6 rounded-xl text-white font-bold shadow-md transition-all active:scale-95"
                            >
                                <X className="h-5 w-5" />
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="button-modern gradient-blue flex items-center gap-2 py-2.5 px-6 rounded-xl text-white font-bold shadow-md transition-all active:scale-95"
                            >
                                {editingId ? <Save className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                {editingId ? "Guardar cambios" : "Crear salón"}
                            </button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* List */}
            {classrooms.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200 mt-4">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-200 rounded-xl flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-slate-500" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-700 mb-1">No hay salones configurados</h4>
                    <p className="text-slate-500 text-sm">Crea tu primer salón para comenzar</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    {classrooms.map((classroom, index) => {
                        const classroomColors: Record<number, { bg: string; accent: string }> = {
                            0: { bg: '#DBEAFE', accent: '#2563EB' },
                            1: { bg: '#EDE9FE', accent: '#7C3AED' },
                            2: { bg: '#FCE7F3', accent: '#DB2777' },
                            3: { bg: '#FFEDD5', accent: '#EA580C' },
                            4: { bg: '#D1FAE5', accent: '#059669' },
                            5: { bg: '#CCFBF1', accent: '#0D9488' },
                        };
                        const colors = classroomColors[index % 6];

                        return (
                            <div
                                key={classroom.id}
                                className="group relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md"
                                style={{
                                    backgroundColor: colors.bg,
                                    borderRadius: '16px',
                                    padding: '20px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                }}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div
                                        className="flex items-center justify-center shadow-sm"
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            backgroundColor: 'white',
                                            color: colors.accent
                                        }}
                                    >
                                        <Building2 size={20} />
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEdit(classroom)}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '8px',
                                                backgroundColor: 'white',
                                                border: 'none',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <Eye size={16} color={colors.accent} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(classroom.id)}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '8px',
                                                backgroundColor: 'white',
                                                border: 'none',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <Trash2 size={16} color="#EF4444" />
                                        </button>
                                    </div>
                                </div>

                                <h4 style={{
                                    fontSize: '16px',
                                    fontWeight: '700',
                                    color: '#1E293B',
                                    marginBottom: '4px'
                                }}>
                                    {classroom.name}
                                </h4>

                                <div className="flex items-center justify-between mt-auto w-full">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm"
                                            style={{ color: colors.accent }}
                                        >
                                            <Users size={14} />
                                        </div>
                                        <div className="flex flex-col leading-none">
                                            <span className="text-[10px] font-bold uppercase opacity-70 mb-0.5" style={{ color: colors.accent }}>
                                                Capacidad
                                            </span>
                                            <span className="text-sm font-bold" style={{ color: colors.accent }}>
                                                {classroom.capacity || "--"} Alumnos
                                            </span>
                                        </div>
                                    </div>

                                    {classroom.building && (
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-right" style={{ color: colors.accent }}>
                                                {classroom.building}
                                            </span>
                                            <MapPin size={14} style={{ color: colors.accent }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
