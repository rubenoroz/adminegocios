"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Users, Mail, Phone, MoreHorizontal, Ban, Trash2, PlayCircle, Edit, X, Check } from "lucide-react";
import { useBranch } from "@/context/branch-context";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface ParentAccount {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    status: string;
    students: Array<{
        student: {
            id: string;
            firstName: string;
            lastName: string;
            matricula?: string;
        };
        relationship: string;
    }>;
}

interface Student {
    id: string;
    firstName: string;
    lastName: string;
    matricula?: string;
}

export function ParentAccountsManager() {
    const { selectedBranch } = useBranch();
    const [parents, setParents] = useState<ParentAccount[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [tempPassword, setTempPassword] = useState("");

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        studentIds: [] as string[],
        relationships: [] as string[]
    });

    // Estados para selección múltiple
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);

    const fetchParents = async () => {
        if (!selectedBranch?.businessId) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/parents?businessId=${selectedBranch.businessId}`);
            const data = await response.json();
            setParents(data);
        } catch (error) {
            console.error("Error fetching parents:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        if (!selectedBranch?.id) return;

        try {
            const response = await fetch(`/api/students?branchId=${selectedBranch.id}`);
            const data = await response.json();
            setStudents(data);
        } catch (error) {
            console.error("Error fetching students:", error);
        }
    };

    useEffect(() => {
        fetchParents();
        fetchStudents();
    }, [selectedBranch]);

    const handleCreate = async () => {
        if (!selectedBranch?.businessId) return;

        try {
            const response = await fetch("/api/parents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    businessId: selectedBranch.businessId
                })
            });

            const data = await response.json();

            if (response.ok) {
                setTempPassword(data.tempPassword);
                fetchParents();
                setFormData({
                    firstName: "",
                    lastName: "",
                    email: "",
                    phone: "",
                    studentIds: [],
                    relationships: []
                });
                // Don't close dialog yet, show password first
            } else {
                alert("Error al crear cuenta de padre");
            }
        } catch (error) {
            console.error("Error creating parent:", error);
        }
    };

    const addStudent = () => {
        setFormData({
            ...formData,
            studentIds: [...formData.studentIds, ""],
            relationships: [...formData.relationships, "GUARDIAN"]
        });
    };

    const removeStudent = (index: number) => {
        setFormData({
            ...formData,
            studentIds: formData.studentIds.filter((_, i) => i !== index),
            relationships: formData.relationships.filter((_, i) => i !== index)
        });
    };

    const updateStudent = (index: number, studentId: string) => {
        const newStudentIds = [...formData.studentIds];
        newStudentIds[index] = studentId;
        setFormData({ ...formData, studentIds: newStudentIds });
    };

    const updateRelationship = (index: number, relationship: string) => {
        const newRelationships = [...formData.relationships];
        newRelationships[index] = relationship;
        setFormData({ ...formData, relationships: newRelationships });
    };

    const getRelationshipLabel = (rel: string) => {
        const labels: Record<string, string> = {
            FATHER: "Padre",
            MOTHER: "Madre",
            GUARDIAN: "Tutor",
            OTHER: "Otro"
        };
        return labels[rel] || rel;
    };

    const handleStatusChange = async (parentId: string, newStatus: string) => {
        try {
            await fetch(`/api/parents/${parentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            fetchParents();
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const handleDelete = async (parentId: string) => {
        if (!confirm("¿Estás seguro de eliminar esta cuenta de padre?")) return;
        try {
            await fetch(`/api/parents/${parentId}`, {
                method: "DELETE"
            });
            fetchParents();
        } catch (error) {
            console.error("Failed to delete parent", error);
        }
    };

    // Filter out ARCHIVED parents
    const activeParents = parents.filter(p => p.status !== "ARCHIVED");

    // Funciones para selección múltiple
    const toggleSelectionMode = () => {
        const nextMode = !isSelectionMode;
        setIsSelectionMode(nextMode);
        if (!nextMode) setSelectedIds([]);
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`¿Eliminar ${selectedIds.length} cuentas de padres permanentemente?`)) return;

        setIsDeletingBulk(true);
        try {
            for (const id of selectedIds) {
                await fetch(`/api/parents/${id}`, { method: "DELETE" });
            }
            setSelectedIds([]);
            setIsSelectionMode(false);
            fetchParents();
        } catch (error) {
            console.error("Error al eliminar padres", error);
        } finally {
            setIsDeletingBulk(false);
        }
    };

    return (
        <div className="bg-slate-100 pb-16">
            {/* HEADER - MISMO PATRÓN QUE EMPLEADOS/ALUMNOS */}
            <div style={{
                padding: 'var(--spacing-lg)',
                marginBottom: '32px',
                position: 'relative',
                zIndex: 10
            }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
                            Cuentas de Padres
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            {selectedBranch ? `Sucursal: ${selectedBranch.name}` : "Gestiona las cuentas de padres"}
                        </p>
                    </div>
                    <Dialog open={open} onOpenChange={(isOpen) => {
                        setOpen(isOpen);
                        if (!isOpen) setTempPassword("");
                    }}>
                        <DialogTrigger asChild>
                            <button className="button-modern flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600">
                                <Plus size={18} />
                                Nueva Cuenta de Padre
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
                                    Crear Cuenta de Padre
                                </DialogTitle>
                                <DialogDescription>
                                    Se generará una contraseña temporal que deberás compartir con el padre
                                </DialogDescription>
                            </DialogHeader>

                            {tempPassword ? (
                                <div className="space-y-4 py-4">
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                                        <p className="font-semibold text-green-800 mb-2">✅ Cuenta creada exitosamente</p>
                                        <p className="text-sm text-green-700 mb-3">
                                            Comparte estas credenciales con el padre:
                                        </p>
                                        <div className="bg-white p-3 rounded border border-green-300">
                                            <p className="text-sm"><strong>Email:</strong> {formData.email}</p>
                                            <p className="text-sm"><strong>Contraseña temporal:</strong> <span className="font-mono bg-yellow-100 px-2 py-1">{tempPassword}</span></p>
                                        </div>
                                        <p className="text-xs text-green-600 mt-2">
                                            ⚠️ El padre deberá cambiar su contraseña en el primer inicio de sesión
                                        </p>
                                    </div>
                                    <Button onClick={() => {
                                        setOpen(false);
                                        setTempPassword("");
                                    }} className="w-full">
                                        Cerrar
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Nombre</Label>
                                                <Input
                                                    value={formData.firstName}
                                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Apellido</Label>
                                                <Input
                                                    value={formData.lastName}
                                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Email</Label>
                                                <Input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Teléfono</Label>
                                                <Input
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label>Alumnos</Label>
                                                <Button type="button" size="sm" variant="outline" onClick={addStudent}>
                                                    <Plus className="h-4 w-4 mr-1" />
                                                    Agregar Alumno
                                                </Button>
                                            </div>

                                            {formData.studentIds.map((studentId, index) => (
                                                <div key={index} className="grid grid-cols-3 gap-2">
                                                    <div className="col-span-2">
                                                        <Select
                                                            value={studentId}
                                                            onValueChange={(value) => updateStudent(index, value)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Seleccionar alumno" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {students.map((student) => (
                                                                    <SelectItem key={student.id} value={student.id}>
                                                                        {student.firstName} {student.lastName} {student.matricula && `(${student.matricula})`}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Select
                                                            value={formData.relationships[index]}
                                                            onValueChange={(value) => updateRelationship(index, value)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="FATHER">Padre</SelectItem>
                                                                <SelectItem value="MOTHER">Madre</SelectItem>
                                                                <SelectItem value="GUARDIAN">Tutor</SelectItem>
                                                                <SelectItem value="OTHER">Otro</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => removeStudent(index)}
                                                        >
                                                            ✕
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <button
                                            onClick={handleCreate}
                                            className="button-modern bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                                        >
                                            Crear Cuenta
                                        </button>
                                    </DialogFooter>
                                </>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* BARRA DE GESTIÓN */}
            <div style={{ padding: '0 var(--spacing-lg)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}></div>

                    {/* BOTÓN GESTIONAR */}
                    <button
                        onClick={toggleSelectionMode}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 20px',
                            borderRadius: '12px',
                            border: isSelectionMode ? 'none' : '1px solid #e2e8f0',
                            backgroundColor: isSelectionMode ? '#1e293b' : 'white',
                            color: isSelectionMode ? 'white' : '#475569',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                        }}
                    >
                        {isSelectionMode ? <X size={18} /> : <Trash2 size={18} />}
                        {isSelectionMode ? 'Cancelar' : 'Gestionar'}
                    </button>
                </div>
            </div>

            {/* BARRA DE ACCIONES DE GESTIÓN */}
            {isSelectionMode && (
                <div style={{
                    padding: '0 var(--spacing-lg)',
                    marginBottom: '24px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 24px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '16px',
                        border: '2px dashed #cbd5e1'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                backgroundColor: '#ea580c',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '16px'
                            }}>
                                {selectedIds.length}
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                                {selectedIds.length === 0 ? 'Selecciona los padres a eliminar' : 'padres seleccionados'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setSelectedIds(activeParents.map(p => p.id))}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '10px',
                                    border: '1px solid #e2e8f0',
                                    backgroundColor: 'white',
                                    color: '#475569',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Seleccionar todos
                            </button>
                            {selectedIds.length > 0 && (
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={isDeletingBulk}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        opacity: isDeletingBulk ? 0.7 : 1
                                    }}
                                >
                                    <Trash2 size={16} />
                                    Eliminar seleccionados
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TABLA DE PADRES */}
            <section style={{ padding: '0 var(--spacing-lg)' }} className="pb-8">
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin w-12 h-12 border-2 border-orange-600 border-t-transparent rounded-full mx-auto mb-4" />
                            <p className="text-slate-500">Cargando padres...</p>
                        </div>
                    ) : activeParents.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="text-6xl mb-4">👨‍👩‍👧</div>
                            <p className="text-slate-500 text-lg">No hay cuentas de padres registradas</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    {isSelectionMode && (
                                        <th className="w-12 px-4 py-4"></th>
                                    )}
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Padre/Tutor</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Estado</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Contacto</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Alumnos</th>
                                    <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeParents.map((parent, index) => {
                                    const isSelected = selectedIds.includes(parent.id);
                                    return (
                                        <tr
                                            key={parent.id}
                                            className={`border-b border-gray-100 transition-colors hover:bg-slate-50 ${isSelectionMode ? 'cursor-pointer' : ''}`}
                                            onClick={() => isSelectionMode && toggleSelection(parent.id)}
                                            style={{
                                                backgroundColor: isSelected ? '#fff7ed' : (index % 2 === 1 ? '#F8FAFC' : '#FFFFFF')
                                            }}
                                        >
                                            {isSelectionMode && (
                                                <td className="px-4 py-4">
                                                    <div
                                                        style={{
                                                            width: '24px',
                                                            height: '24px',
                                                            borderRadius: '6px',
                                                            backgroundColor: isSelected ? '#ea580c' : 'white',
                                                            border: isSelected ? 'none' : '2px solid #E2E8F0',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={(e) => { e.stopPropagation(); toggleSelection(parent.id); }}
                                                    >
                                                        {isSelected && <Check size={14} color="white" strokeWidth={3} />}
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                                                        style={{ backgroundColor: '#EA580C' }}
                                                    >
                                                        {parent.firstName[0]}{parent.lastName[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-900">
                                                            {parent.firstName} {parent.lastName}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                                                    style={{
                                                        backgroundColor: parent.status === 'ACTIVE' ? '#D1FAE5' : '#E2E8F0',
                                                        color: parent.status === 'ACTIVE' ? '#047857' : '#475569'
                                                    }}
                                                >
                                                    {parent.status === "ACTIVE" ? "Activo" : "Inactivo"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-600">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Mail size={14} className="text-slate-400" />
                                                        {parent.email}
                                                    </div>
                                                    {parent.phone && (
                                                        <div className="flex items-center gap-2 text-slate-400">
                                                            <Phone size={14} />
                                                            {parent.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {parent.students.map((sp, idx) => (
                                                    <div key={idx} className="text-sm text-slate-700">
                                                        {sp.student.firstName} {sp.student.lastName}
                                                        <span className="text-slate-400 ml-1">
                                                            ({getRelationshipLabel(sp.relationship)})
                                                        </span>
                                                    </div>
                                                ))}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => parent.status === "ACTIVE"
                                                            ? handleStatusChange(parent.id, "INACTIVE")
                                                            : handleStatusChange(parent.id, "ACTIVE")
                                                        }
                                                        style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '10px',
                                                            backgroundColor: 'white',
                                                            border: '1px solid #E2E8F0',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        {parent.status === "ACTIVE"
                                                            ? <Ban size={16} color="#64748B" />
                                                            : <PlayCircle size={16} color="#059669" />
                                                        }
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(parent.id)}
                                                        style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '10px',
                                                            backgroundColor: 'white',
                                                            border: '1px solid #E2E8F0',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        <Trash2 size={16} color="#EF4444" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>
        </div>
    );
}
