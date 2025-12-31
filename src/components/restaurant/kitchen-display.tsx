"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle, ChefHat, AlertCircle, Utensils, Timer, Bell, RefreshCw } from "lucide-react";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";
import { useToast } from "@/components/ui/use-toast";

interface OrderItem {
    id: string;
    quantity: number;
    notes?: string | null;
    guestName?: string | null;
    status?: string;
    product: {
        name: string;
    };
}

interface Order {
    id: string;
    status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "SERVED" | "COMPLETED" | "CANCELLED";
    type?: string;
    createdAt: string;
    table?: {
        name: string;
    };
    items: OrderItem[];
}

export function KitchenDisplay() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch("/api/restaurant/orders?status=PENDING");
            const data = await res.json();
            if (Array.isArray(data)) {
                setOrders(data.filter((o: Order) => o.status !== 'COMPLETED' && o.status !== 'SERVED'));
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
        setLoading(false);
    };

    const updateStatus = async (orderId: string, status: string) => {
        try {
            await fetch("/api/restaurant/orders", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, status })
            });
            toast({ title: `Orden actualizada a ${status}` });
            fetchOrders();
        } catch (error) {
            toast({ title: "Error al actualizar orden", variant: "destructive" });
        }
    };

    // Stats
    const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
    const preparingOrders = orders.filter(o => o.status === 'PREPARING').length;
    const readyOrders = orders.filter(o => o.status === 'READY').length;
    const totalItems = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

    const getTimeSince = (dateStr: string) => {
        const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
        if (minutes < 1) return "Ahora";
        if (minutes < 60) return `${minutes} min`;
        return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    };

    const orderColors: Record<number, { bg: string; accent: string }> = {
        0: { bg: '#FEF3C7', accent: '#D97706' },
        1: { bg: '#DBEAFE', accent: '#2563EB' },
        2: { bg: '#D1FAE5', accent: '#059669' },
        3: { bg: '#FCE7F3', accent: '#DB2777' },
        4: { bg: '#EDE9FE', accent: '#7C3AED' },
        5: { bg: '#FFEDD5', accent: '#EA580C' },
    };

    const statusConfig: Record<string, { label: string; color: string; nextLabel: string; nextStatus: string }> = {
        PENDING: { label: 'Pendiente', color: '#D97706', nextLabel: 'Empezar a Preparar', nextStatus: 'PREPARING' },
        PREPARING: { label: 'Preparando', color: '#2563EB', nextLabel: 'Marcar como Listo', nextStatus: 'READY' },
        READY: { label: '¡Listo!', color: '#059669', nextLabel: 'Servido', nextStatus: 'SERVED' },
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
                            Cocina (KDS)
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Kitchen Display System - Órdenes en tiempo real
                        </p>
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 20px',
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}>
                        <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: '#10B981',
                            animation: 'pulse 2s infinite'
                        }} />
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                            Actualización automática
                        </span>
                        <button
                            onClick={fetchOrders}
                            style={{
                                padding: '8px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#f1f5f9',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <RefreshCw size={16} color="#64748b" />
                        </button>
                    </div>
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
                        title="Pendientes"
                        value={pendingOrders.toString()}
                        icon={AlertCircle}
                        gradientClass="gradient-courses"
                        subtitle="Esperando preparación"
                    />
                    <ModernKpiCard
                        title="Preparando"
                        value={preparingOrders.toString()}
                        icon={ChefHat}
                        gradientClass="gradient-students"
                        subtitle="En cocina"
                    />
                    <ModernKpiCard
                        title="Listos"
                        value={readyOrders.toString()}
                        icon={Bell}
                        gradientClass="gradient-employees"
                        subtitle="Para servir"
                    />
                    <ModernKpiCard
                        title="Items Totales"
                        value={totalItems.toString()}
                        icon={Utensils}
                        gradientClass="gradient-finance"
                        subtitle="Productos a preparar"
                    />
                </div>
            </motion.div>

            {/* ORDERS GRID */}
            <section style={{ padding: '0 var(--spacing-lg)', minHeight: '400px' }} className="pb-8">
                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="animate-spin w-12 h-12 border-2 border-rose-600 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-slate-500">Cargando órdenes...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">👨‍🍳</div>
                        <p className="text-slate-500 text-lg">No hay órdenes pendientes</p>
                        <p className="text-slate-400 text-sm mt-2">¡Buen trabajo! Todo está al día</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '32px' }}>
                        <AnimatePresence mode="popLayout">
                            {orders.map((order, index) => {
                                const colors = orderColors[index % 6];
                                const config = statusConfig[order.status] || statusConfig.PENDING;
                                const timeSince = getTimeSince(order.createdAt);

                                return (
                                    <motion.div
                                        key={order.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        layout
                                        style={{
                                            backgroundColor: colors.bg,
                                            borderRadius: '20px',
                                            padding: '0',
                                            minHeight: '280px',
                                            boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                                            display: 'flex',
                                            flexDirection: 'column' as const,
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {/* HEADER DE LA ORDEN */}
                                        <div style={{
                                            padding: '20px 24px',
                                            backgroundColor: colors.accent,
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <Utensils size={20} />
                                                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                                    {order.table?.name || "Para llevar"}
                                                </span>
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '14px',
                                                opacity: 0.9
                                            }}>
                                                <Timer size={16} />
                                                {timeSince}
                                            </div>
                                        </div>

                                        {/* BODY */}
                                        <div style={{ padding: '24px', flex: 1 }}>
                                            {/* STATUS BADGE */}
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '6px 14px',
                                                backgroundColor: 'rgba(255,255,255,0.8)',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                color: config.color,
                                                marginBottom: '16px'
                                            }}>
                                                {config.label}
                                            </span>

                                            {/* ITEMS LIST */}
                                            <div style={{ marginBottom: '20px' }}>
                                                {order.items.map((item) => (
                                                    <div key={item.id} style={{
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        gap: '12px',
                                                        marginBottom: '12px',
                                                        paddingBottom: '12px',
                                                        borderBottom: '1px solid rgba(0,0,0,0.08)'
                                                    }}>
                                                        <div style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '8px',
                                                            backgroundColor: colors.accent,
                                                            color: 'white',
                                                            fontSize: '14px',
                                                            fontWeight: 'bold',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexShrink: 0
                                                        }}>
                                                            {item.quantity}x
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '15px' }}>
                                                                {item.product.name}
                                                            </div>
                                                            {item.notes && (
                                                                <div style={{
                                                                    fontSize: '12px',
                                                                    color: '#DC2626',
                                                                    fontStyle: 'italic',
                                                                    marginTop: '4px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px'
                                                                }}>
                                                                    <AlertCircle size={12} />
                                                                    {item.notes}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* FOOTER - ACTION BUTTON */}
                                        <div style={{ padding: '0 24px 24px' }}>
                                            <button
                                                onClick={() => updateStatus(order.id, config.nextStatus)}
                                                style={{
                                                    width: '100%',
                                                    padding: '14px 20px',
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    backgroundColor: config.nextStatus === 'PREPARING' ? '#2563EB' :
                                                        config.nextStatus === 'READY' ? '#059669' : '#7C3AED',
                                                    color: 'white',
                                                    fontSize: '14px',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                                }}
                                            >
                                                {config.nextStatus === 'READY' && <CheckCircle size={18} />}
                                                {config.nextLabel}
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </section>
        </div>
    );
}
