"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Calendar, dateFnsLocalizer, Views, SlotInfo } from "react-big-calendar";
import withDragAndDrop, { EventInteractionArgs } from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay, addHours, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, LayoutGrid, Utensils, Filter, Check, Users, Clock, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";
import { ReservationModal } from "./reservation-modal";
import { useToast } from "@/components/ui/use-toast";

// Import styles
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "@/styles/modern-effects.css";

// Configure date-fns localizer for Spanish
const locales = { es };
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    getDay,
    locales,
});

// Enable drag and drop
const DnDCalendar = withDragAndDrop(Calendar);

interface Table {
    id: string;
    name: string;
    capacity: number;
}

interface Reservation {
    id: string;
    customerName: string;
    phone: string | null;
    email: string | null;
    partySize: number;
    date: string;
    duration: number;
    status: string;
    notes: string | null;
    tableId: string | null;
    table: Table | null;
}

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resourceId?: string;
    resource: {
        customerName: string;
        partySize: number;
        status: string;
        tableId: string | null;
        tableName: string | null;
        phone: string | null;
        notes: string | null;
    };
}

const statusColors: Record<string, string> = {
    PENDING: "#f59e0b",
    CONFIRMED: "#3b82f6",
    CANCELLED: "#ef4444",
    NO_SHOW: "#6b7280",
    COMPLETED: "#10b981",
};

