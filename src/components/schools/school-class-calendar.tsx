"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Calendar, dateFnsLocalizer, Views, SlotInfo } from "react-big-calendar";
import withDragAndDrop, { EventInteractionArgs } from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay, addHours, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, ChevronLeft, ChevronRight, CalendarDays, GraduationCap, Building, X, Clock, MapPin, Users, Trash2, Edit } from "lucide-react";
import { useBranch } from "@/context/branch-context";
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/useIsMobile";
import { MobileTimePicker } from "@/components/ui/mobile-time-picker";

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
        id: string; // Add ID
        courseId?: string | null;
        courseName: string;
        classroomId?: string | null;
        classroomName: string;
        teacherId?: string | null;
        teacherName: string;
        status: string;
        dayOfWeek?: number;
        startTime?: string;
        endTime?: string;
        title?: string;
        studentIds?: string[];
        instanceDate?: string;
        isCancelled?: boolean;
        courseColor?: string;
    };
}

interface Course {
    id: string;
    name: string;
}

interface Classroom {
    id: string;
    name: string;
    capacity: number | null;
}

interface ClassSchedule {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    title?: string;
    courseId: string | null;
    course?: { id: string; name: string; color?: string; teacher?: { name: string } } | null;
    classroomId: string | null;
    classroom?: { id: string; name: string } | null;
    teacherId?: string | null;
    teacher?: { id: string; name: string } | null;
    enrollments?: { student: { id: string; firstName: string; lastName: string } }[];
    cancellations?: { date: string }[];
    validFrom?: string | null;
    validUntil?: string | null;
}

const statusColors: Record<string, string> = {
    ACTIVE: "#10b981",
    CANCELLED: "#ef4444",
};

