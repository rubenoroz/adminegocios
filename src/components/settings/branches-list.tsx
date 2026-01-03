"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Plus, Building2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ModernInput } from "@/components/ui/modern-components";
import { useToast } from "@/components/ui/use-toast";
import { useBranch } from "@/context/branch-context";

interface Branch {
    id: string;
    name: string;
    address: string | null;
}

export function BranchesList({ dict }: { dict: any }) {
    // @ts-ignore
    const { branches, loading, refreshBranches } = useBranch();
    const [open, setOpen] = useState(false);
    const [newBranch, setNewBranch] = useState({ name: "", address: "" });
    const { toast } = useToast();
    const t = dict.branches;

    // Remove local fetchBranches and useEffect since we use Context now

    const createBranch = async () => {
        if (!newBranch.name.trim()) {
            toast({ title: "El nombre es requerido", variant: "destructive" });
            return;
        }

        try {
            const res = await fetch("/api/branches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newBranch)
            });

            if (res.ok) {
                setOpen(false);
                setNewBranch({ name: "", address: "" });
                await refreshBranches(); // Update global context!
                toast({ title: "Sucursal creada exitosamente" });
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error al crear sucursal", variant: "destructive" });
        }
    };

    const handleDelete = async (branchId: string) => {
        if (!confirm("¿Estás seguro de eliminar esta sucursal?")) return;

        try {
            const res = await fetch(`/api/branches/${branchId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                await refreshBranches(); // Update global context!
                toast({ title: "Sucursal eliminada" });
            }
        } catch (error) {
            console.error("Failed to delete branch", error);
            toast({ title: "Error al eliminar sucursal", variant: "destructive" });
        }
    };

    return (
        <div className="bg-slate-100 pb-16">
            {/* HEADER - MISMO PATRÓN QUE OTRAS PÁGINAS */}
            <div style={{
                padding: 'var(--spacing-lg)',
                marginBottom: '48px',
                position: 'relative',
                zIndex: 10
            }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
                            {t.title || "Sucursales"}
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Gestiona las ubicaciones de tu negocio
                        </p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <button className="button-modern flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600">
                                <Plus size={18} />
                                {t.add || "Nueva Sucursal"}
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                                    {t.add || "Nueva Sucursal"}
                                </DialogTitle>
                                <DialogDescription className="sr-only">
                                    Formulario para crear una nueva sucursal
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <ModernInput
                                    label={t.name || "Nombre"}
                                    value={newBranch.name}
                                    onChange={(val) => setNewBranch({ ...newBranch, name: val })}
                                />
                                <ModernInput
                                    label={t.address || "Dirección"}
                                    value={newBranch.address}
                                    onChange={(val) => setNewBranch({ ...newBranch, address: val })}
                                />
                            </div>
                            <DialogFooter>
                                <button
                                    onClick={createBranch}
                                    className="button-modern bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                                >
                                    {t.create || "Crear Sucursal"}
                                </button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* GRID DE SUCURSALES */}
            <section style={{ padding: '0 var(--spacing-lg)', minHeight: '400px' }} className="pb-8">
                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="animate-spin w-12 h-12 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-slate-500">{t.loading || "Cargando sucursales..."}</p>
                    </div>
                ) : branches.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">🏢</div>
                        <p className="text-slate-500 text-lg">No hay sucursales registradas</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '32px' }}>
                        {branches.map((branch, index) => {
                            const branchColors: Record<number, { bg: string; accent: string }> = {
                                0: { bg: '#DBEAFE', accent: '#2563EB' },
                                1: { bg: '#EDE9FE', accent: '#7C3AED' },
                                2: { bg: '#FCE7F3', accent: '#DB2777' },
                                3: { bg: '#FFEDD5', accent: '#EA580C' },
                                4: { bg: '#D1FAE5', accent: '#059669' },
                                5: { bg: '#CCFBF1', accent: '#0D9488' },
                            };
                            const colors = branchColors[index % 6];

                            return (
                                <div
                                    key={branch.id}
                                    className="branch-card"
                                    style={{
                                        backgroundColor: colors.bg,
                                        borderRadius: '20px',
                                        padding: '28px',
                                        minHeight: '200px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                                        display: 'flex',
                                        flexDirection: 'column' as const
                                    }}
                                >
                                    {/* ICONO */}
                                    <div
                                        style={{
                                            width: '72px',
                                            height: '72px',
                                            borderRadius: '16px',
                                            backgroundColor: colors.accent,
                                            color: 'white',
                                            fontSize: '32px',
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '20px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                        }}
                                    >
                                        <Building2 size={36} />
                                    </div>

                                    {/* NOMBRE */}
                                    <h3 style={{
                                        fontSize: '22px',
                                        fontWeight: 'bold',
                                        color: '#1E293B',
                                        marginBottom: '8px'
                                    }}>
                                        {branch.name}
                                    </h3>

                                    {/* DIRECCIÓN */}
                                    <div style={{ flex: 1, fontSize: '14px', color: '#475569', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                                            <MapPin size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                                            <span>{branch.address || 'Sin dirección'}</span>
                                        </div>
                                    </div>

                                    {/* ACCIONES */}
                                    <div style={{
                                        marginTop: 'auto',
                                        paddingTop: '16px',
                                        borderTop: '2px solid rgba(255,255,255,0.5)',
                                        display: 'flex',
                                        justifyContent: 'flex-end'
                                    }}>
                                        <button
                                            onClick={() => handleDelete(branch.id)}
                                            title="Eliminar sucursal"
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '10px',
                                                backgroundColor: 'white',
                                                border: 'none',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <Trash2 size={18} color="#EF4444" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