export function ReservationsCalendar() {
    const { toast } = useToast();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<typeof Views[keyof typeof Views]>(Views.WEEK);
    const [date, setDate] = useState(new Date());

    // View mode: 'normal' or 'resource'
    const [viewMode, setViewMode] = useState<'normal' | 'resource'>('normal');

    // Table filter
    const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
    const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

    // Fetch tables
    const fetchTables = useCallback(async () => {
        try {
            const res = await fetch("/api/restaurant/tables");
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setTables(data);
                    setSelectedTables(new Set(data.map((t: Table) => t.id)));
                }
            }
        } catch (error) {
            console.error("Error fetching tables:", error);
        }
    }, []);

    // Fetch reservations
    const fetchReservations = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/restaurant/reservations");
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    const calendarEvents: CalendarEvent[] = data.map((r: Reservation) => {
                        const startDate = new Date(r.date);
                        const endDate = new Date(startDate.getTime() + r.duration * 60000);
                        return {
                            id: r.id,
                            title: `${r.customerName} (${r.partySize}p)`,
                            start: startDate,
                            end: endDate,
                            resourceId: r.tableId || "unassigned",
                            resource: {
                                customerName: r.customerName,
                                partySize: r.partySize,
                                status: r.status,
                                tableId: r.tableId,
                                tableName: r.table?.name || null,
                                phone: r.phone,
                                notes: r.notes,
                            },
                        };
                    });
                    setEvents(calendarEvents);
                }
            }
        } catch (error) {
            console.error("Error fetching reservations:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTables();
        fetchReservations();
    }, [fetchTables, fetchReservations]);

    const containerRef = useRef<HTMLDivElement>(null);

    // Robust fix for drag-and-drop offset: Monitor container size changes
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver(() => {
            window.dispatchEvent(new Event('resize'));
        });

        resizeObserver.observe(containerRef.current);

        return () => resizeObserver.disconnect();
    }, []);

    // Resources for resource view (tables)
    const resources = useMemo(() => {
        const tableResources = tables
            .filter(t => selectedTables.has(t.id))
            .map(t => ({
                id: t.id,
                title: `${t.name} (${t.capacity}p)`,
            }));

        tableResources.push({
            id: "unassigned",
            title: "Sin mesa"
        });

        return tableResources;
    }, [tables, selectedTables]);

    // Filter events based on selected tables
    const filteredEvents = useMemo(() => {
        if (viewMode === 'normal') {
            return events.filter(e =>
                !e.resource.tableId || selectedTables.has(e.resource.tableId)
            );
        }
        return events.filter(e => {
            if (!e.resourceId) return true;
            if (e.resourceId === "unassigned") return true;
            return selectedTables.has(e.resourceId);
        });
    }, [events, selectedTables, viewMode]);

    // KPIs
    const todayReservations = events.filter(e => {
        const today = new Date();
        return e.start.toDateString() === today.toDateString();
    });
    const confirmedCount = todayReservations.filter(e => e.resource.status === "CONFIRMED").length;
    const pendingCount = todayReservations.filter(e => e.resource.status === "PENDING").length;
    const totalPax = todayReservations.reduce((sum, e) => sum + e.resource.partySize, 0);

    // Handle slot selection (click-and-drag to create)
    const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
        setSelectedSlot({ start: slotInfo.start, end: slotInfo.end });
        setEditingReservation(null);
        setIsModalOpen(true);
    }, []);

    // Handle event click (edit existing)
    const handleSelectEvent = useCallback(async (event: CalendarEvent) => {
        try {
            const res = await fetch(`/api/restaurant/reservations/${event.id}`);
            if (res.ok) {
                const r = await res.json();
                setEditingReservation(r);
                setSelectedSlot({ start: new Date(r.date), end: new Date(new Date(r.date).getTime() + r.duration * 60000) });
                setIsModalOpen(true);
            }
        } catch (error) {
            console.error("Error fetching reservation details:", error);
        }
    }, []);

    // Handle event drop (move)
    const handleEventDrop = useCallback(async ({ event, start, end, resourceId }: EventInteractionArgs<CalendarEvent> & { resourceId?: string }) => {
        try {
            const body: any = {
                id: event.id,
                date: (start as Date).toISOString(),
            };

            if (resourceId && resourceId !== "unassigned" && resourceId !== event.resourceId) {
                body.tableId = resourceId;
            } else if (resourceId === "unassigned") {
                body.tableId = null;
            }

            await fetch("/api/restaurant/reservations", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            toast({ title: "Reservación actualizada" });
            fetchReservations();
        } catch (error) {
            console.error("Error updating reservation:", error);
        }
    }, [fetchReservations, toast]);

    // Handle event resize
    const handleEventResize = useCallback(async ({ event, start, end }: EventInteractionArgs<CalendarEvent>) => {
        try {
            const duration = Math.round(((end as Date).getTime() - (start as Date).getTime()) / 60000);
            await fetch("/api/restaurant/reservations", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: event.id,
                    date: (start as Date).toISOString(),
                    duration,
                }),
            });
            toast({ title: "Duración actualizada" });
            fetchReservations();
        } catch (error) {
            console.error("Error resizing reservation:", error);
        }
    }, [fetchReservations, toast]);

    // External Navigation Logic
    const handleNavigate = useCallback((action: 'PREV' | 'NEXT' | 'TODAY') => {
        if (action === 'TODAY') {
            setDate(new Date());
            return;
        }

        switch (view) {
            case Views.DAY:
                setDate(prev => action === 'NEXT' ? addDays(prev, 1) : subDays(prev, 1));
                break;
            case Views.WEEK:
                setDate(prev => action === 'NEXT' ? addWeeks(prev, 1) : subWeeks(prev, 1));
                break;
            case Views.MONTH:
                setDate(prev => action === 'NEXT' ? addMonths(prev, 1) : subMonths(prev, 1));
                break;
            default:
                setDate(prev => action === 'NEXT' ? addDays(prev, 1) : subDays(prev, 1));
        }
    }, [view]);

    // Date Label
    const dateLabel = useMemo(() => {
        return format(date, "MMMM yyyy", { locale: es }).replace(/^\w/, (c) => c.toUpperCase());
    }, [date]);

    // Custom event styling
    const eventStyleGetter = useCallback((event: CalendarEvent) => {
        const color = statusColors[event.resource.status] || "#3B82F6";
        return {
            style: {
                backgroundColor: color,
                borderRadius: "6px",
                opacity: 0.9,
                color: "white",
                border: "none",
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
            },
        };
    }, []);

    // Messages in Spanish
    const messages = useMemo(() => ({
        today: "Hoy",
        previous: "Anterior",
        next: "Siguiente",
        month: "Mes",
        week: "Semana",
        day: "Día",
        agenda: "Agenda",
        date: "Fecha",
        time: "Hora",
        event: "Reservación",
        noEventsInRange: "No hay reservaciones en este rango.",
        showMore: (total: number) => `+${total} más`,
    }), []);

    const handleModalClose = useCallback(() => {
        setIsModalOpen(false);
        setSelectedSlot(null);
        setEditingReservation(null);
    }, []);

    const handleReservationSaved = useCallback(() => {
        fetchReservations();
        handleModalClose();
        toast({
            title: editingReservation ? "Reservación actualizada" : "Reservación creada",
            description: "Los cambios se han guardado correctamente.",
        });
    }, [fetchReservations, handleModalClose, toast, editingReservation]);

    const toggleTable = (id: string) => {
        const newSet = new Set(selectedTables);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedTables(newSet);
    };

    const selectAllTables = () => {
        setSelectedTables(new Set(tables.map(t => t.id)));
    };

    const deselectAllTables = () => {
        setSelectedTables(new Set());
    };

    return (
        <div className="services-calendar-container">

            {/* 0. Title & KPIs (EXTERNAL) */}
            <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                    <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A" }}>
                        Calendario de Reservaciones
                    </h2>
                </div>

                {/* KPIs Removed per user request to fix drag-offset issues */}
            </div>

            {/* 1. Controls & Navigation (EXTERNAL) */}
            <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>


                {/* View Modes & Filters */}
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", backgroundColor: "#F1F5F9", borderRadius: "10px", padding: "4px" }}>
                        <button
                            type="button"
                            onClick={() => { if (viewMode !== 'normal') setViewMode('normal'); }}
                            style={{
                                padding: "8px 12px",
                                borderRadius: "8px",
                                border: "none",
                                backgroundColor: viewMode === 'normal' ? "#f59e0b" : "transparent",
                                color: viewMode === 'normal' ? "white" : "#64748B",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "13px"
                            }}
                        >
                            <LayoutGrid size={16} />
                            General
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (viewMode !== 'resource') {
                                    setViewMode('resource');
                                    setView(Views.DAY);
                                    // props.onView is internal, we control 'view' state directly
                                }
                            }}
                            style={{
                                padding: "8px 12px",
                                borderRadius: "8px",
                                border: "none",
                                backgroundColor: viewMode === 'resource' ? "#f59e0b" : "transparent",
                                color: viewMode === 'resource' ? "white" : "#64748B",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "13px"
                            }}
                        >
                            <Utensils size={16} />
                            Por Mesa
                        </button>
                    </div>

                    {/* Filter Button Logic Repetition */}
                    <div style={{ position: "relative" }}>
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            style={{
                                padding: "10px 14px",
                                borderRadius: "10px",
                                border: "1px solid #E2E8F0",
                                backgroundColor: showFilters ? "#FEF3C7" : "white",
                                color: showFilters ? "#f59e0b" : "#64748B",
                                fontWeight: 500,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                            }}
                        >
                            <Filter size={16} />
                            Mesas
                            {selectedTables.size < tables.length && (
                                <span style={{
                                    backgroundColor: "#f59e0b",
                                    color: "white",
                                    borderRadius: "50%",
                                    width: "18px",
                                    height: "18px",
                                    fontSize: "11px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}>
                                    {selectedTables.size}
                                </span>
                            )}
                        </button>
                        {/* Filter Dropdown */}
                        {showFilters && (
                            <div style={{
                                position: "absolute",
                                top: "100%",
                                right: 0,
                                marginTop: "8px",
                                backgroundColor: "white",
                                borderRadius: "12px",
                                border: "1px solid #E2E8F0",
                                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                                padding: "12px",
                                minWidth: "220px",
                                zIndex: 100
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid #E2E8F0" }}>
                                    <button type="button" onClick={selectAllTables} style={{ fontSize: "12px", color: "#f59e0b", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Todas</button>
                                    <button type="button" onClick={deselectAllTables} style={{ fontSize: "12px", color: "#64748B", background: "none", border: "none", cursor: "pointer" }}>Ninguna</button>
                                </div>
                                <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                                    {tables.map(table => (
                                        <div key={table.id} onClick={() => toggleTable(table.id)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px", borderRadius: "8px", cursor: "pointer", backgroundColor: selectedTables.has(table.id) ? "#FEF3C7" : "transparent" }}>
                                            <div style={{ width: "20px", height: "20px", borderRadius: "6px", border: `2px solid ${selectedTables.has(table.id) ? "#f59e0b" : "#CBD5E1"}`, backgroundColor: selectedTables.has(table.id) ? "#f59e0b" : "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                {selectedTables.has(table.id) && <Check size={12} color="white" />}
                                            </div>
                                            <Utensils size={14} color="#94A3B8" />
                                            <span style={{ fontSize: "14px", fontWeight: 500 }}>{table.name} ({table.capacity}p)</span>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => setShowFilters(false)} style={{ width: "100%", marginTop: "12px", padding: "8px", borderRadius: "8px", border: "none", backgroundColor: "#F1F5F9", color: "#64748B", fontWeight: 600, cursor: "pointer" }}>Cerrar</button>
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setSelectedSlot({ start: new Date(), end: addHours(new Date(), 1.5) });
                            setEditingReservation(null);
                            setIsModalOpen(true);
                        }}
                        className="button-modern"
                        style={{ display: "flex", alignItems: "center", gap: "8px", background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}
                    >
                        <Plus size={18} />
                        Nueva Reservación
                    </button>
                </div>
            </div>

            {/* Resource View Notice (External) */}
            {viewMode === 'resource' && (
                <div style={{ marginBottom: "16px", backgroundColor: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: "12px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <Utensils size={18} color="#f59e0b" />
                    <span style={{ color: "#92400E", fontSize: "14px" }}><strong>Vista por Mesa:</strong> Cada columna es una mesa. Arrastra reservaciones para cambiar de mesa.</span>
                </div>
            )}

            {/* Main Calendar Container - Pure Grid */}
            <div
                ref={containerRef}
                style={{
                    backgroundColor: "white",
                    borderRadius: "16px",
                    border: "1px solid #E2E8F0",
                    padding: "16px",
                    minHeight: "700px",
                    position: "relative"
                }}>
                {loading && (
                    <div style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: "rgba(255,255,255,0.8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 100,
                        borderRadius: "16px"
                    }}>
                        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
                    </div>
                )}

                <DnDCalendar
                    localizer={localizer}
                    events={filteredEvents as any}
                    view={view}
                    onView={(newView: any) => setView(newView)}
                    date={date}
                    onNavigate={(newDate: Date) => setDate(newDate)}
                    selectable
                    resizable
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent as any}
                    onEventDrop={handleEventDrop as any}
                    onEventResize={handleEventResize as any}
                    eventPropGetter={eventStyleGetter as any}
                    messages={messages}
                    culture="es"
                    step={15}
                    timeslots={4}
                    min={new Date(2024, 0, 1, 11, 0, 0)}
                    max={new Date(2024, 0, 1, 23, 0, 0)}
                    style={{ height: "800px" }}
                    defaultView={Views.WEEK}
                    views={viewMode === 'resource' ? [Views.DAY] : [Views.DAY, Views.WEEK, Views.MONTH]}
                    popup
                    showMultiDayTimes

                    {...(viewMode === 'resource' ? {
                        resources: resources,
                        resourceIdAccessor: "id" as any,
                        resourceTitleAccessor: "title" as any,
                    } : {})}
                />
            </div>

            {/* Modal */}
            <ReservationModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSave={handleReservationSaved}
                startTime={selectedSlot?.start || new Date()}
                endTime={selectedSlot?.end || addHours(new Date(), 1.5)}
                reservation={editingReservation}
            />
        </div>
    );
}

// Static KPI Card to prevent JS/Animation interference with dragging
function StaticKpiCard({ title, value, icon: Icon, gradientClass, subtitle }: { title: string, value: string, icon: any, gradientClass: string, subtitle: string }) {
    return (
        <div className={`kpi-card-modern ${gradientClass}`} style={{ position: 'relative', overflow: 'hidden' }}>
            <div className="kpi-icon-gradient">
                <Icon size={32} />
            </div>
            <div style={{ position: "relative", zIndex: 1 }}>
                <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
                <div className="flex items-end gap-2">
                    <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
                </div>
                {subtitle && (
                    <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>
                )}
            </div>
        </div>
    );
}