export function SchoolClassCalendar() {
    const { toast } = useToast();
    const { selectedBranch } = useBranch();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [teachers, setTeachers] = useState<Array<{ id: string; name: string }>>([]);
    const [schedules, setSchedules] = useState<ClassSchedule[]>([]); // Raw schedules from API
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<typeof Views[keyof typeof Views]>(Views.WEEK);
    const [date, setDate] = useState(new Date());

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Fetch classrooms
    const fetchClassrooms = useCallback(async () => {
        if (!selectedBranch?.businessId) return;
        try {
            const res = await fetch(`/api/classrooms?businessId=${selectedBranch.businessId}`);
            if (res.ok) {
                const data = await res.json();
                setClassrooms(data);
            }
        } catch (error) {
            console.error("Error fetching classrooms:", error);
        }
    }, [selectedBranch?.businessId]);

    // Fetch courses
    const containerRef = useRef<HTMLDivElement>(null);

    // Robust fix for drag-and-drop offset: Monitor container size changes
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver(() => {
            // specific debug log to confirm it fires
            // console.log("Calendar container resized, forcing layout update"); 
            window.dispatchEvent(new Event('resize'));
        });

        resizeObserver.observe(containerRef.current);

        return () => resizeObserver.disconnect();
    }, []);

    // Also keep a fallback initial timeout for good measure, just in case
    useEffect(() => {
        const timers = [100, 500, 1000].map(delay =>
            setTimeout(() => window.dispatchEvent(new Event('resize')), delay)
        );
        return () => timers.forEach(clearTimeout);
    }, []);

    const fetchCourses = useCallback(async () => {
        if (!selectedBranch?.businessId) return;
        try {
            const res = await fetch(`/api/courses?businessId=${selectedBranch.businessId}`);
            if (res.ok) {
                const data = await res.json();
                setCourses(data);
            }
        } catch (error) {
            console.error("Error fetching courses:", error);
        }
    }, [selectedBranch?.businessId]);

    // Fetch schedules (rules)
    const fetchSchedules = useCallback(async () => {
        if (!selectedBranch?.businessId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/class-schedules?businessId=${selectedBranch.businessId}`);
            if (res.ok) {
                const data: ClassSchedule[] = await res.json();
                console.log("DEBUG: Fetched schedules:", data);
                setSchedules(data);
            }
        } catch (error) {
            console.error("Error fetching schedules:", error);
            toast({ title: "Error", description: "No se pudieron cargar los horarios", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [selectedBranch?.businessId, toast]);

    // Generate calendar events from schedules
    useEffect(() => {
        if (!schedules || schedules.length === 0) {
            setEvents([]);
            return;
        }

        const newEvents: CalendarEvent[] = [];
        const startRange = subMonths(date, 2);
        const endRange = addMonths(date, 2);

        schedules.forEach(schedule => {
            try {
                // Ensure validFrom is a valid date object
                const validFromDate = schedule.validFrom ? new Date(schedule.validFrom) : new Date(0);

                // Determine the starting point: max(view start, schedule start)
                let currentDate = new Date(Math.max(startRange.getTime(), validFromDate.getTime()));

                // Ensure dayOfWeek is a number
                const targetDay = Number(schedule.dayOfWeek);
                if (isNaN(targetDay)) {
                    console.warn(`Invalid dayOfWeek for schedule ${schedule.id}`);
                    return;
                }

                // Adjust to the correct dayOfWeek using math (safer than while loop)
                const currentDay = currentDate.getDay();
                const daysToAdd = (targetDay - currentDay + 7) % 7;
                currentDate = addDays(currentDate, daysToAdd);

                // Determine limit date
                const validUntilDate = schedule.validUntil ? new Date(schedule.validUntil) : new Date(32503680000000); // year 3000
                const limitDate = new Date(Math.min(endRange.getTime(), validUntilDate.getTime()));

                // Generate weekly instances
                let iterations = 0;
                while (currentDate <= limitDate && iterations < 100) { // Safety break
                    iterations++;

                    const dateStr = format(currentDate, "yyyy-MM-dd");
                    const isCancelled = schedule.cancellations?.some(c => {
                        // Assuming c.date is ISO string like "2024-01-07T00:00:00.000Z"
                        const cDateStr = String(c.date).split('T')[0];
                        return cDateStr === dateStr;
                    });

                    // Always render event (cancelled or not)
                    const [startHour, startMin] = schedule.startTime.split(":").map(Number);
                    const [endHour, endMin] = schedule.endTime.split(":").map(Number);

                    const start = new Date(currentDate);
                    start.setHours(startHour, startMin, 0, 0);

                    const end = new Date(currentDate);
                    end.setHours(endHour, endMin, 0, 0);

                    const enrolledStudentIds = schedule.enrollments?.map(e => e.student.id) || [];

                    newEvents.push({
                        id: `${schedule.id}-${dateStr}`,
                        title: isCancelled ? "(CANCELADA)" : (schedule.course?.name
                            ? `${schedule.course.name} - ${schedule.classroom?.name || "Sin aula"}`
                            : schedule.title || "Clase sin nombre"),
                        start,
                        end,
                        resourceId: schedule.classroomId || undefined,
                        resource: {
                            id: schedule.id,
                            courseId: schedule.courseId,
                            courseName: schedule.course?.name || schedule.title || "Sin curso",
                            classroomId: schedule.classroomId,
                            classroomName: schedule.classroom?.name || "Sin aula",
                            teacherId: schedule.teacherId,
                            teacherName: schedule.teacher?.name || schedule.course?.teacher?.name || "Sin maestro",
                            status: isCancelled ? "CANCELLED" : "ACTIVE",
                            dayOfWeek: targetDay,
                            startTime: schedule.startTime,
                            endTime: schedule.endTime,
                            title: schedule.title,
                            studentIds: enrolledStudentIds,
                            instanceDate: dateStr,
                            isCancelled: !!isCancelled,
                            courseColor: schedule.course?.color
                        },
                    });
                    currentDate = addWeeks(currentDate, 1);
                }
            } catch (err) {
                console.error("Error generating event for schedule:", schedule.id, err);
            }
        });

        console.log("DEBUG: Generated events:", newEvents.length);
        setEvents(newEvents);
    }, [schedules, date]);

    // Fetch teachers (employees with userId)
    const fetchTeachers = useCallback(async () => {
        if (!selectedBranch?.businessId) return;
        try {
            const res = await fetch(`/api/employees?businessId=${selectedBranch.businessId}`);
            if (res.ok) {
                const data = await res.json();
                // Only include employees that have a valid userId (linked to User table)
                const validTeachers = data
                    .filter((e: any) => e.userId)
                    .map((e: any) => ({ id: e.userId, name: e.name }));
                setTeachers(validTeachers);
            }
        } catch (error) {
            console.error("Error fetching teachers:", error);
        }
    }, [selectedBranch?.businessId]);

    useEffect(() => {
        if (!selectedBranch?.businessId) return;
        fetchClassrooms();
        fetchCourses();
        fetchTeachers();
        fetchSchedules();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedBranch?.businessId]);

    // Navigation
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

    const dateLabel = useMemo(() => {
        return format(date, "MMMM yyyy", { locale: es }).replace(/^\w/, (c) => c.toUpperCase());
    }, [date]);

    // Handle slot selection (click-and-drag to create)
    const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
        setSelectedSlot({ start: slotInfo.start, end: slotInfo.end });
        setSelectedEvent(null); // Clear selected event for creation mode
        setIsModalOpen(true);
    }, []);

    // Handle event click
    const handleSelectEvent = useCallback((event: CalendarEvent) => {
        setSelectedEvent(event);
        setIsViewModalOpen(true);
    }, []);

    // Event styling
    const eventStyleGetter = useCallback((event: CalendarEvent) => {
        const isCancelled = event.resource.isCancelled;
        // Use course color if available, otherwise fallback to status color or default blue
        const baseColor = event.resource.courseColor || statusColors[event.resource.status] || "#3B82F6";
        const color = isCancelled ? "#cbd5e1" : baseColor;

        return {
            style: {
                backgroundColor: color,
                borderRadius: "8px",
                opacity: isCancelled ? 0.6 : 1,
                color: isCancelled ? "#64748b" : "white",
                border: isCancelled ? "1px dashed #94a3b8" : "none",
                display: "block",
                boxShadow: isCancelled ? "none" : "0 2px 4px rgba(0,0,0,0.1)",
                textDecoration: isCancelled ? "line-through" : "none",
            },
        };
    }, []);

    // Fix for calendar render offset issue
    useEffect(() => {
        // Force a window resize event after mount to correct calendar layout calculation
        const timer = setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);
        return () => clearTimeout(timer);
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
        event: "Evento",
        noEventsInRange: "No hay clases programadas en este rango.",
        showMore: (total: number) => `+ ${total} más`,
    }), []);

    return (
        <div className="services-calendar-container">

            {/* Title */}
            <div style={{ marginBottom: "20px" }}>
                <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: "12px" }}>
                    <GraduationCap size={28} />
                    Calendario de Clases
                </h2>
            </div>

            {/* Controls (Action Buttons Only) */}
            <div style={{ marginBottom: "20px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "16px" }}>
                <button
                    type="button"
                    onClick={() => {
                        setSelectedSlot({ start: new Date(), end: addHours(new Date(), 1) });
                        setIsModalOpen(true);
                        toast({ title: "Nueva Clase", description: "Funcionalidad de creación próximamente" });
                    }}
                    className="button-modern"
                    style={{ display: "flex", alignItems: "center", gap: "8px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
                >
                    <Plus size={18} />
                    Nueva Clase
                </button>
            </div>

            {/* Calendar Container */}
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
                        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
                    </div>
                )}

                <DnDCalendar
                    localizer={localizer}
                    events={events as any}
                    view={view}
                    onView={(newView: any) => setView(newView)}
                    date={date}
                    onNavigate={(newDate: Date) => setDate(newDate)}
                    selectable
                    resizable
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent as any}
                    eventPropGetter={eventStyleGetter as any}
                    messages={messages}
                    culture="es"
                    step={15}
                    timeslots={4}
                    min={new Date(2024, 0, 1, 7, 0, 0)}
                    max={new Date(2024, 0, 1, 22, 0, 0)}
                    style={{ height: "700px" }}
                    defaultView={Views.WEEK}
                    views={[Views.DAY, Views.WEEK, Views.MONTH]}
                    popup
                    showMultiDayTimes

                />
            </div>

            {/* Modal for Creating/Editing Class */}
            {isModalOpen && selectedSlot && (
                <ClassScheduleModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedSlot(null);
                    }}
                    selectedSlot={selectedSlot}
                    courses={courses}
                    classrooms={classrooms}
                    teachers={teachers}
                    businessId={selectedBranch?.businessId || ""}
                    branchId={selectedBranch?.id || null}
                    onSave={() => {
                        fetchSchedules();
                        setIsModalOpen(false);
                        setSelectedSlot(null);
                        setSelectedEvent(null);
                    }}
                    initialData={selectedEvent ? selectedEvent.resource : undefined}
                />
            )}

            {/* View/Edit Event Modal */}
            {isViewModalOpen && selectedEvent && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                    }}
                    onClick={() => {
                        setIsViewModalOpen(false);
                        setSelectedEvent(null);
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: "white",
                            borderRadius: "20px",
                            padding: "32px",
                            minWidth: "400px",
                            maxWidth: "500px",
                            boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
                            maxHeight: "90vh",
                            overflowY: "auto",
                        }}
                    >
                        {/* Header */}
                        <div style={{ marginBottom: "24px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                                <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#0F172A", margin: 0 }}>
                                    {selectedEvent.title}
                                </h2>
                                <button
                                    onClick={() => {
                                        setIsViewModalOpen(false);
                                        setSelectedEvent(null);
                                    }}
                                    style={{
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "8px",
                                        border: "none",
                                        backgroundColor: "#f1f5f9",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <X size={18} color="#64748b" />
                                </button>
                            </div>
                            <div style={{
                                display: "inline-block",
                                padding: "4px 12px",
                                backgroundColor: "#10b981",
                                color: "white",
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: "600"
                            }}>
                                {selectedEvent.resource?.status === "ACTIVE" ? "Activa" : selectedEvent.resource?.status || "Activa"}
                            </div>
                        </div>

                        {/* Details */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "12px 16px",
                                backgroundColor: "#f8fafc",
                                borderRadius: "12px",
                            }}>
                                <Clock size={20} color="#3b82f6" />
                                <div>
                                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>Horario</div>
                                    <div style={{ fontSize: "16px", color: "#1e293b", fontWeight: "600" }}>
                                        {format(selectedEvent.start, "HH:mm")} - {format(selectedEvent.end, "HH:mm")}
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "12px 16px",
                                backgroundColor: "#f8fafc",
                                borderRadius: "12px",
                            }}>
                                <CalendarDays size={20} color="#10b981" />
                                <div>
                                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>Día</div>
                                    <div style={{ fontSize: "16px", color: "#1e293b", fontWeight: "600" }}>
                                        {format(selectedEvent.start, "EEEE, d 'de' MMMM", { locale: es })}
                                    </div>
                                </div>
                            </div>

                            {selectedEvent.resource?.classroomName && (
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "12px 16px",
                                    backgroundColor: "#f8fafc",
                                    borderRadius: "12px",
                                }}>
                                    <MapPin size={20} color="#f59e0b" />
                                    <div>
                                        <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>Aula</div>
                                        <div style={{ fontSize: "16px", color: "#1e293b", fontWeight: "600" }}>
                                            {selectedEvent.resource.classroomName}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedEvent.resource?.teacherName && (
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "12px 16px",
                                    backgroundColor: "#f8fafc",
                                    borderRadius: "12px",
                                }}>
                                    <Users size={20} color="#8b5cf6" />
                                    <div>
                                        <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>Profesor</div>
                                        <div style={{ fontSize: "16px", color: "#1e293b", fontWeight: "600" }}>
                                            {selectedEvent.resource.teacherName}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: "12px", flexDirection: "column" }}>
                            {/* Delete Session (Cancel) */}
                            <button
                                onClick={async () => {
                                    if (!confirm(`¿Cancelar solo la clase del ${selectedEvent.resource?.instanceDate}? (La serie recurrente se mantendrá)`)) return;
                                    try {
                                        const res = await fetch(`/api/class-schedules/${selectedEvent.resource.id}?date=${selectedEvent.resource?.instanceDate}`, { method: "DELETE" });
                                        if (res.ok) {
                                            toast({ title: "Clase cancelada", description: `Se canceló la sesión del ${selectedEvent.resource?.instanceDate}` });
                                            await fetchSchedules(); // Wait for fetch
                                            setIsViewModalOpen(false);
                                            setSelectedEvent(null);
                                        } else {
                                            toast({ title: "Error al cancelar", variant: "destructive" });
                                        }
                                    } catch {
                                        toast({ title: "Error al cancelar", variant: "destructive" });
                                    }
                                }}
                                style={{
                                    width: "100%",
                                    padding: "14px 24px",
                                    borderRadius: "12px",
                                    border: "2px solid #fecaca",
                                    backgroundColor: "#fff1f2",
                                    color: "#e11d48", // Rose-600
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                }}
                            >
                                <X size={18} />
                                Cancelar solo esta sesión
                            </button>

                            <div style={{ display: "flex", gap: "12px" }}>
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        console.log("DEBUG: Delete series clicked, scheduleId:", selectedEvent.resource?.id);
                                        if (!confirm("¿Eliminar TODA la serie recurrente? Esto borrará todas las clases futuras.")) {
                                            console.log("DEBUG: User cancelled confirmation");
                                            return;
                                        }
                                        console.log("DEBUG: User confirmed, proceeding with delete...");
                                        try {
                                            const deleteUrl = `/api/class-schedules/${selectedEvent.resource.id}`;
                                            console.log("DEBUG: Calling DELETE:", deleteUrl);
                                            const res = await fetch(deleteUrl, { method: "DELETE" });
                                            console.log("DEBUG: Delete response status:", res.status);
                                            if (res.ok) {
                                                toast({ title: "Serie eliminada", description: "Se han borrado todas las clases recurrentes." });
                                                await fetchSchedules(); // Wait for fetch
                                                setIsViewModalOpen(false);
                                                setSelectedEvent(null);
                                            } else {
                                                const errorData = await res.json().catch(() => ({}));
                                                console.error("DEBUG: Delete failed:", errorData);
                                                toast({ title: "Error al eliminar", description: errorData?.error || "Error desconocido", variant: "destructive" });
                                            }
                                        } catch (error) {
                                            console.error("DEBUG: Delete exception:", error);
                                            toast({ title: "Error al eliminar", variant: "destructive" });
                                        }
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: "14px 24px",
                                        borderRadius: "12px",
                                        backgroundColor: "#fee2e2", // Red-100
                                        color: "#991b1b", // Red-800
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "8px",
                                        border: "none"
                                    }}
                                >
                                    <Trash2 size={18} />
                                    Borrar Serie
                                </button>
                                <button
                                    onClick={() => {
                                        setIsViewModalOpen(false);
                                        setSelectedSlot({ start: selectedEvent.start, end: selectedEvent.end });
                                        setIsModalOpen(true);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: "14px 24px",
                                        borderRadius: "12px",
                                        border: "none",
                                        backgroundColor: "#3b82f6",
                                        color: "white",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <Edit size={18} />
                                    Editar Serie
                                </button>
                            </div>
                            <button
                                onClick={() => {
                                    setIsViewModalOpen(false);
                                    setSelectedEvent(null);
                                }}
                                style={{
                                    flex: 1,
                                    padding: "14px 24px",
                                    borderRadius: "12px",
                                    border: "none",
                                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                    color: "white",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
}

// Modal Component
interface ClassScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedSlot: { start: Date; end: Date };
    courses: Course[];
    classrooms: Classroom[];
    teachers: Array<{ id: string; name: string }>;
    businessId: string;
    branchId: string | null;
    onSave: () => void;
    initialData?: any;
}

function ClassScheduleModal({ isOpen, onClose, selectedSlot, courses, classrooms, teachers, businessId, branchId, onSave, initialData }: ClassScheduleModalProps) {
    const { toast } = useToast();
    const [selectedCourse, setSelectedCourse] = useState(initialData?.courseId || "");
    const [selectedClassroom, setSelectedClassroom] = useState(initialData?.classroomId || "");
    const [selectedTeacher, setSelectedTeacher] = useState(initialData?.teacherId || "");
    const [scheduleTitle, setScheduleTitle] = useState(initialData?.title || "");
    const [groupName, setGroupName] = useState(initialData?.groupName || "");
    const [selectedStudents, setSelectedStudents] = useState<string[]>(initialData?.studentIds || []);
    const [isRecurring, setIsRecurring] = useState(initialData ? false : true); // Default to false if editing
    const [validFrom, setValidFrom] = useState(format(new Date(), "yyyy-MM-dd"));
    const [validUntil, setValidUntil] = useState(format(addMonths(new Date(), 3), "yyyy-MM-dd"));
    const [selectedDays, setSelectedDays] = useState<number[]>(initialData ? [initialData.dayOfWeek] : [selectedSlot.start.getDay()]);
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [students, setStudents] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);

    // Editable times for mobile
    // Editable times for mobile
    const [editableStartTime, setEditableStartTime] = useState<Date>(
        initialData ? parse(initialData.startTime, "HH:mm", new Date()) : selectedSlot.start
    );
    const [editableEndTime, setEditableEndTime] = useState<Date>(
        initialData ? parse(initialData.endTime, "HH:mm", new Date()) : selectedSlot.end
    );
    const isMobile = useIsMobile();

    // Fetch students
    useEffect(() => {
        if (businessId) {
            fetch(`/api/students?businessId=${businessId}`)
                .then(res => res.ok ? res.json() : [])
                .then(data => setStudents(data))
                .catch(() => { });
        }
    }, [businessId]);

    const daysOfWeek = [
        { id: 0, label: "Dom" },
        { id: 1, label: "Lun" },
        { id: 2, label: "Mar" },
        { id: 3, label: "Mié" },
        { id: 4, label: "Jue" },
        { id: 5, label: "Vie" },
        { id: 6, label: "Sáb" },
    ];

    const toggleDay = (dayId: number) => {
        setSelectedDays(prev =>
            prev.includes(dayId)
                ? prev.filter(d => d !== dayId)
                : [...prev, dayId].sort()
        );
    };

    const toggleStudent = (studentId: string) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSave = async () => {
        // Limpiar errores anteriores
        setErrorMessage(null);

        if (selectedDays.length === 0) {
            const msg = "Selecciona al menos un día";
            setErrorMessage(msg);
            window.alert("⚠️ " + msg);
            return;
        }

        // Require at least a course or a title
        if (!selectedCourse && !scheduleTitle) {
            const msg = "Selecciona un curso o escribe un título para la clase";
            setErrorMessage(msg);
            window.alert("⚠️ " + msg);
            return;
        }

        setSaving(true);
        try {
            const startTime = format(editableStartTime, "HH:mm");
            const endTime = format(editableEndTime, "HH:mm");

            // If editing existing schedule
            if (initialData && initialData.id) {
                const res = await fetch(`/api/class-schedules/${initialData.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        courseId: selectedCourse || null,
                        classroomId: selectedClassroom || null,
                        teacherId: selectedTeacher || null,
                        title: scheduleTitle || null,
                        groupName: groupName || null,
                        startTime,
                        endTime,
                        dayOfWeek: selectedDays[0],
                    }),
                });

                if (!res.ok) {
                    const error = await res.json();
                    const errorMsg = error.details || error.message || "Error al actualizar clase";
                    setErrorMessage(errorMsg);
                    window.alert("⚠️ " + errorMsg);
                    setSaving(false);
                    return; // Salir sin lanzar error para evitar overlay de Next.js
                }

                // Update enrollments
                await fetch("/api/schedule-enrollments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        scheduleId: initialData.id,
                        studentIds: selectedStudents,
                        propagateToSiblings: true, // Auto-enroll in all course schedules
                    }),
                });

                toast({ title: "Clase actualizada" });
                onSave();
            } else {
                // Create one schedule per selected day
                const schedulePromises = selectedDays.map(dayOfWeek =>
                    fetch("/api/class-schedules", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            businessId,
                            branchId,
                            courseId: selectedCourse || null,
                            classroomId: selectedClassroom || null,
                            teacherId: selectedTeacher || null,
                            title: scheduleTitle || null,
                            groupName: groupName || null,
                            dayOfWeek,
                            startTime,
                            endTime,
                            validFrom: isRecurring ? validFrom : null,
                            validUntil: isRecurring ? validUntil : null,
                        }),
                    })
                );

                const responses = await Promise.all(schedulePromises);
                const createdSchedules: any[] = [];

                // Check for errors and collect created schedules
                for (const response of responses) {
                    if (!response.ok) {
                        const error = await response.json();
                        const errorMsg = error.details || error.message || "Error al guardar clase";
                        setErrorMessage(errorMsg);
                        window.alert("⚠️ " + errorMsg);
                        setSaving(false);
                        return; // Salir sin lanzar error para evitar overlay de Next.js
                    }
                    createdSchedules.push(await response.json());
                }

                // Enroll students in newly created schedules
                if (selectedStudents.length > 0) {
                    const enrollPromises = createdSchedules.map(schedule =>
                        fetch("/api/schedule-enrollments", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                scheduleId: schedule.id,
                                studentIds: selectedStudents,
                            }),
                        })
                    );
                    await Promise.all(enrollPromises);
                }
            }

            const dayNames = selectedDays.map(d => daysOfWeek.find(dw => dw.id === d)?.label).join(", ");
            toast({ title: "Clases programadas", description: `${dayNames} - ${startTime} a ${endTime}${selectedStudents.length > 0 ? ` (${selectedStudents.length} alumnos)` : ""}` });
            onSave();
        } catch (error: any) {
            console.error("Error saving schedule:", error);
            const errorMsg = error?.message || "No se pudo guardar la clase";
            setErrorMessage(errorMsg);
            // Mostrar alerta visible al usuario
            window.alert("⚠️ " + errorMsg);
            toast({
                title: "Error al guardar",
                description: errorMsg,
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: "white",
                    borderRadius: "16px",
                    padding: "24px",
                    width: "100%",
                    maxWidth: "480px",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    maxHeight: "90vh",
                    overflowY: "auto",
                }}
            >
                <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", marginBottom: "20px" }}>
                    Nueva Clase Programada
                </h3>

                {/* Error Banner */}
                {errorMessage && (
                    <div style={{
                        padding: "16px",
                        marginBottom: "16px",
                        backgroundColor: "#fef2f2",
                        border: "2px solid #fecaca",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px"
                    }}>
                        <div style={{ fontSize: "20px" }}>⚠️</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: "#dc2626", marginBottom: "4px" }}>
                                Conflicto de Horario
                            </div>
                            <div style={{ fontSize: "14px", color: "#7f1d1d" }}>
                                {errorMessage}
                            </div>
                        </div>
                        <button
                            onClick={() => setErrorMessage(null)}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "#dc2626",
                                fontSize: "18px",
                                padding: "4px"
                            }}
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Time Display - Always editable */}
                <MobileTimePicker
                    startTime={editableStartTime}
                    endTime={editableEndTime}
                    onStartTimeChange={setEditableStartTime}
                    onEndTimeChange={setEditableEndTime}
                    showDate={true}
                />

                {/* Course Select */}
                <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: 500, color: "#334155", fontSize: "14px" }}>
                        Curso {!scheduleTitle && <span style={{ color: "#dc2626" }}>*</span>}
                        <span style={{ fontSize: "12px", color: "#94a3b8", marginLeft: "6px" }}>(requerido si no hay título)</span>
                    </label>
                    <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                            fontSize: "14px",
                            backgroundColor: "white",
                        }}
                    >
                        <option value="">Seleccionar curso...</option>
                        {courses.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Group Name - for linking multiple days as one group */}
                <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: 500, color: "#334155", fontSize: "14px" }}>
                        Nombre del Grupo
                        <span style={{ fontSize: "12px", color: "#94a3b8", marginLeft: "6px" }}>(ej: Grupo A, Turno Matutino)</span>
                    </label>
                    <input
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Identificador para agrupar múltiples días"
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                            fontSize: "14px",
                            backgroundColor: "white",
                        }}
                    />
                    {selectedDays.length > 1 && (
                        <p style={{ fontSize: "12px", color: "#0ea5e9", marginTop: "6px" }}>
                            💡 Este nombre agrupará los {selectedDays.length} días seleccionados como un solo grupo
                        </p>
                    )}
                </div>

                {/* Classroom Select */}
                <div style={{ marginBottom: "24px" }}>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: 500, color: "#334155", fontSize: "14px" }}>
                        Aula (Opcional)
                    </label>
                    <select
                        value={selectedClassroom}
                        onChange={(e) => setSelectedClassroom(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                            fontSize: "14px",
                            backgroundColor: "white",
                        }}
                    >
                        <option value="">Sin aula asignada</option>
                        {classrooms.map(c => (
                            <option key={c.id} value={c.id}>{c.name} {c.capacity ? `(${c.capacity} lugares)` : ""}</option>
                        ))}
                    </select>
                </div>

                {/* Teacher Select */}
                <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: 500, color: "#334155", fontSize: "14px" }}>
                        Maestro (Opcional)
                    </label>
                    <select
                        value={selectedTeacher}
                        onChange={(e) => setSelectedTeacher(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                            fontSize: "14px",
                            backgroundColor: "white",
                        }}
                    >
                        <option value="">Sin maestro asignado</option>
                        {teachers.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>

                {/* Recurring Toggle */}
                <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={isRecurring}
                            onChange={(e) => setIsRecurring(e.target.checked)}
                            style={{ width: "18px", height: "18px", accentColor: "#10b981" }}
                        />
                        <span style={{ fontWeight: 500, color: "#334155", fontSize: "14px" }}>
                            Clase Recurrente (se repite cada semana)
                        </span>
                    </label>
                </div>

                {/* Days of Week Selector */}
                <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#334155", fontSize: "14px" }}>
                        Repetir en días:
                    </label>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {daysOfWeek.map(day => (
                            <button
                                key={day.id}
                                type="button"
                                onClick={() => toggleDay(day.id)}
                                style={{
                                    padding: "8px 14px",
                                    borderRadius: "8px",
                                    border: selectedDays.includes(day.id) ? "2px solid #10b981" : "1px solid #e2e8f0",
                                    backgroundColor: selectedDays.includes(day.id) ? "#ecfdf5" : "white",
                                    color: selectedDays.includes(day.id) ? "#059669" : "#64748b",
                                    fontWeight: selectedDays.includes(day.id) ? 600 : 400,
                                    fontSize: "13px",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                }}
                            >
                                {day.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date Range (only if recurring) */}
                {isRecurring && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
                        <div>
                            <label style={{ display: "block", marginBottom: "6px", fontWeight: 500, color: "#334155", fontSize: "14px" }}>
                                Desde
                            </label>
                            <input
                                type="date"
                                value={validFrom}
                                onChange={(e) => setValidFrom(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    borderRadius: "8px",
                                    border: "1px solid #e2e8f0",
                                    fontSize: "14px",
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "6px", fontWeight: 500, color: "#334155", fontSize: "14px" }}>
                                Hasta
                            </label>
                            <input
                                type="date"
                                value={validUntil}
                                onChange={(e) => setValidUntil(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    borderRadius: "8px",
                                    border: "1px solid #e2e8f0",
                                    fontSize: "14px",
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Student Selector */}
                <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 700, color: "#334155", fontSize: "16px" }}>
                        Gestionar Asistencia
                    </label>
                    <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px" }}>
                        Selecciona los alumnos que asistirán a esta clase.
                    </p>

                    <div style={{
                        maxHeight: "300px",
                        overflowY: "auto",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "0"
                    }}>
                        {/* Enrolled Section */}
                        {selectedStudents.length > 0 && (
                            <div>
                                <div style={{
                                    padding: "8px 12px",
                                    backgroundColor: "#dcfce7", // green-100
                                    color: "#166534", // green-800
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    borderBottom: "1px solid #bbf7d0",
                                    position: "sticky",
                                    top: 0,
                                    zIndex: 10,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px"
                                }}>
                                    <Users size={14} />
                                    ALUMNOS INSCRITOS ({selectedStudents.length})
                                </div>
                                {students
                                    .filter(s => selectedStudents.includes(s.id))
                                    .map(student => (
                                        <div
                                            key={student.id}
                                            onClick={() => toggleStudent(student.id)}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                padding: "10px 12px",
                                                cursor: "pointer",
                                                backgroundColor: "#f0fdf4",
                                                borderBottom: "1px solid #f1f5f9"
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={true}
                                                readOnly
                                                style={{ marginRight: "12px", accentColor: "#16a34a", width: "18px", height: "18px" }}
                                            />
                                            <span style={{ fontSize: "14px", color: "#0f172a", fontWeight: 600 }}>
                                                {student.firstName} {student.lastName}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        )}

                        {/* Available Section */}
                        <div>
                            <div style={{
                                padding: "8px 12px",
                                backgroundColor: "#f1f5f9",
                                color: "#475569",
                                fontSize: "12px",
                                fontWeight: "700",
                                borderBottom: "1px solid #e2e8f0",
                                borderTop: selectedStudents.length > 0 ? "1px solid #e2e8f0" : "none",
                                position: "sticky",
                                top: selectedStudents.length > 0 ? "relative" : 0,
                                zIndex: 10
                            }}>
                                DISPONIBLES PARA INSCRIBIR ({students.length - selectedStudents.length})
                            </div>
                            {students
                                .filter(s => !selectedStudents.includes(s.id))
                                .map(student => (
                                    <div
                                        key={student.id}
                                        onClick={() => toggleStudent(student.id)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            padding: "10px 12px",
                                            cursor: "pointer",
                                            transition: "background-color 0.1s",
                                            borderBottom: "1px solid #f1f5f9"
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={false}
                                            readOnly
                                            style={{ marginRight: "12px", accentColor: "#cbd5e1", width: "18px", height: "18px" }}
                                        />
                                        <span style={{ fontSize: "14px", color: "#334155" }}>
                                            {student.firstName} {student.lastName}
                                        </span>
                                    </div>
                                ))}
                            {students.length === 0 && (
                                <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                                    No hay alumnos disponibles.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: "10px 20px",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                            backgroundColor: "white",
                            color: "#64748b",
                            fontWeight: 500,
                            cursor: "pointer",
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            padding: "10px 20px",
                            borderRadius: "8px",
                            border: "none",
                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            color: "white",
                            fontWeight: 600,
                            cursor: saving ? "not-allowed" : "pointer",
                            opacity: saving ? 0.7 : 1,
                        }}
                    >
                        {saving ? "Guardando..." : "Guardar Clase"}
                    </button>
                </div>
            </div>
        </div>
    );
}

