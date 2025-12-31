"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar,
    Clock,
    Users,
    Phone,
    Mail,
    Plus,
    Search,
    RefreshCw,
    Check,
    X,
    ChevronLeft,
    ChevronRight,
    Utensils,
    AlertCircle,
    UserCheck,
    CalendarCheck,
    CalendarX
} from "lucide-react";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

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
    createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    PENDING: { label: "Pendiente", color: "#f59e0b", bg: "#fef3c7", icon: Clock },
    CONFIRMED: { label: "Confirmada", color: "#3b82f6", bg: "#dbeafe", icon: CalendarCheck },
    CANCELLED: { label: "Cancelada", color: "#ef4444", bg: "#fee2e2", icon: CalendarX },
    NO_SHOW: { label: "No llegó", color: "#6b7280", bg: "#f3f4f6", icon: AlertCircle },
    COMPLETED: { label: "Completada", color: "#10b981", bg: "#d1fae5", icon: UserCheck },
};

export function Reservations() {
    const { toast } = useToast();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [searchValue, setSearchValue] = useState("");
    const [filterStatus, setFilterStatus] = useState<string[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        customerName: "",
        phone: "",
        email: "",
        partySize: "2",
        date: "",
        time: "19:00",
        duration: "90",
        tableId: "",
        notes: "",
    });

    // Fetch reservations
    const fetchReservations = async () => {
        setLoading(true);
        try {
            const dateStr = selectedDate.toISOString().split("T")[0];
            const res = await fetch(`/api/restaurant/reservations?date=${dateStr}`);
            if (res.ok) {
                const data = await res.json();
                setReservations(data);
            }
        } catch (error) {
            console.error("Error fetching reservations:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch tables
    const fetchTables = async () => {
        try {
            const res = await fetch("/api/restaurant/tables");
            if (res.ok) {
                const data = await res.json();
                setTables(data);
            }
        } catch (error) {
            console.error("Error fetching tables:", error);
        }
    };

    useEffect(() => {
        fetchReservations();
        fetchTables();
    }, [selectedDate]);

    // Filter reservations
    const filteredReservations = useMemo(() => {
        return reservations.filter(r => {
            const matchesSearch = searchValue === "" ||
                r.customerName.toLowerCase().includes(searchValue.toLowerCase()) ||
                r.phone?.includes(searchValue);
            const matchesStatus = filterStatus.length === 0 || filterStatus.includes(r.status);
            return matchesSearch && matchesStatus;
        });
    }, [reservations, searchValue, filterStatus]);

    // KPIs
    const todayTotal = reservations.length;
    const confirmedCount = reservations.filter(r => r.status === "CONFIRMED").length;
    const pendingCount = reservations.filter(r => r.status === "PENDING").length;
    const totalPax = reservations.reduce((sum, r) => sum + r.partySize, 0);

    // Date navigation
    const changeDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };

    // Create reservation
    const handleCreate = async () => {
        try {
            const dateTime = new Date(`${formData.date}T${formData.time}`);
            const res = await fetch("/api/restaurant/reservations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerName: formData.customerName,
                    phone: formData.phone || null,
                    email: formData.email || null,
                    partySize: parseInt(formData.partySize),
                    date: dateTime.toISOString(),
                    duration: parseInt(formData.duration),
                    tableId: formData.tableId || null,
                    notes: formData.notes || null,
                }),
            });

            if (res.ok) {
                toast({ title: "Reservación creada", description: `${formData.customerName} - ${formData.partySize} personas` });
                setIsCreateOpen(false);
                setFormData({
                    customerName: "",
                    phone: "",
                    email: "",
                    partySize: "2",
                    date: "",
                    time: "19:00",
                    duration: "90",
                    tableId: "",
                    notes: "",
                });
                fetchReservations();
            } else {
                const error = await res.json();
                toast({ title: "Error", description: error.error, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "No se pudo crear la reservación", variant: "destructive" });
        }
    };

    // Update status
    const updateStatus = async (id: string, status: string) => {
        try {
            const res = await fetch("/api/restaurant/reservations", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status }),
            });

            if (res.ok) {
                toast({ title: "Estado actualizado" });
                fetchReservations();
            }
        } catch (error) {
            toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" });
        }
    };

    // Format time
    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    };

    // Format date for display
    const formatDateDisplay = (date: Date) => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return "Hoy";
        if (date.toDateString() === tomorrow.toDateString()) return "Mañana";

        return date.toLocaleDateString("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
        });
    };

    return (
        <div className="bg-slate-100 pb-16">
            {/* Header */}
            <div style={{ padding: "var(--spacing-lg)", marginBottom: "32px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
                            Reservaciones
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Gestiona las reservas de tu restaurante
                        </p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <button className="button-modern gradient-orange" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Plus size={20} />
                                Nueva Reservación
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle className="text-gradient-orange" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                                    Nueva Reservación
                                </DialogTitle>
                                <DialogDescription style={{ color: "#64748b" }}>
                                    Completa los datos para crear una nueva reservación
                                </DialogDescription>
                            </DialogHeader>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px 0" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>
                                        Nombre del Cliente *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.customerName}
                                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                        placeholder="Juan Pérez"
                                        className="modern-input"
                                    />
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>
                                            Teléfono
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+52 555 1234567"
                                            className="modern-input"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="cliente@email.com"
                                            className="modern-input"
                                        />
                                    </div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>
                                            Fecha *
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="modern-input"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>
                                            Hora *
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.time}
                                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                            className="modern-input"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>
                                            Personas *
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.partySize}
                                            onChange={(e) => setFormData({ ...formData, partySize: e.target.value })}
                                            min="1"
                                            className="modern-input"
                                        />
                                    </div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>
                                            Mesa (Opcional)
                                        </label>
                                        <select
                                            value={formData.tableId}
                                            onChange={(e) => setFormData({ ...formData, tableId: e.target.value })}
                                            className="modern-input"
                                        >
                                            <option value="">Sin asignar</option>
                                            {tables.map((table) => (
                                                <option key={table.id} value={table.id}>
                                                    {table.name} (Cap: {table.capacity})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>
                                            Duración (min)
                                        </label>
                                        <select
                                            value={formData.duration}
                                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                            className="modern-input"
                                        >
                                            <option value="60">1 hora</option>
                                            <option value="90">1.5 horas</option>
                                            <option value="120">2 horas</option>
                                            <option value="150">2.5 horas</option>
                                            <option value="180">3 horas</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>
                                        Notas
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Ocasión especial, alergias, preferencias..."
                                        className="modern-input"
                                        rows={2}
                                        style={{ resize: "none" }}
                                    />
                                </div>
                            </div>
                            <DialogFooter style={{ gap: "12px" }}>
                                <button onClick={() => setIsCreateOpen(false)} className="filter-chip">
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!formData.customerName || !formData.date || !formData.partySize}
                                    className="button-modern gradient-orange"
                                    style={{ opacity: (!formData.customerName || !formData.date || !formData.partySize) ? 0.5 : 1 }}
                                >
                                    Crear Reservación
                                </button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* KPIs */}
            <motion.div
                style={{ padding: "0 var(--spacing-lg)", marginBottom: "32px" }}
                initial="hidden"
                animate="show"
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <ModernKpiCard
                        title="Reservaciones"
                        value={todayTotal.toString()}
                        icon={Calendar}
                        gradientClass="gradient-courses"
                        subtitle={formatDateDisplay(selectedDate)}
                    />
                    <ModernKpiCard
                        title="Confirmadas"
                        value={confirmedCount.toString()}
                        icon={CalendarCheck}
                        gradientClass="gradient-students"
                        subtitle={`${todayTotal > 0 ? Math.round((confirmedCount / todayTotal) * 100) : 0}%`}
                    />
                    <ModernKpiCard
                        title="Pendientes"
                        value={pendingCount.toString()}
                        icon={Clock}
                        gradientClass="gradient-finance"
                        subtitle="Por confirmar"
                    />
                    <ModernKpiCard
                        title="Comensales"
                        value={totalPax.toString()}
                        icon={Users}
                        gradientClass="gradient-employees"
                        subtitle="Personas esperadas"
                    />
                </div>
            </motion.div>

            {/* Date Navigation & Filters */}
            <div style={{ padding: "0 var(--spacing-lg)", marginBottom: "24px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px" }}>
                    {/* Date Navigation */}
                    <div className="course-tabs-container" style={{ gap: "4px" }}>
                        <button onClick={() => changeDate(-1)} className="course-tab" style={{ padding: "10px" }}>
                            <ChevronLeft size={18} />
                        </button>
                        <div style={{ padding: "10px 20px", fontWeight: 600, color: "#1e293b", textTransform: "capitalize" }}>
                            {formatDateDisplay(selectedDate)}
                        </div>
                        <button onClick={() => changeDate(1)} className="course-tab" style={{ padding: "10px" }}>
                            <ChevronRight size={18} />
                        </button>
                        <button
                            onClick={() => setSelectedDate(new Date())}
                            className="course-tab"
                            data-state={selectedDate.toDateString() === new Date().toDateString() ? "active" : "inactive"}
                        >
                            Hoy
                        </button>
                    </div>

                    {/* Search */}
                    <div style={{ position: "relative", flex: "1", minWidth: "200px", maxWidth: "300px" }}>
                        <Search style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} size={18} />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            className="modern-input"
                            style={{ paddingLeft: "44px" }}
                        />
                    </div>

                    {/* Status Filters */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {["PENDING", "CONFIRMED", "CANCELLED"].map((status) => {
                            const config = statusConfig[status];
                            const isActive = filterStatus.includes(status);
                            const colorMap: Record<string, string> = {
                                PENDING: "orange",
                                CONFIRMED: "blue",
                                CANCELLED: "pink",
                            };
                            const colorClass = colorMap[status];
                            return (
                                <button
                                    key={status}
                                    onClick={() =>
                                        setFilterStatus((prev) =>
                                            prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
                                        )
                                    }
                                    className={isActive ? `filter-chip-active filter-chip-active-${colorClass}` : `filter-chip filter-chip-${colorClass}`}
                                >
                                    {config.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Refresh */}
                    <button onClick={fetchReservations} className="button-modern-sm button-modern-sm-blue">
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        <span>Actualizar</span>
                    </button>
                </div>
            </div>

            {/* Reservations List */}
            <section style={{ padding: "0 var(--spacing-lg)" }}>
                {loading ? (
                    <div className="modern-card" style={{ padding: "48px", textAlign: "center" }}>
                        <div className="animate-spin" style={{ width: "48px", height: "48px", border: "3px solid #f59e0b", borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 16px" }} />
                        <p style={{ color: "#64748b" }}>Cargando reservaciones...</p>
                    </div>
                ) : filteredReservations.length === 0 ? (
                    <div className="modern-card" style={{ padding: "48px", textAlign: "center" }}>
                        <Calendar size={48} style={{ margin: "0 auto 16px", color: "#cbd5e1" }} />
                        <p style={{ fontSize: "18px", fontWeight: 600, color: "#1e293b", marginBottom: "8px" }}>
                            No hay reservaciones
                        </p>
                        <p style={{ color: "#64748b" }}>
                            {searchValue ? "No se encontraron resultados" : `No hay reservaciones para ${formatDateDisplay(selectedDate).toLowerCase()}`}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {filteredReservations.map((reservation) => {
                            const StatusIcon = statusConfig[reservation.status]?.icon || Clock;
                            const statusStyle = statusConfig[reservation.status] || statusConfig.PENDING;

                            return (
                                <motion.div
                                    key={reservation.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="modern-card"
                                    style={{ padding: "20px", display: "flex", alignItems: "center", gap: "20px" }}
                                >
                                    {/* Time */}
                                    <div style={{ textAlign: "center", minWidth: "70px" }}>
                                        <p style={{ fontSize: "24px", fontWeight: "bold", color: "#1e293b" }}>
                                            {formatTime(reservation.date)}
                                        </p>
                                        <p style={{ fontSize: "12px", color: "#64748b" }}>{reservation.duration} min</p>
                                    </div>

                                    {/* Separator */}
                                    <div style={{ width: "2px", height: "50px", backgroundColor: "#e2e8f0", borderRadius: "1px" }} />

                                    {/* Details */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                                            <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#1e293b" }}>
                                                {reservation.customerName}
                                            </h3>
                                            <span
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    padding: "4px 10px",
                                                    borderRadius: "20px",
                                                    fontSize: "12px",
                                                    fontWeight: 600,
                                                    backgroundColor: statusStyle.bg,
                                                    color: statusStyle.color,
                                                }}
                                            >
                                                <StatusIcon size={12} />
                                                {statusStyle.label}
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", color: "#64748b", fontSize: "14px" }}>
                                            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                <Users size={14} />
                                                {reservation.partySize} personas
                                            </span>
                                            {reservation.table && (
                                                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <Utensils size={14} />
                                                    {reservation.table.name}
                                                </span>
                                            )}
                                            {reservation.phone && (
                                                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <Phone size={14} />
                                                    {reservation.phone}
                                                </span>
                                            )}
                                        </div>
                                        {reservation.notes && (
                                            <p style={{ marginTop: "8px", fontSize: "13px", color: "#94a3b8", fontStyle: "italic" }}>
                                                "{reservation.notes}"
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        {reservation.status === "PENDING" && (
                                            <>
                                                <button
                                                    onClick={() => updateStatus(reservation.id, "CONFIRMED")}
                                                    className="filter-chip-active filter-chip-active-blue"
                                                    style={{ padding: "8px 12px" }}
                                                >
                                                    <Check size={14} />
                                                    Confirmar
                                                </button>
                                                <button
                                                    onClick={() => updateStatus(reservation.id, "CANCELLED")}
                                                    className="filter-chip"
                                                    style={{ padding: "8px" }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </>
                                        )}
                                        {reservation.status === "CONFIRMED" && (
                                            <button
                                                onClick={() => updateStatus(reservation.id, "COMPLETED")}
                                                className="filter-chip-active filter-chip-active-emerald"
                                                style={{ padding: "8px 12px" }}
                                            >
                                                <UserCheck size={14} />
                                                Check-in
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
