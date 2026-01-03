"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Clock, DollarSign, Palette, ToggleLeft, ToggleRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface Service {
    id: string;
    name: string;
    description: string | null;
    duration: number;
    price: number;
    color: string;
    isActive: boolean;
    _count?: { appointments: number };
}

const COLORS = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
    "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1"
];

export function ServiceCatalog() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [form, setForm] = useState({ name: "", description: "", duration: 30, price: 0, color: "#3B82F6" });
    const { toast } = useToast();

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const res = await fetch("/api/services");
            const data = await res.json();
            if (Array.isArray(data)) setServices(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const url = editingService ? `/api/services/${editingService.id}` : "/api/services";
            const method = editingService ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                toast({ title: editingService ? "Servicio actualizado" : "Servicio creado" });
                fetchServices();
                setOpen(false);
                resetForm();
            }
        } catch (error) {
            toast({ title: "Error", description: "No se pudo guardar", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este servicio?")) return;
        try {
            await fetch(`/api/services/${id}`, { method: "DELETE" });
            toast({ title: "Servicio eliminado" });
            fetchServices();
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        }
    };

    const toggleActive = async (service: Service) => {
        try {
            await fetch(`/api/services/${service.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !service.isActive })
            });
            fetchServices();
        } catch (error) {
            console.error(error);
        }
    };

    const resetForm = () => {
        setForm({ name: "", description: "", duration: 30, price: 0, color: "#3B82F6" });
        setEditingService(null);
    };

    const openEdit = (service: Service) => {
        setEditingService(service);
        setForm({
            name: service.name,
            description: service.description || "",
            duration: service.duration,
            price: service.price,
            color: service.color || "#3B82F6"
        });
        setOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A' }}>Catálogo de Servicios</h2>
                    <p style={{ color: '#64748B' }}>Define los servicios que ofreces con duración y precios</p>
                </div>
                <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
                    <DialogTrigger asChild>
                        <button style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px',
                            background: 'linear-gradient(135deg, #3B82F6, #2563EB)', color: 'white',
                            borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer'
                        }}>
                            <Plus size={20} /> Nuevo Servicio
                        </button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingService ? "Editar Servicio" : "Nuevo Servicio"}</DialogTitle>
                        </DialogHeader>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#374151' }}>Nombre *</label>
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Ej: Consulta General, Corte de Cabello, Diseño Web..."
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#374151' }}>Descripción</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Descripción opcional del servicio..."
                                    rows={2}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', resize: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#374151' }}>
                                        <Clock size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                        Duración (minutos)
                                    </label>
                                    <input
                                        type="number"
                                        value={form.duration}
                                        onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 30 })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#374151' }}>
                                        <DollarSign size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                        Precio
                                    </label>
                                    <input
                                        type="number"
                                        value={form.price}
                                        onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#374151' }}>
                                    <Palette size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                    Color (para calendario)
                                </label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {COLORS.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setForm({ ...form, color: c })}
                                            style={{
                                                width: '32px', height: '32px', borderRadius: '8px', backgroundColor: c,
                                                border: form.color === c ? '3px solid #0F172A' : '2px solid transparent',
                                                cursor: 'pointer'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <button
                                onClick={handleSave}
                                disabled={!form.name}
                                style={{
                                    padding: '12px 24px', borderRadius: '8px', fontWeight: 600, border: 'none',
                                    background: form.name ? 'linear-gradient(135deg, #10B981, #059669)' : '#D1D5DB',
                                    color: 'white', cursor: form.name ? 'pointer' : 'not-allowed'
                                }}
                            >
                                {editingService ? "Guardar Cambios" : "Crear Servicio"}
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Services Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {services.map((service, idx) => (
                    <motion.div
                        key={service.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        style={{
                            backgroundColor: 'white', borderRadius: '16px', padding: '24px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #E2E8F0',
                            opacity: service.isActive ? 1 : 0.6
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px', backgroundColor: service.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '18px'
                                }}>
                                    {service.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: 700, fontSize: '18px', color: '#0F172A' }}>{service.name}</h3>
                                    {service.description && <p style={{ fontSize: '14px', color: '#64748B' }}>{service.description}</p>}
                                </div>
                            </div>
                            <button onClick={() => toggleActive(service)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                {service.isActive ? <ToggleRight size={28} color="#10B981" /> : <ToggleLeft size={28} color="#94A3B8" />}
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                            <div style={{ flex: 1, padding: '12px', backgroundColor: '#F1F5F9', borderRadius: '10px', textAlign: 'center' }}>
                                <Clock size={18} style={{ color: '#64748B', marginBottom: '4px' }} />
                                <div style={{ fontWeight: 700, color: '#0F172A' }}>{service.duration} min</div>
                            </div>
                            <div style={{ flex: 1, padding: '12px', backgroundColor: '#F1F5F9', borderRadius: '10px', textAlign: 'center' }}>
                                <DollarSign size={18} style={{ color: '#64748B', marginBottom: '4px' }} />
                                <div style={{ fontWeight: 700, color: '#059669' }}>${service.price.toLocaleString()}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', color: '#64748B' }}>{service._count?.appointments || 0} citas realizadas</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => openEdit(service)} style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#EFF6FF', border: 'none', cursor: 'pointer' }}>
                                    <Edit2 size={16} color="#3B82F6" />
                                </button>
                                <button onClick={() => handleDelete(service.id)} style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#FEF2F2', border: 'none', cursor: 'pointer' }}>
                                    <Trash2 size={16} color="#EF4444" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {services.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '64px', backgroundColor: 'white', borderRadius: '16px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛠️</div>
                        <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>Sin servicios aún</h3>
                        <p style={{ color: '#64748B' }}>Crea tu primer servicio para empezar a agendar citas</p>
                    </div>
                )}
            </div>
        </div>
    );
}
