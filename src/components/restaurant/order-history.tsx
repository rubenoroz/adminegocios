"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Eye, Clock, CheckCircle, XCircle, Utensils, Users, CreditCard, RefreshCw, Calendar } from "lucide-react";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";
import { useToast } from "@/components/ui/use-toast";

interface OrderItem {
    id: string;
    quantity: number;
    notes?: string | null;
    guestName?: string | null;
    price?: number | null;
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
    status: string;
    type: string;
    total: number;
    remainingAmount: number;
    createdAt: string;
    customerName?: string | null;
    table?: {
        name: string;
    };
    items: OrderItem[];
    payments?: Payment[];
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: 'Pendiente', color: '#D97706', bg: '#FEF3C7' },
    CONFIRMED: { label: 'Confirmada', color: '#2563EB', bg: '#DBEAFE' },
    PREPARING: { label: 'Preparando', color: '#7C3AED', bg: '#EDE9FE' },
    READY: { label: 'Lista', color: '#059669', bg: '#D1FAE5' },
    SERVED: { label: 'Servida', color: '#0D9488', bg: '#CCFBF1' },
    COMPLETED: { label: 'Completada', color: '#16A34A', bg: '#DCFCE7' },
    CANCELLED: { label: 'Cancelada', color: '#DC2626', bg: '#FEE2E2' },
};

const typeLabels: Record<string, string> = {
    DINE_IN: 'En Mesa',
    TAKE_AWAY: 'Para Llevar',
    DELIVERY: 'Delivery',
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
};

