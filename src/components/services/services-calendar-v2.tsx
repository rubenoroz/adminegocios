"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar, dateFnsLocalizer, Views, SlotInfo } from "react-big-calendar";
import withDragAndDrop, { EventInteractionArgs } from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay, addHours } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Users, LayoutGrid, Filter, X, Check } from "lucide-react";
import { AppointmentModal } from "./appointment-modal";

// Import styles
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

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

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resourceId?: string;
    resource: {
        serviceColor: string;
        serviceName: string;
        customerName: string;
        status: string;
        employeeId?: string;
        employeeName?: string;
        employeeColor?: string;
    };
}

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    color: string | null;
}

interface Appointment {
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    notes?: string;
    service: { id: string; name: string; color: string; duration: number };
    customer: { id: string; name: string };
    employee?: { id: string; firstName: string; lastName: string; color?: string };
}

export function ServicesCalendarV2() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<typeof Views[keyof typeof Views]>(Views.WEEK);
    const [date, setDate] = useState(new Date());

    // View mode: 'normal' or 'resource'
    const [viewMode, setViewMode] = useState<'normal' | 'resource'>('normal');

    // Employee filter
    const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

    // Fetch employees
    const fetchEmployees = useCallback(async () => {
        try {
            const res = await fetch("/api/employees");
            const data = await res.json();
            if (Array.isArray(data)) {
                setEmployees(data);
                // Initialize all employees as selected
                setSelectedEmployees(new Set(data.map((e: Employee) => e.id)));
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
        }
    }, []);

    // Fetch appointments
    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/appointments");
            const data = await res.json();

            if (Array.isArray(data)) {
                const calendarEvents: CalendarEvent[] = data.map((apt: Appointment) => ({
                    id: apt.id,
                    title: `${apt.service.name} - ${apt.customer.name}`,
                    start: new Date(apt.startTime),
                    end: new Date(apt.endTime),
                    resourceId: apt.employee?.id || "unassigned",
                    resource: {
                        serviceColor: apt.service.color,
                        serviceName: apt.service.name,
                        customerName: apt.customer.name,
                        status: apt.status,
                        employeeId: apt.employee?.id,
                        employeeName: apt.employee ? `${apt.employee.firstName} ${apt.employee.lastName}` : undefined,
                        employeeColor: apt.employee?.color,
                    },
                }));
                setEvents(calendarEvents);
            }
        } catch (error) {
            console.error("Error fetching appointments:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
        fetchAppointments();
    }, [fetchEmployees, fetchAppointments]);

    // Resources for resource view
    const resources = useMemo(() => {
        const employeeResources = employees
            .filter(e => selectedEmployees.has(e.id))
            .map(e => ({
                id: e.id,
                title: `${e.firstName} ${e.lastName}`,
                color: e.color || "#3B82F6",
            }));

        // Add "Sin asignar" resource
        employeeResources.push({
            id: "unassigned",
            title: "Sin asignar",
            color: "#94A3B8"
        });

        return employeeResources;
    }, [employees, selectedEmployees]);

    // Filter events based on selected employees
    const filteredEvents = useMemo(() => {
        if (viewMode === 'normal') {
            return events.filter(e =>
                !e.resource.employeeId || selectedEmployees.has(e.resource.employeeId)
            );
        }
        return events.filter(e => {
            if (!e.resourceId) return true;
            if (e.resourceId === "unassigned") return true;
            return selectedEmployees.has(e.resourceId);
        });
    }, [events, selectedEmployees, viewMode]);

    // Handle slot selection (click-and-drag to create)
    const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
        setSelectedSlot({ start: slotInfo.start, end: slotInfo.end });
        setEditingAppointment(null);
        setIsModalOpen(true);
    }, []);

    // Handle event click (edit existing)
    const handleSelectEvent = useCallback(async (event: CalendarEvent) => {
        try {
            const res = await fetch(`/api/appointments/${event.id}`);
            if (res.ok) {
                const apt = await res.json();
                setEditingAppointment(apt);
                setSelectedSlot({ start: new Date(apt.startTime), end: new Date(apt.endTime) });
                setIsModalOpen(true);
            }
        } catch (error) {
            console.error("Error fetching appointment details:", error);
        }
    }, []);

    // Handle event drop (move)
    const handleEventDrop = useCallback(async ({ event, start, end, resourceId }: EventInteractionArgs<CalendarEvent> & { resourceId?: string }) => {
        try {
            const body: any = {
                startTime: (start as Date).toISOString(),
                endTime: (end as Date).toISOString(),
            };

            // If dropped on a different resource (employee), update that too
            if (resourceId && resourceId !== "unassigned" && resourceId !== event.resourceId) {
                body.employeeId = resourceId;
            } else if (resourceId === "unassigned") {
                body.employeeId = null;
            }

            await fetch(`/api/appointments/${event.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            fetchAppointments();
        } catch (error) {
            console.error("Error updating appointment:", error);
        }
    }, [fetchAppointments]);

    // Handle event resize
    const handleEventResize = useCallback(async ({ event, start, end }: EventInteractionArgs<CalendarEvent>) => {
        try {
            await fetch(`/api/appointments/${event.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    startTime: (start as Date).toISOString(),
                    endTime: (end as Date).toISOString(),
                }),
            });
            fetchAppointments();
        } catch (error) {
            console.error("Error resizing appointment:", error);
        }
    }, [fetchAppointments]);

    // Custom event styling - use employee color if available, otherwise service color
    const eventStyleGetter = useCallback((event: CalendarEvent) => {
        const color = event.resource.employeeColor || event.resource.serviceColor || "#3B82F6";
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
        event: "Cita",
        noEventsInRange: "No hay citas en este rango.",
        showMore: (total: number) => `+${total} más`,
    }), []);

    const handleModalClose = useCallback(() => {
        setIsModalOpen(false);
        setSelectedSlot(null);
        setEditingAppointment(null);
    }, []);

    const handleAppointmentSaved = useCallback(() => {
        fetchAppointments();
        handleModalClose();
    }, [fetchAppointments, handleModalClose]);

    const toggleEmployee = (id: string) => {
        const newSet = new Set(selectedEmployees);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedEmployees(newSet);
    };

    const selectAllEmployees = () => {
        setSelectedEmployees(new Set(employees.map(e => e.id)));
    };

    const deselectAllEmployees = () => {
        setSelectedEmployees(new Set());
    };

    return (
        <div className="services-calendar-container">
            {/* Header */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
                flexWrap: "wrap",
                gap: "12px"
            }}>
                <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A" }}>
                    Calendario de Citas
                </h2>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {/* View Mode Toggle */}
                    <div style={{
                        display: "flex",
                        backgroundColor: "#F1F5F9",
                        borderRadius: "10px",
                        padding: "4px"
                    }}>
                        <button
                            onClick={() => setViewMode('normal')}
                            style={{
                                padding: "8px 12px",
                                borderRadius: "8px",
                                border: "none",
                                backgroundColor: viewMode === 'normal' ? "#3B82F6" : "transparent",
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
                            onClick={() => {
                                setViewMode('resource');
                                // Force day view when switching to resource view
                                setView(Views.DAY);
                            }}
                            style={{
                                padding: "8px 12px",
                                borderRadius: "8px",
                                border: "none",
                                backgroundColor: viewMode === 'resource' ? "#3B82F6" : "transparent",
                                color: viewMode === 'resource' ? "white" : "#64748B",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "13px"
                            }}
                        >
                            <Users size={16} />
                            Por Staff
                        </button>
                    </div>

                    {/* Filter Button */}
                    <div style={{ position: "relative" }}>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            style={{
                                padding: "10px 14px",
                                borderRadius: "10px",
                                border: "1px solid #E2E8F0",
                                backgroundColor: showFilters ? "#EFF6FF" : "white",
                                color: showFilters ? "#3B82F6" : "#64748B",
                                fontWeight: 500,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                            }}
                        >
                            <Filter size={16} />
                            Filtrar
                            {selectedEmployees.size < employees.length && (
                                <span style={{
                                    backgroundColor: "#3B82F6",
                                    color: "white",
                                    borderRadius: "50%",
                                    width: "18px",
                                    height: "18px",
                                    fontSize: "11px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}>
                                    {selectedEmployees.size}
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
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "12px",
                                    paddingBottom: "8px",
                                    borderBottom: "1px solid #E2E8F0"
                                }}>
                                    <button
                                        onClick={selectAllEmployees}
                                        style={{
                                            fontSize: "12px",
                                            color: "#3B82F6",
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            fontWeight: 600
                                        }}
                                    >
                                        Todos
                                    </button>
                                    <button
                                        onClick={deselectAllEmployees}
                                        style={{
                                            fontSize: "12px",
                                            color: "#64748B",
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer"
                                        }}
                                    >
                                        Ninguno
                                    </button>
                                </div>

                                <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                                    {employees.map(emp => (
                                        <div
                                            key={emp.id}
                                            onClick={() => toggleEmployee(emp.id)}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "10px",
                                                padding: "8px",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                                backgroundColor: selectedEmployees.has(emp.id) ? "#EFF6FF" : "transparent"
                                            }}
                                        >
                                            <div style={{
                                                width: "20px",
                                                height: "20px",
                                                borderRadius: "6px",
                                                border: `2px solid ${selectedEmployees.has(emp.id) ? "#3B82F6" : "#CBD5E1"}`,
                                                backgroundColor: selectedEmployees.has(emp.id) ? "#3B82F6" : "white",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                            }}>
                                                {selectedEmployees.has(emp.id) && <Check size={12} color="white" />}
                                            </div>
                                            <div style={{
                                                width: "12px",
                                                height: "12px",
                                                borderRadius: "50%",
                                                backgroundColor: emp.color || "#3B82F6"
                                            }} />
                                            <span style={{ fontSize: "14px", fontWeight: 500 }}>
                                                {emp.firstName} {emp.lastName}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setShowFilters(false)}
                                    style={{
                                        width: "100%",
                                        marginTop: "12px",
                                        padding: "8px",
                                        borderRadius: "8px",
                                        border: "none",
                                        backgroundColor: "#F1F5F9",
                                        color: "#64748B",
                                        fontWeight: 600,
                                        cursor: "pointer"
                                    }}
                                >
                                    Cerrar
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            setSelectedSlot({ start: new Date(), end: addHours(new Date(), 1) });
                            setEditingAppointment(null);
                            setIsModalOpen(true);
                        }}
                        className="button-modern"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)"
                        }}
                    >
                        <Plus size={18} />
                        Nueva Cita
                    </button>
                </div>
            </div>

            {/* Resource View Notice */}
            {viewMode === 'resource' && (
                <div style={{
                    backgroundColor: "#EFF6FF",
                    border: "1px solid #BFDBFE",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px"
                }}>
                    <Users size={18} color="#3B82F6" />
                    <span style={{ color: "#1E40AF", fontSize: "14px" }}>
                        <strong>Vista por Staff:</strong> Cada columna es un empleado. Arrastra citas entre columnas para reasignar.
                    </span>
                </div>
            )}

            {/* Calendar */}
            <div style={{
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
                        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
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
                    min={new Date(2024, 0, 1, 7, 0, 0)}
                    max={new Date(2024, 0, 1, 21, 0, 0)}
                    style={{ height: "650px" }}
                    defaultView={Views.WEEK}
                    views={viewMode === 'resource' ? [Views.DAY] : [Views.DAY, Views.WEEK, Views.MONTH]}
                    popup
                    showMultiDayTimes
                    // Resource view props
                    {...(viewMode === 'resource' ? {
                        resources: resources,
                        resourceIdAccessor: "id" as any,
                        resourceTitleAccessor: "title" as any,
                    } : {})}
                />
            </div>

            {/* Modal */}
            <AppointmentModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSave={handleAppointmentSaved}
                startTime={selectedSlot?.start || new Date()}
                endTime={selectedSlot?.end || addHours(new Date(), 1)}
                appointment={editingAppointment}
            />
        </div>
    );
}
