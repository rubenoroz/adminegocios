"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
                            Comunicación
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            {selectedBranch ? `Sucursal: ${selectedBranch.name}` : "Gestiona circulares y eventos para la comunidad"}
                        </p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <button className="button-modern flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600">
                                <Plus size={18} />
                                Nuevo Comunicado
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                                    Crear Comunicado
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Tipo</Label>
                                    <Select
                                        value={newItem.type}
                                        onValueChange={(v) => setNewItem({ ...newItem, type: v })}
                                    >
                                        <SelectTrigger className="w-full h-12 rounded-xl border-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ANNOUNCEMENT">Circular / Aviso</SelectItem>
                                            <SelectItem value="EVENT">Evento Escolar</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Título</Label>
                                    <Input
                                        value={newItem.title}
                                        onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                                        placeholder="Ej. Suspensión de clases"
                                        className="h-12 rounded-xl"
                                    />
                                </div>

                                {newItem.type === "ANNOUNCEMENT" ? (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Contenido</Label>
                                            <Textarea
                                                value={newItem.content}
                                                onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                                                placeholder="Escribe el mensaje aquí..."
                                                rows={5}
                                                className="rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Prioridad</Label>
                                            <Select
                                                value={newItem.priority}
                                                onValueChange={(v) => setNewItem({ ...newItem, priority: v })}
                                            >
                                                <SelectTrigger className="h-12 rounded-xl">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="LOW">Baja (Informativo)</SelectItem>
                                                    <SelectItem value="MEDIUM">Media (Importante)</SelectItem>
                                                    <SelectItem value="HIGH">Alta (Urgente)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Descripción</Label>
                                            <Textarea
                                                value={newItem.description}
                                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                                rows={3}
                                                className="rounded-xl"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Inicio</Label>
                                                <Input
                                                    type="datetime-local"
                                                    value={newItem.startDate}
                                                    onChange={(e) => setNewItem({ ...newItem, startDate: e.target.value })}
                                                    className="h-12 rounded-xl"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Fin</Label>
                                                <Input
                                                    type="datetime-local"
                                                    value={newItem.endDate}
                                                    onChange={(e) => setNewItem({ ...newItem, endDate: e.target.value })}
                                                    className="h-12 rounded-xl"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Ubicación</Label>
                                            <Input
                                                value={newItem.location}
                                                onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                                                placeholder="Ej. Auditorio Principal"
                                                className="h-12 rounded-xl"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                            <DialogFooter>
                                <button
                                    onClick={handleCreate}
                                    disabled={!newItem.title}
                                    className="button-modern bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-50"
                                >
                                    Publicar
                                </button>
                            </DialogFooter>
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
