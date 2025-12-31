"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, Utensils, Trash2, Check, X, CreditCard, Clock, Sparkles, SprayCan, UtensilsCrossed, CalendarClock, ClipboardList } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";
import { ModernFilterBar } from "@/components/ui/modern-filter-bar";
import { useToast } from "@/components/ui/use-toast";
import { PaymentModal } from "./payment-modal";
import { CreateOrderModal } from "./create-order-modal";

// Tipos expandidos
interface OrderItem {
    id: string;
    quantity: number;
    notes?: string | null;
    price?: number | null;
    guestName?: string | null;
    product: {
        name: string;
        price: number;
    };
}

interface Payment {
    id: string;
    amount: number;
    tip?: number | null;
    method: string;
    guestName?: string | null;
    timestamp: string;
}

interface Order {
    id: string;
    total: number;
    remainingAmount: number;
    status: string;
    items: OrderItem[];
    payments?: Payment[];
}

interface Table {
    id: string;
    name: string;
    capacity: number;
    status: "AVAILABLE" | "OCCUPIED" | "WAITING_FOOD" | "SERVING" | "PAYING" | "DIRTY" | "RESERVED";
    currentPax?: number | null;
    currentOrderId?: string | null;
    orders?: Order[];
}

// Configuración de estados de mesa
const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType; bg: string }> = {
    AVAILABLE: { label: 'Disponible', color: '#059669', icon: Check, bg: '#D1FAE5' },
    OCCUPIED: { label: 'Ocupada', color: '#2563EB', icon: Users, bg: '#DBEAFE' },
    WAITING_FOOD: { label: 'Esperando Comida', color: '#D97706', icon: Clock, bg: '#FEF3C7' },
    SERVING: { label: 'Sirviendo', color: '#7C3AED', icon: UtensilsCrossed, bg: '#EDE9FE' },
    PAYING: { label: 'Cobrar', color: '#DB2777', icon: CreditCard, bg: '#FCE7F3' },
    DIRTY: { label: 'Por Limpiar', color: '#64748B', icon: SprayCan, bg: '#F1F5F9' },
    RESERVED: { label: 'Reservada', color: '#EA580C', icon: CalendarClock, bg: '#FFEDD5' },
};

