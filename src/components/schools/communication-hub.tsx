"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Bell, Calendar, Megaphone, MessageSquare, Users, Send } from "lucide-react";
import { useBranch } from "@/context/branch-context";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";
import { ModernFilterBar } from "@/components/ui/modern-filter-bar";

export function CommunicationHub() {
    const { selectedBranch } = useBranch();
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [filterType, setFilterType] = useState<string[]>([]);

    // Form state
    const [newItem, setNewItem] = useState({
        type: "ANNOUNCEMENT",
        title: "",
        content: "",
        description: "",
        priority: "MEDIUM",
        startDate: "",
        endDate: "",
        location: ""
    });

    const fetchData = async () => {
        if (!selectedBranch?.businessId) return;
        setLoading(true);
        try {
            const [annRes, eventRes] = await Promise.all([
                fetch(`/api/communication/announcements?businessId=${selectedBranch.businessId}`),
                fetch(`/api/communication/events?businessId=${selectedBranch.businessId}`)
            ]);

            if (annRes.ok) setAnnouncements(await annRes.json());
            if (eventRes.ok) setEvents(await eventRes.json());
        } catch (error) {
            console.error("Error fetching communication data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedBranch?.businessId]);

    const handleCreate = async () => {
        if (!selectedBranch?.businessId) return;

        const endpoint = newItem.type === "ANNOUNCEMENT"
            ? "/api/communication/announcements"
            : "/api/communication/events";

        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...newItem,
                    businessId: selectedBranch.businessId
                })
            });

            if (res.ok) {
                setIsCreateOpen(false);
                fetchData();
                setNewItem({
                    type: "ANNOUNCEMENT",
                    title: "",
                    content: "",
                    description: "",
                    priority: "MEDIUM",
                    startDate: "",
                    endDate: "",
                    location: ""
                });
            }
        } catch (error) {
            console.error("Error creating item:", error);
        }
    };

    // Stats
    const totalAnnouncements = announcements.length;
    const totalEvents = events.length;
    const urgentAnnouncements = announcements.filter(a => a.priority === "HIGH").length;
    const upcomingEvents = events.filter(e => new Date(e.startDate) > new Date()).length;

    // Combined items for cards
    const allItems = [
        ...announcements.map(a => ({ ...a, itemType: "ANNOUNCEMENT" })),
        ...events.map(e => ({ ...e, itemType: "EVENT" }))
    ].sort((a, b) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime());

    // Filter items
    const filteredItems = allItems.filter(item => {
        const matchesSearch = searchValue === "" ||
            item.title.toLowerCase().includes(searchValue.toLowerCase()) ||
            (item.content || item.description || "").toLowerCase().includes(searchValue.toLowerCase());

        const matchesFilter = filterType.length === 0 ||
            (filterType.includes("ANNOUNCEMENT") && item.itemType === "ANNOUNCEMENT") ||
            (filterType.includes("EVENT") && item.itemType === "EVENT") ||
            (filterType.includes("URGENT") && item.priority === "HIGH");

        return matchesSearch && matchesFilter;
    });

    const itemColors: Record<string, { bg: string; accent: string }> = {
        "ANNOUNCEMENT": { bg: '#DBEAFE', accent: '#2563EB' },
        "EVENT": { bg: '#D1FAE5', accent: '#059669' },
        "URGENT": { bg: '#FEE2E2', accent: '#DC2626' }
    };

    return (
        <div className="bg-slate-100 pb-16 min-h-screen">
            {/* HEADER */}
            <div style={{
                padding: 'var(--spacing-lg)',
                marginBottom: '64px',
                position: 'relative',
                zIndex: 10
            }}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-4xl font-bold tracking-tight text-gray-900 mb-2 lg:mb-3">
                            Comunicación
                        </h1>
                        <p className="text-muted-foreground text-sm lg:text-lg">
                            {selectedBranch ? `Sucursal: ${selectedBranch.name}` : "Gestiona circulares y eventos para la comunidad"}
                        </p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <button
                                className="button-modern flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                                style={{
                                    alignSelf: 'flex-end',
                                    padding: '8px 12px',
                                    fontSize: '13px'
                                }}
                            >
                                <Plus size={14} />
                                Nuevo Comunicado
                            </button>
                        </DialogTrigger>
                        <DialogContent style={{
                            maxWidth: '560px',
                            maxHeight: '90vh',
                            padding: 0,
                            borderRadius: '24px',
                            overflow: 'hidden',
                            border: 'none',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <DialogTitle className="sr-only">Crear Nuevo Comunicado</DialogTitle>
                            <DialogDescription className="sr-only">
                                Formulario para crear una nueva circular o un evento escolar.
                            </DialogDescription>
                            {/* Gradient Header */}
                            <div style={{
                                background: newItem.type === "EVENT"
                                    ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                                    : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                padding: '28px 32px',
                                color: 'white'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '16px',
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {newItem.type === "EVENT" ? <Calendar size={28} /> : <Megaphone size={28} />}
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                                            {newItem.type === "EVENT" ? "Nuevo Evento" : "Nueva Circular"}
                                        </h2>
                                        <p style={{ fontSize: '14px', opacity: 0.9, margin: 0, marginTop: '4px' }}>
                                            {newItem.type === "EVENT" ? "Programa una actividad escolar" : "Comunica algo importante"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Form Content */}
                            <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflowY: 'auto' }}>
                                {/* Type Selector */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                                        Tipo de Comunicado
                                    </label>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setNewItem({ ...newItem, type: "ANNOUNCEMENT" })}
                                            style={{
                                                flex: 1,
                                                padding: '14px 16px',
                                                borderRadius: '12px',
                                                border: newItem.type === "ANNOUNCEMENT" ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                                                background: newItem.type === "ANNOUNCEMENT" ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : '#fff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <Megaphone size={20} color={newItem.type === "ANNOUNCEMENT" ? '#3b82f6' : '#94a3b8'} />
                                            <span style={{ fontWeight: 600, color: newItem.type === "ANNOUNCEMENT" ? '#1e40af' : '#64748b' }}>
                                                Circular / Aviso
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewItem({ ...newItem, type: "EVENT" })}
                                            style={{
                                                flex: 1,
                                                padding: '14px 16px',
                                                borderRadius: '12px',
                                                border: newItem.type === "EVENT" ? '2px solid #059669' : '2px solid #e2e8f0',
                                                background: newItem.type === "EVENT" ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' : '#fff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <Calendar size={20} color={newItem.type === "EVENT" ? '#059669' : '#94a3b8'} />
                                            <span style={{ fontWeight: 600, color: newItem.type === "EVENT" ? '#047857' : '#64748b' }}>
                                                Evento Escolar
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Title Input */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                                        Título *
                                    </label>
                                    <input
                                        type="text"
                                        value={newItem.title}
                                        onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                                        placeholder="Ej. Suspensión de clases por día festivo"
                                        style={{
                                            width: '100%',
                                            padding: '14px 16px',
                                            borderRadius: '12px',
                                            border: '2px solid #e2e8f0',
                                            fontSize: '15px',
                                            fontWeight: 500,
                                            outline: 'none',
                                            transition: 'border-color 0.2s ease'
                                        }}
                                    />
                                </div>

                                {newItem.type === "ANNOUNCEMENT" ? (
                                    <>
                                        {/* Content Textarea */}
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                                                Mensaje
                                            </label>
                                            <textarea
                                                value={newItem.content}
                                                onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                                                placeholder="Escribe el contenido del comunicado..."
                                                rows={4}
                                                style={{
                                                    width: '100%',
                                                    padding: '14px 16px',
                                                    borderRadius: '12px',
                                                    border: '2px solid #e2e8f0',
                                                    fontSize: '14px',
                                                    resize: 'vertical',
                                                    outline: 'none',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                        </div>

                                        {/* Priority Pills */}
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                                                Prioridad
                                            </label>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                {[
                                                    { value: 'LOW', label: 'Baja', color: '#22c55e', bg: '#dcfce7' },
                                                    { value: 'MEDIUM', label: 'Media', color: '#f59e0b', bg: '#fef3c7' },
                                                    { value: 'HIGH', label: 'Urgente', color: '#ef4444', bg: '#fee2e2' }
                                                ].map(p => (
                                                    <button
                                                        key={p.value}
                                                        type="button"
                                                        onClick={() => setNewItem({ ...newItem, priority: p.value })}
                                                        style={{
                                                            padding: '10px 18px',
                                                            borderRadius: '20px',
                                                            border: newItem.priority === p.value ? `2px solid ${p.color}` : '2px solid transparent',
                                                            background: newItem.priority === p.value ? p.bg : '#f1f5f9',
                                                            color: newItem.priority === p.value ? p.color : '#64748b',
                                                            fontWeight: 600,
                                                            fontSize: '13px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    >
                                                        {p.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Event Description */}
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                                                Descripción
                                            </label>
                                            <textarea
                                                value={newItem.description}
                                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                                placeholder="Describe el evento..."
                                                rows={3}
                                                style={{
                                                    width: '100%',
                                                    padding: '14px 16px',
                                                    borderRadius: '12px',
                                                    border: '2px solid #e2e8f0',
                                                    fontSize: '14px',
                                                    resize: 'vertical',
                                                    outline: 'none',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                        </div>

                                        {/* Date Inputs - Stacked */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                                                    📅 Fecha y Hora de Inicio
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    value={newItem.startDate}
                                                    onChange={(e) => setNewItem({ ...newItem, startDate: e.target.value })}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px 14px',
                                                        borderRadius: '12px',
                                                        border: '2px solid #e2e8f0',
                                                        fontSize: '14px',
                                                        outline: 'none',
                                                        boxSizing: 'border-box'
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                                                    📅 Fecha y Hora de Fin
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    value={newItem.endDate}
                                                    onChange={(e) => setNewItem({ ...newItem, endDate: e.target.value })}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px 14px',
                                                        borderRadius: '12px',
                                                        border: '2px solid #e2e8f0',
                                                        fontSize: '14px',
                                                        outline: 'none',
                                                        boxSizing: 'border-box'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Location */}
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                                                📍 Ubicación
                                            </label>
                                            <input
                                                type="text"
                                                value={newItem.location}
                                                onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                                                placeholder="Ej. Auditorio Principal"
                                                style={{
                                                    width: '100%',
                                                    padding: '14px 16px',
                                                    borderRadius: '12px',
                                                    border: '2px solid #e2e8f0',
                                                    fontSize: '15px',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Footer */}
                            <div style={{
                                padding: '20px 32px',
                                borderTop: '1px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '12px',
                                background: '#f8fafc'
                            }}>
                                <button
                                    onClick={() => setIsCreateOpen(false)}
                                    style={{
                                        padding: '12px 24px',
                                        borderRadius: '12px',
                                        border: '2px solid #e2e8f0',
                                        background: 'white',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: '#64748b',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!newItem.title}
                                    style={{
                                        padding: '12px 28px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: newItem.type === "EVENT"
                                            ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                                            : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: 'white',
                                        cursor: newItem.title ? 'pointer' : 'not-allowed',
                                        opacity: newItem.title ? 1 : 0.5,
                                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <Send size={16} />
                                    Publicar
                                </button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* KPIS */}
            <motion.div
                style={{ padding: '0 var(--spacing-lg)', marginBottom: '48px' }}
                initial="hidden"
                animate="show"
                variants={{
                    hidden: { opacity: 0 },
                    show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.1 }
                    }
                }}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                    <ModernKpiCard
                        title="Circulares"
                        value={totalAnnouncements.toString()}
                        icon={Megaphone}
                        gradientClass="gradient-courses"
                        subtitle="Avisos publicados"
                    />
                    <ModernKpiCard
                        title="Eventos"
                        value={totalEvents.toString()}
                        icon={Calendar}
                        gradientClass="gradient-students"
                        subtitle="Actividades programadas"
                    />
                    <ModernKpiCard
                        title="Urgentes"
                        value={urgentAnnouncements.toString()}
                        icon={Bell}
                        gradientClass="gradient-finance"
                        subtitle="Prioridad alta"
                    />
                    <ModernKpiCard
                        title="Próximos"
                        value={upcomingEvents.toString()}
                        icon={Send}
                        gradientClass="gradient-employees"
                        subtitle="Eventos pendientes"
                    />
                </div>
            </motion.div>

            {/* FILTROS */}
            <div style={{ padding: '0 var(--spacing-lg)', marginBottom: '40px' }}>
                <ModernFilterBar
                    searchValue={searchValue}
                    onSearchChange={setSearchValue}
                    placeholder="Buscar comunicados..."
                    filters={[
                        { label: "Circulares", value: "ANNOUNCEMENT", color: "blue" },
                        { label: "Eventos", value: "EVENT", color: "green" },
                        { label: "Urgentes", value: "URGENT", color: "orange" }
                    ]}
                    activeFilters={filterType}
                    onFilterToggle={(value) => {
                        setFilterType(prev =>
                            prev.includes(value)
                                ? prev.filter(v => v !== value)
                                : [...prev, value]
                        );
                    }}
                />
            </div>

            {/* CARDS GRID */}
            <section style={{ padding: '0 var(--spacing-lg)', minHeight: '400px' }} className="pb-8">
                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="animate-spin w-12 h-12 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-slate-500">Cargando comunicados...</p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">📢</div>
                        <p className="text-slate-500 text-lg">No hay comunicados disponibles</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '32px' }}>
                        {filteredItems.map((item, index) => {
                            const colorKey = item.priority === "HIGH" ? "URGENT" : item.itemType;
                            const colors = itemColors[colorKey] || itemColors["ANNOUNCEMENT"];

                            return (
                                <div
                                    key={item.id}
                                    className="communication-card"
                                    style={{
                                        backgroundColor: colors.bg,
                                        borderRadius: '20px',
                                        padding: '28px',
                                        minHeight: '280px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                                        display: 'flex',
                                        flexDirection: 'column' as const
                                    }}
                                >
                                    {/* ICON */}
                                    <div
                                        style={{
                                            width: '72px',
                                            height: '72px',
                                            borderRadius: '16px',
                                            backgroundColor: colors.accent,
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '20px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                        }}
                                    >
                                        {item.itemType === "EVENT" ? <Calendar size={32} /> : <Megaphone size={32} />}
                                    </div>

                                    {/* TITLE */}
                                    <h3 style={{
                                        fontSize: '22px',
                                        fontWeight: 'bold',
                                        color: '#1E293B',
                                        marginBottom: '8px'
                                    }}>
                                        {item.title}
                                    </h3>

                                    {/* TYPE BADGE */}
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '6px 14px',
                                        backgroundColor: 'rgba(255,255,255,0.8)',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        color: colors.accent,
                                        marginBottom: '16px',
                                        width: 'fit-content'
                                    }}>
                                        {item.itemType === "EVENT" ? "Evento" : item.priority === "HIGH" ? "Urgente" : "Circular"}
                                    </span>

                                    {/* CONTENT */}
                                    <div style={{ flex: 1, fontSize: '14px', color: '#475569' }}>
                                        <p style={{
                                            overflow: 'hidden',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical' as const
                                        }}>
                                            {item.content || item.description || "-"}
                                        </p>
                                    </div>

                                    {/* FOOTER */}
                                    <div style={{
                                        marginTop: '16px',
                                        paddingTop: '16px',
                                        borderTop: '2px solid rgba(255,255,255,0.5)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        <div style={{ fontSize: '12px', color: '#64748B' }}>
                                            {item.createdAt
                                                ? format(new Date(item.createdAt), "d MMM, yyyy", { locale: es })
                                                : item.startDate
                                                    ? format(new Date(item.startDate), "d MMM, yyyy", { locale: es })
                                                    : "-"
                                            }
                                        </div>
                                        {item.location && (
                                            <div style={{ fontSize: '12px', color: colors.accent, fontWeight: 'bold' }}>
                                                📍 {item.location}
                                            </div>
                                        )}
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