export function OrderHistory() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchValue, setSearchValue] = useState("");
    const [filterStatus, setFilterStatus] = useState<string[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'all'>('today');
    const { toast } = useToast();

    useEffect(() => {
        fetchOrders();
    }, [dateFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/restaurant/orders?includeCompleted=true");
            const data = await res.json();
            if (Array.isArray(data)) {
                // Filtrar por fecha
                const filtered = data.filter((order: Order) => {
                    const orderDate = new Date(order.createdAt);
                    const now = new Date();

                    if (dateFilter === 'today') {
                        return orderDate.toDateString() === now.toDateString();
                    } else if (dateFilter === 'week') {
                        const weekAgo = new Date(now);
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return orderDate >= weekAgo;
                    }
                    return true;
                });
                setOrders(filtered);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast({ title: "Error al cargar órdenes", variant: "destructive" });
        }
        setLoading(false);
    };

    // Filtrar órdenes
    const filteredOrders = orders.filter(order => {
        const matchesSearch = searchValue === "" ||
            order.id.toLowerCase().includes(searchValue.toLowerCase()) ||
            order.table?.name.toLowerCase().includes(searchValue.toLowerCase()) ||
            order.customerName?.toLowerCase().includes(searchValue.toLowerCase());
        const matchesFilter = filterStatus.length === 0 || filterStatus.includes(order.status);
        return matchesSearch && matchesFilter;
    });

    // Stats
    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter(o => o.status === 'COMPLETED').length;
    const totalSales = filteredOrders.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + o.total, 0);
    const totalTips = filteredOrders.reduce((sum, o) =>
        sum + (o.payments?.reduce((pSum, p) => pSum + (p.tip || 0), 0) || 0), 0
    );

    const getTimeSince = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const minutes = Math.floor((now.getTime() - date.getTime()) / 60000);

        if (minutes < 1) return "Ahora";
        if (minutes < 60) return `Hace ${minutes} min`;
        if (minutes < 1440) return `Hace ${Math.floor(minutes / 60)}h`;
        return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="bg-slate-100 pb-16">
            {/* HEADER */}
            <div style={{
                padding: 'var(--spacing-lg)',
                marginBottom: '32px',
                position: 'relative',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
                            Historial de Órdenes
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Visualiza y gestiona todas las órdenes del restaurante
                        </p>
                    </div>
                    <button
                        onClick={fetchOrders}
                        className="button-modern-sm button-modern-sm-blue"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        <span>Actualizar</span>
                    </button>
                </div>
            </div>

            {/* KPIS */}
            <motion.div
                style={{ padding: '0 var(--spacing-lg)', marginBottom: '32px' }}
                initial="hidden"
                animate="show"
                variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                }}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <ModernKpiCard
                        title="Total Órdenes"
                        value={totalOrders.toString()}
                        icon={Utensils}
                        gradientClass="gradient-courses"
                        subtitle={dateFilter === 'today' ? 'Hoy' : dateFilter === 'week' ? 'Esta semana' : 'Todas'}
                    />
                    <ModernKpiCard
                        title="Completadas"
                        value={completedOrders.toString()}
                        icon={CheckCircle}
                        gradientClass="gradient-students"
                        subtitle={`${totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}%`}
                    />
                    <ModernKpiCard
                        title="Ventas Totales"
                        value={formatCurrency(totalSales)}
                        icon={CreditCard}
                        gradientClass="gradient-finance"
                        subtitle="Órdenes completadas"
                    />
                    <ModernKpiCard
                        title="Propinas"
                        value={formatCurrency(totalTips)}
                        icon={Users}
                        gradientClass="gradient-employees"
                        subtitle="Total recibido"
                    />
                </div>
            </motion.div>

            {/* FILTERS */}
            <div style={{ padding: '0 var(--spacing-lg)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
                    {/* Search */}
                    <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '400px' }}>
                        <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por ID, mesa o cliente..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            className="modern-input"
                            style={{ paddingLeft: '44px' }}
                        />
                    </div>

                    {/* Date Filter */}
                    <div className="course-tabs-container">
                        {[
                            { id: 'today', label: 'Hoy' },
                            { id: 'week', label: 'Semana' },
                            { id: 'all', label: 'Todas' },
                        ].map((d) => (
                            <button
                                key={d.id}
                                onClick={() => setDateFilter(d.id as any)}
                                data-state={dateFilter === d.id ? "active" : "inactive"}
                                className="course-tab"
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>

                    {/* Status Filters */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'].map((status) => {
                            const config = statusConfig[status];
                            const isActive = filterStatus.includes(status);
                            const colorMap: Record<string, string> = {
                                'PENDING': 'orange',
                                'PREPARING': 'purple',
                                'READY': 'emerald',
                                'COMPLETED': 'teal',
                                'CANCELLED': 'pink'
                            };
                            const colorClass = colorMap[status];
                            return (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(prev =>
                                        prev.includes(status)
                                            ? prev.filter(s => s !== status)
                                            : [...prev, status]
                                    )}
                                    className={isActive ? `filter-chip-active filter-chip-active-${colorClass}` : `filter-chip filter-chip-${colorClass}`}
                                >
                                    {config.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ORDERS LIST */}
            <section style={{ padding: '0 var(--spacing-lg)' }}>
                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="animate-spin w-12 h-12 border-2 border-orange-600 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-slate-500">Cargando órdenes...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">📋</div>
                        <p className="text-slate-500 text-lg">No hay órdenes que mostrar</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b font-medium text-sm text-slate-600 uppercase">
                            <div className="col-span-2">Orden</div>
                            <div className="col-span-2">Mesa / Cliente</div>
                            <div className="col-span-2">Tipo</div>
                            <div className="col-span-1">Items</div>
                            <div className="col-span-2">Total</div>
                            <div className="col-span-2">Estado</div>
                            <div className="col-span-1"></div>
                        </div>

                        {/* Orders */}
                        <AnimatePresence>
                            {filteredOrders.map((order, index) => {
                                const config = statusConfig[order.status] || statusConfig.PENDING;
                                return (
                                    <motion.div
                                        key={order.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="col-span-2">
                                            <p className="font-mono font-bold text-slate-800">
                                                #{order.id.substring(0, 8)}
                                            </p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                <Clock size={12} />
                                                {getTimeSince(order.createdAt)}
                                            </p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="font-medium text-slate-700">
                                                {order.table?.name || order.customerName || 'Sin asignar'}
                                            </p>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="px-2 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-600">
                                                {typeLabels[order.type] || order.type}
                                            </span>
                                        </div>
                                        <div className="col-span-1">
                                            <span className="font-medium">{order.items.length}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="font-bold text-slate-800">{formatCurrency(order.total)}</p>
                                            {order.remainingAmount > 0 && order.remainingAmount < order.total && (
                                                <p className="text-xs text-red-600">
                                                    Pendiente: {formatCurrency(order.remainingAmount)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="col-span-2">
                                            <span
                                                className="px-3 py-1.5 rounded-full text-xs font-bold"
                                                style={{
                                                    backgroundColor: config.bg,
                                                    color: config.color,
                                                }}
                                            >
                                                {config.label}
                                            </span>
                                        </div>
                                        <div className="col-span-1 text-right">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                            >
                                                <Eye size={18} className="text-slate-500" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </section>

            {/* Order Detail Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-6 border-b bg-slate-50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800">
                                            Orden #{selectedOrder.id.substring(0, 8)}
                                        </h3>
                                        <p className="text-sm text-slate-500">
                                            {new Date(selectedOrder.createdAt).toLocaleString('es-MX')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="p-2 hover:bg-slate-100 rounded-lg"
                                    >
                                        <XCircle size={24} className="text-slate-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {/* Order Info */}
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <p className="text-xs text-slate-500 mb-1">Mesa/Cliente</p>
                                        <p className="font-bold text-slate-800">
                                            {selectedOrder.table?.name || selectedOrder.customerName || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <p className="text-xs text-slate-500 mb-1">Tipo</p>
                                        <p className="font-bold text-slate-800">
                                            {typeLabels[selectedOrder.type] || selectedOrder.type}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <p className="text-xs text-slate-500 mb-1">Estado</p>
                                        <span
                                            className="px-2 py-1 rounded-full text-xs font-bold"
                                            style={{
                                                backgroundColor: statusConfig[selectedOrder.status]?.bg,
                                                color: statusConfig[selectedOrder.status]?.color,
                                            }}
                                        >
                                            {statusConfig[selectedOrder.status]?.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="mb-6">
                                    <h4 className="font-bold text-slate-700 mb-3">Items</h4>
                                    <div className="space-y-2">
                                        {selectedOrder.items.map((item) => (
                                            <div key={item.id} className="flex justify-between items-start bg-slate-50 p-3 rounded-lg">
                                                <div className="flex gap-3">
                                                    <span className="font-bold text-slate-600">{item.quantity}x</span>
                                                    <div>
                                                        <p className="font-medium text-slate-800">{item.product.name}</p>
                                                        {item.guestName && (
                                                            <p className="text-xs text-slate-500">Para: {item.guestName}</p>
                                                        )}
                                                        {item.notes && (
                                                            <p className="text-xs text-orange-600">📝 {item.notes}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="font-bold text-slate-700">
                                                    {formatCurrency((item.price ?? item.product.price) * item.quantity)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Payments */}
                                {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="font-bold text-slate-700 mb-3">Pagos</h4>
                                        <div className="space-y-2">
                                            {selectedOrder.payments.map((payment) => (
                                                <div key={payment.id} className="flex justify-between items-center bg-green-50 p-3 rounded-lg">
                                                    <div>
                                                        <span className="font-medium text-slate-700">{payment.method}</span>
                                                        {payment.guestName && (
                                                            <span className="text-slate-500 ml-2">({payment.guestName})</span>
                                                        )}
                                                        <p className="text-xs text-slate-500">
                                                            {new Date(payment.timestamp).toLocaleTimeString('es-MX')}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-bold text-green-600">
                                                            {formatCurrency(payment.amount)}
                                                        </span>
                                                        {payment.tip && payment.tip > 0 && (
                                                            <p className="text-xs text-slate-500">
                                                                + {formatCurrency(payment.tip)} propina
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Totals */}
                                <div className="border-t pt-4 space-y-2">
                                    <div className="flex justify-between text-lg">
                                        <span className="font-bold text-slate-800">Total</span>
                                        <span className="font-bold text-slate-800">
                                            {formatCurrency(selectedOrder.total)}
                                        </span>
                                    </div>
                                    {selectedOrder.remainingAmount > 0 && (
                                        <div className="flex justify-between text-red-600">
                                            <span>Pendiente</span>
                                            <span className="font-bold">
                                                {formatCurrency(selectedOrder.remainingAmount)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