export function TableManager() {
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string[]>([]);
    const { toast } = useToast();

    // Form states
    const [newName, setNewName] = useState("");
    const [newCapacity, setNewCapacity] = useState("");

    // Occupy modal states
    const [occupyModal, setOccupyModal] = useState<{ open: boolean; table: Table | null }>({ open: false, table: null });
    const [paxCount, setPaxCount] = useState(2);

    // Payment modal states
    const [paymentModal, setPaymentModal] = useState<{ open: boolean; table: Table | null; order: Order | null }>({
        open: false,
        table: null,
        order: null
    });

    // Create order modal states
    const [orderModal, setOrderModal] = useState<{ open: boolean; table: Table | null }>({
        open: false,
        table: null
    });

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        try {
            const res = await fetch("/api/restaurant/tables");
            const data = await res.json();
            if (Array.isArray(data)) {
                setTables(data);
            }
        } catch (error) {
            console.error("Error fetching tables:", error);
        }
        setLoading(false);
    };

    const handleCreate = async () => {
        try {
            const res = await fetch("/api/restaurant/tables", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newName,
                    capacity: parseInt(newCapacity)
                })
            });
            if (res.ok) {
                toast({ title: "Mesa creada exitosamente" });
                setIsCreateOpen(false);
                setNewName("");
                setNewCapacity("");
                fetchTables();
            }
        } catch (error) {
            toast({ title: "Error al crear mesa", variant: "destructive" });
        }
    };

    // Ocupar mesa con PAX
    const handleOccupyTable = async () => {
        if (!occupyModal.table) return;

        try {
            await fetch("/api/restaurant/tables", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tableId: occupyModal.table.id,
                    status: "OCCUPIED",
                    currentPax: paxCount
                })
            });
            toast({ title: `Mesa ocupada con ${paxCount} personas` });
            setOccupyModal({ open: false, table: null });
            setPaxCount(2);
            fetchTables();
        } catch (error) {
            toast({ title: "Error al ocupar mesa", variant: "destructive" });
        }
    };

    // Liberar mesa
    const handleFreeTable = async (tableId: string) => {
        try {
            await fetch("/api/restaurant/tables", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tableId, status: "AVAILABLE" })
            });
            toast({ title: "Mesa liberada" });
            fetchTables();
        } catch (error) {
            toast({ title: "Error al liberar mesa", variant: "destructive" });
        }
    };

    // Marcar como limpia (de DIRTY a AVAILABLE)
    const handleCleanTable = async (tableId: string) => {
        try {
            await fetch("/api/restaurant/tables", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tableId, status: "AVAILABLE" })
            });
            toast({ title: "Mesa marcada como limpia" });
            fetchTables();
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar esta mesa?")) return;
        try {
            const res = await fetch("/api/restaurant/tables", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: [id] })
            });
            if (res.ok) {
                toast({ title: "Mesa eliminada" });
                fetchTables();
            }
        } catch (error) {
            toast({ title: "Error al eliminar", variant: "destructive" });
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectionMode = () => {
        const nextMode = !isSelectionMode;
        setIsSelectionMode(nextMode);
        if (!nextMode) setSelectedIds([]);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`¿Eliminar ${selectedIds.length} mesas permanentemente?`)) return;

        setIsDeletingBulk(true);
        try {
            const res = await fetch("/api/restaurant/tables", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: selectedIds }),
            });

            if (res.ok) {
                toast({ title: "Mesas eliminadas exitosamente" });
                setSelectedIds([]);
                setIsSelectionMode(false);
                fetchTables();
            }
        } catch (error) {
            toast({ title: "Error al eliminar mesas", variant: "destructive" });
        } finally {
            setIsDeletingBulk(false);
        }
    };

    // Abrir modal de pago
    const openPaymentModal = (table: Table) => {
        const activeOrder = table.orders?.[0];
        if (activeOrder) {
            setPaymentModal({ open: true, table, order: activeOrder });
        } else {
            toast({ title: "No hay orden activa en esta mesa", variant: "destructive" });
        }
    };

    const filteredTables = tables.filter(table => {
        const matchesSearch = searchValue === "" ||
            table.name.toLowerCase().includes(searchValue.toLowerCase());
        const matchesFilter = filterStatus.length === 0 || filterStatus.includes(table.status);
        return matchesSearch && matchesFilter;
    });

    // Stats
    const totalTables = tables.length;
    const availableTables = tables.filter(t => t.status === "AVAILABLE").length;
    const occupiedTables = tables.filter(t => !["AVAILABLE", "DIRTY", "RESERVED"].includes(t.status)).length;
    const totalPax = tables.reduce((sum, t) => sum + (t.currentPax || 0), 0);

    // Colors for cards
    const tableColors: Record<number, { bg: string; accent: string }> = {
        0: { bg: '#FFEDD5', accent: '#EA580C' },
        1: { bg: '#D1FAE5', accent: '#059669' },
        2: { bg: '#DBEAFE', accent: '#2563EB' },
        3: { bg: '#FCE7F3', accent: '#DB2777' },
        4: { bg: '#EDE9FE', accent: '#7C3AED' },
        5: { bg: '#CCFBF1', accent: '#0D9488' },
    };

    // Get action buttons based on table status
    const getTableActions = (table: Table) => {
        const status = table.status;

        switch (status) {
            case 'AVAILABLE':
                return (
                    <button
                        onClick={(e) => { e.stopPropagation(); setOccupyModal({ open: true, table }); }}
                        className="button-modern gradient-green"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        <Users size={16} />
                        Ocupar
                    </button>
                );
            case 'OCCUPIED':
                const hasActiveOrder = table.orders && table.orders.length > 0;
                return (
                    <div className="flex gap-2 w-full">
                        {!hasActiveOrder ? (
                            <button
                                onClick={(e) => { e.stopPropagation(); setOrderModal({ open: true, table }); }}
                                className="button-modern gradient-orange"
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            >
                                <ClipboardList size={14} />
                                Tomar Orden
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setOrderModal({ open: true, table }); }}
                                    className="filter-chip filter-chip-orange"
                                    style={{ padding: '10px 12px' }}
                                >
                                    <Plus size={14} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); openPaymentModal(table); }}
                                    className="button-modern gradient-purple"
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                >
                                    <CreditCard size={14} />
                                    Cobrar
                                </button>
                            </>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); handleFreeTable(table.id); }}
                            className="filter-chip"
                            style={{ padding: '10px 12px' }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                );
            case 'WAITING_FOOD':
            case 'SERVING':
                return (
                    <div className="flex gap-2 w-full">
                        <button
                            onClick={(e) => { e.stopPropagation(); setOrderModal({ open: true, table }); }}
                            className="filter-chip filter-chip-orange"
                            style={{ padding: '10px 12px' }}
                            title="Agregar más items"
                        >
                            <Plus size={14} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); openPaymentModal(table); }}
                            className="button-modern gradient-purple"
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                            <CreditCard size={14} />
                            Cobrar
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleFreeTable(table.id); }}
                            className="filter-chip"
                            style={{ padding: '10px 12px' }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                );
            case 'PAYING':
                return (
                    <button
                        onClick={(e) => { e.stopPropagation(); openPaymentModal(table); }}
                        className="button-modern gradient-pink"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        <CreditCard size={16} />
                        Continuar Cobro
                    </button>
                );
            case 'DIRTY':
                return (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleCleanTable(table.id); }}
                        className="button-modern"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, #475569 0%, #64748b 100%)' }}
                    >
                        <Sparkles size={16} />
                        Marcar Limpia
                    </button>
                );
            case 'RESERVED':
                return (
                    <button
                        onClick={(e) => { e.stopPropagation(); setOccupyModal({ open: true, table }); }}
                        className="button-modern gradient-orange"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        <Users size={16} />
                        Check-in
                    </button>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-slate-100 pb-16">
            {/* HEADER */}
            <div style={{
                padding: 'var(--spacing-lg)',
                marginBottom: '64px',
                position: 'relative',
                zIndex: 10
            }}>
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
                        Mesas
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Gestiona las mesas de tu restaurante
                    </p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <ModernKpiCard
                        title="Total Mesas"
                        value={totalTables.toString()}
                        icon={Utensils}
                        gradientClass="gradient-courses"
                        subtitle="Mesas configuradas"
                    />
                    <ModernKpiCard
                        title="Disponibles"
                        value={availableTables.toString()}
                        icon={Check}
                        gradientClass="gradient-students"
                        subtitle="Listas para clientes"
                    />
                    <ModernKpiCard
                        title="Ocupadas"
                        value={occupiedTables.toString()}
                        icon={Users}
                        gradientClass="gradient-employees"
                        subtitle="Actualmente en uso"
                    />
                    <ModernKpiCard
                        title="Comensales"
                        value={totalPax.toString()}
                        icon={Users}
                        gradientClass="gradient-finance"
                        subtitle="Personas en el local"
                    />
                </div>
            </motion.div>

            {/* FILTROS Y BOTONES */}
            <div style={{ padding: '0 var(--spacing-lg)', marginBottom: '24px', marginTop: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <ModernFilterBar
                            searchValue={searchValue}
                            onSearchChange={setSearchValue}
                            placeholder="Buscar mesas..."
                            filters={[
                                { label: "Disponibles", value: "AVAILABLE", color: "green" },
                                { label: "Ocupadas", value: "OCCUPIED", color: "blue" },
                                { label: "Esperando", value: "WAITING_FOOD", color: "orange" },
                                { label: "Sirviendo", value: "SERVING", color: "purple" },
                                { label: "Por Cobrar", value: "PAYING", color: "pink" },
                                { label: "Por Limpiar", value: "DIRTY", color: "gray" },
                            ]}
                            activeFilters={filterStatus}
                            onFilterToggle={(value) => {
                                setFilterStatus(prev =>
                                    prev.includes(value)
                                        ? prev.filter(v => v !== value)
                                        : [...prev, value]
                                );
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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

                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <button style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 20px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    backgroundColor: '#EA580C',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)'
                                }}>
                                    <Plus size={18} />
                                    Nueva Mesa
                                </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="text-gradient-orange" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                        Crear Nueva Mesa
                                    </DialogTitle>
                                    <DialogDescription style={{ color: '#64748b' }}>
                                        Agrega una nueva mesa a tu restaurante
                                    </DialogDescription>
                                </DialogHeader>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px 0' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                                            Nombre / Número de Mesa
                                        </label>
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder="Ej: Mesa 1, Terraza A"
                                            className="modern-input"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                                            Capacidad (Personas)
                                        </label>
                                        <input
                                            type="number"
                                            value={newCapacity}
                                            onChange={(e) => setNewCapacity(e.target.value)}
                                            placeholder="4"
                                            min="1"
                                            className="modern-input"
                                        />
                                    </div>
                                </div>
                                <DialogFooter style={{ gap: '12px' }}>
                                    <button
                                        onClick={() => setIsCreateOpen(false)}
                                        className="filter-chip"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleCreate}
                                        disabled={!newName || !newCapacity}
                                        className="button-modern gradient-orange"
                                        style={{ opacity: (!newName || !newCapacity) ? 0.5 : 1 }}
                                    >
                                        Crear Mesa
                                    </button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            {/* Selection Mode Bar */}
            {isSelectionMode && (
                <div style={{ padding: '0 var(--spacing-lg)', marginBottom: '24px' }}>
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
                                backgroundColor: '#EA580C',
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
                                {selectedIds.length === 0 ? 'Haz clic en las mesas para seleccionarlas' : 'mesas seleccionadas'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setSelectedIds(filteredTables.map(t => t.id))}
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
                                Seleccionar todas
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
                                        gap: '8px'
                                    }}
                                >
                                    <Trash2 size={16} />
                                    Eliminar seleccionadas
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TABLE CARDS GRID */}
            <section style={{ padding: '0 var(--spacing-lg)', minHeight: '400px' }} className="pb-8">
                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="animate-spin w-12 h-12 border-2 border-orange-600 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-slate-500">Cargando mesas...</p>
                    </div>
                ) : filteredTables.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">🍽️</div>
                        <p className="text-slate-500 text-lg">No hay mesas disponibles</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                        {filteredTables.map((table, index) => {
                            const isSelected = selectedIds.includes(table.id);
                            const colors = tableColors[index % 6];
                            const status = statusConfig[table.status] || statusConfig.AVAILABLE;
                            const StatusIcon = status.icon;
                            const activeOrder = table.orders?.[0];

                            return (
                                <motion.div
                                    key={table.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => isSelectionMode && toggleSelection(table.id)}
                                    style={{
                                        backgroundColor: status.bg,
                                        borderRadius: '20px',
                                        padding: '24px',
                                        minHeight: '200px',
                                        boxShadow: isSelected ? '0 0 0 3px #EA580C' : '0 10px 40px rgba(0,0,0,0.08)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        position: 'relative',
                                        cursor: isSelectionMode ? 'pointer' : 'default',
                                        transition: 'all 0.2s ease'
                                    }}
                                    className="hover:shadow-lg"
                                >
                                    {isSelectionMode && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: '16px',
                                                right: '16px',
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '6px',
                                                backgroundColor: isSelected ? colors.accent : 'white',
                                                border: isSelected ? 'none' : '2px solid #E2E8F0',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            {isSelected && <Check size={14} color="white" />}
                                        </div>
                                    )}

                                    {/* Icon and Name */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div
                                            style={{
                                                width: '56px',
                                                height: '56px',
                                                borderRadius: '14px',
                                                backgroundColor: status.color,
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                            }}
                                        >
                                            <StatusIcon size={28} />
                                        </div>
                                        {table.currentPax && (
                                            <div className="flex items-center gap-1 bg-white/80 px-3 py-1.5 rounded-full">
                                                <Users size={14} className="text-slate-600" />
                                                <span className="font-bold text-slate-700">{table.currentPax}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Name */}
                                    <h3 style={{
                                        fontSize: '20px',
                                        fontWeight: 'bold',
                                        color: '#1E293B',
                                        marginBottom: '8px'
                                    }}>
                                        {table.name}
                                    </h3>

                                    {/* Status Badge */}
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 12px',
                                        backgroundColor: 'rgba(255,255,255,0.8)',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        color: status.color,
                                        width: 'fit-content',
                                        marginBottom: '12px'
                                    }}>
                                        <StatusIcon size={12} />
                                        {status.label}
                                    </span>

                                    {/* Capacity */}
                                    <div style={{ flex: 1, fontSize: '14px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Utensils size={14} />
                                        Capacidad: {table.capacity} personas
                                    </div>

                                    {/* Order Total if exists */}
                                    {activeOrder && (
                                        <div className="mt-2 p-2 bg-white/60 rounded-lg text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Total:</span>
                                                <span className="font-bold">${activeOrder.total.toFixed(2)}</span>
                                            </div>
                                            {activeOrder.remainingAmount < activeOrder.total && (
                                                <div className="flex justify-between text-green-600">
                                                    <span>Pagado:</span>
                                                    <span className="font-medium">${(activeOrder.total - activeOrder.remainingAmount).toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    {!isSelectionMode && (
                                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.5)', display: 'flex', gap: '8px' }}>
                                            {getTableActions(table)}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(table.id); }}
                                                style={{
                                                    padding: '10px',
                                                    backgroundColor: 'rgba(255,255,255,0.6)',
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s'
                                                }}
                                            >
                                                <Trash2 size={16} color="#ef4444" />
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Occupy Modal */}
            <AnimatePresence>
                {occupyModal.open && occupyModal.table && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 9999,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            style={{
                                backgroundColor: 'white',
                                width: '100%',
                                maxWidth: '320px',
                                borderRadius: '16px',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{
                                padding: '20px',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white'
                            }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>Ocupar {occupyModal.table.name}</h3>
                                <p style={{ fontSize: '14px', opacity: 0.8 }}>Capacidad máxima: {occupyModal.table.capacity} personas</p>
                            </div>
                            <div style={{ padding: '24px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '12px', textAlign: 'center' }}>
                                    ¿Cuántas personas?
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '24px' }}>
                                    <button
                                        onClick={() => setPaxCount(Math.max(1, paxCount - 1))}
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            fontSize: '20px',
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: '#f1f5f9',
                                            border: 'none',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            color: '#475569'
                                        }}
                                    >
                                        -
                                    </button>
                                    <div style={{ textAlign: 'center', minWidth: '60px' }}>
                                        <span style={{ fontSize: '40px', fontWeight: 'bold', color: '#1e293b' }}>{paxCount}</span>
                                        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>personas</p>
                                    </div>
                                    <button
                                        onClick={() => setPaxCount(Math.min(occupyModal.table!.capacity + 2, paxCount + 1))}
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            fontSize: '20px',
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: '#f1f5f9',
                                            border: 'none',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            color: '#475569'
                                        }}
                                    >
                                        +
                                    </button>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => setOccupyModal({ open: false, table: null })}
                                        style={{
                                            flex: 1,
                                            padding: '12px 16px',
                                            backgroundColor: '#f1f5f9',
                                            border: 'none',
                                            borderRadius: '12px',
                                            fontWeight: 500,
                                            color: '#475569',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleOccupyTable}
                                        style={{
                                            flex: 1,
                                            padding: '12px 16px',
                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            fontWeight: 600,
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                                        }}
                                    >
                                        Confirmar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Payment Modal */}
            <AnimatePresence>
                {paymentModal.open && paymentModal.order && paymentModal.table && (
                    <PaymentModal
                        order={paymentModal.order}
                        tableName={paymentModal.table.name}
                        onClose={() => setPaymentModal({ open: false, table: null, order: null })}
                        onPaymentComplete={() => {
                            fetchTables();
                            setPaymentModal({ open: false, table: null, order: null });
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Create Order Modal */}
            <AnimatePresence>
                {orderModal.open && orderModal.table && (
                    <CreateOrderModal
                        tableId={orderModal.table.id}
                        tableName={orderModal.table.name}
                        currentPax={orderModal.table.currentPax}
                        onClose={() => setOrderModal({ open: false, table: null })}
                        onOrderCreated={() => {
                            fetchTables();
                            setOrderModal({ open: false, table: null });
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Floating Bulk Action Bar */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-3xl px-6"
                    >
                        <div className="bg-slate-900 text-white p-4 rounded-[2rem] shadow-2xl flex items-center justify-between gap-6 border border-white/10 backdrop-blur-2xl bg-slate-900/90">
                            <div className="flex items-center gap-5 pl-2">
                                <div className="w-16 h-16 rounded-[1.2rem] bg-orange-600 flex items-center justify-center font-black text-3xl shadow-lg shadow-orange-500/30 text-white">
                                    {selectedIds.length}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-white text-lg leading-tight">MESAS SELECCIONADAS</span>
                                    <span className="text-xs text-orange-300 font-medium">Gestionar selección múltiple</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 pr-2">
                                <button
                                    onClick={() => setSelectedIds(filteredTables.map(t => t.id))}
                                    className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                >
                                    Todas
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={isDeletingBulk}
                                    className="h-14 px-8 bg-red-600 hover:bg-red-500 text-white rounded-[1.2rem] font-bold flex items-center gap-3 shadow-lg shadow-red-600/20 active:scale-95 transition-all ml-2"
                                >
                                    {isDeletingBulk ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 size={20} />}
                                    ELIMINAR
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
