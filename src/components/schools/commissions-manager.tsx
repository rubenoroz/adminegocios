"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, Users, Check, Clock, TrendingUp, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";

interface TeacherSummary {
    teacher: {
        id: string;
        firstName: string;
        lastName: string;
        commissionPercentage: number;
    };
    totalCommission: number;
    totalReserve: number;
    totalSchool: number;
    paymentCount: number;
    payments: Payment[];
}

interface Payment {
    id: string;
    amount: number;
    teacherCommission: number;
    reserveAmount: number;
    date: string;
    studentName: string;
    concept: string;
}

interface Settlement {
    id: string;
    amount: number;
    date: string;
    method: string;
    note: string | null;
    teacherName: string;
    paymentCount: number;
}

export function CommissionsManager() {
    const [summary, setSummary] = useState<TeacherSummary[]>([]);
    const [settlements, setSettlements] = useState<Settlement[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTeacher, setSelectedTeacher] = useState<TeacherSummary | null>(null);
    const [settleMethod, setSettleMethod] = useState("TRANSFER");
    const [settleNote, setSettleNote] = useState("");
    const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [activeFilters, setActiveFilters] = useState<string[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        fetchCommissions();
    }, []);

    const fetchCommissions = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/commissions");
            if (res.ok) {
                const data = await res.json();
                setSummary(data.summary || []);
                setSettlements(data.settlements || []);
            }
        } catch (error) {
            console.error("Error fetching commissions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSettle = async () => {
        if (!selectedTeacher || selectedPayments.length === 0) return;

        try {
            const res = await fetch("/api/commissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    employeeId: selectedTeacher.teacher.id,
                    method: settleMethod,
                    note: settleNote || null,
                    paymentIds: selectedPayments
                })
            });

            if (res.ok) {
                const data = await res.json();
                toast({
                    title: "Liquidación completada",
                    description: `Se pagaron $${data.settlement.amount.toFixed(2)} por ${data.settlement.paymentCount} pagos`
                });
                setSelectedTeacher(null);
                setSelectedPayments([]);
                setSettleNote("");
                fetchCommissions();
            } else {
                toast({ title: "Error al liquidar", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error de conexión", variant: "destructive" });
        }
    };

    const totalPending = summary.reduce((sum, t) => sum + t.totalCommission, 0);
    const totalReserve = summary.reduce((sum, t) => sum + t.totalReserve, 0);

    const filteredSummary = summary.filter(item => {
        const matchesSearch = searchTerm === "" ||
            `${item.teacher.firstName} ${item.teacher.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());

        if (activeFilters.length === 0) return matchesSearch;

        let matchesFilter = false;
        if (activeFilters.includes('HIGH') && item.totalCommission >= 5000) matchesFilter = true;
        if (activeFilters.includes('MEDIUM') && item.totalCommission >= 1000 && item.totalCommission < 5000) matchesFilter = true;
        if (activeFilters.includes('LOW') && item.totalCommission < 1000) matchesFilter = true;

        return matchesSearch && matchesFilter;
    });

    const colors = [
        { bg: '#D1FAE5', accent: '#059669', iconBg: '#10B981' },
        { bg: '#DBEAFE', accent: '#2563EB', iconBg: '#3B82F6' },
        { bg: '#EDE9FE', accent: '#7C3AED', iconBg: '#8B5CF6' },
        { bg: '#FCE7F3', accent: '#DB2777', iconBg: '#EC4899' },
        { bg: '#FFEDD5', accent: '#EA580C', iconBg: '#F97316' },
        { bg: '#CCFBF1', accent: '#0D9488', iconBg: '#14B8A6' },
    ];

    return (
        <div className="space-y-6">
            {/* KPIS */}
            <motion.div
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8" style={{ padding: '4px' }}>
                    <ModernKpiCard
                        title="Comisiones Pendientes"
                        value={`$${totalPending.toLocaleString()}`}
                        icon={DollarSign}
                        gradientClass="gradient-finance"
                        subtitle="Por liquidar"
                    />
                    <ModernKpiCard
                        title="Reserva Acumulada"
                        value={`$${totalReserve.toLocaleString()}`}
                        icon={Clock}
                        gradientClass="gradient-employees"
                        subtitle="Fondo de reserva"
                    />
                    <ModernKpiCard
                        title="Maestros con Comisión"
                        value={summary.length.toString()}
                        icon={Users}
                        gradientClass="gradient-courses"
                        subtitle="Con pagos pendientes"
                    />
                    <ModernKpiCard
                        title="Liquidaciones"
                        value={settlements.length.toString()}
                        icon={TrendingUp}
                        gradientClass="gradient-students"
                        subtitle="Este mes"
                    />
                </div>
            </motion.div>

            {/* SEARCH BAR & FILTERS */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 flex-1">
                    <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <Input
                        placeholder="Buscar maestro..."
                        className="bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-blue-500 h-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 font-semibold transition-all shrink-0 ${showFilters || activeFilters.length > 0
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                        : 'bg-white text-slate-600 border-2 border-slate-200 hover:bg-slate-50'
                        }`}
                    style={{ borderRadius: '8px' }}
                >
                    <Search className="h-4 w-4" />
                    Filtros
                    {activeFilters.length > 0 && (
                        <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{activeFilters.length}</span>
                    )}
                </button>
            </div>

            {/* Filter Chips */}
            {showFilters && (
                <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-sm font-semibold text-slate-500">Filtrar por monto:</span>
                    {[
                        { value: 'HIGH', label: 'Alta ($5,000+)', bgActive: '#D1FAE5', colorActive: '#047857', borderActive: '#6EE7B7' },
                        { value: 'MEDIUM', label: 'Media ($1,000-$5,000)', bgActive: '#DBEAFE', colorActive: '#1D4ED8', borderActive: '#93C5FD' },
                        { value: 'LOW', label: 'Baja (<$1,000)', bgActive: '#FEE2E2', colorActive: '#DC2626', borderActive: '#FCA5A5' }
                    ].map(filter => {
                        const isActive = activeFilters.includes(filter.value);
                        return (
                            <button
                                key={filter.value}
                                onClick={() => {
                                    setActiveFilters(prev =>
                                        prev.includes(filter.value)
                                            ? prev.filter(f => f !== filter.value)
                                            : [...prev, filter.value]
                                    );
                                }}
                                className="flex items-center gap-1 font-semibold text-sm"
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    backgroundColor: isActive ? filter.bgActive : '#FFFFFF',
                                    color: isActive ? filter.colorActive : '#64748B',
                                    border: isActive ? `2px solid ${filter.borderActive}` : '1px solid #E2E8F0',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                {filter.label}
                            </button>
                        );
                    })}
                    {activeFilters.length > 0 && (
                        <button
                            onClick={() => setActiveFilters([])}
                            className="flex items-center gap-1 font-semibold text-sm"
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                backgroundColor: '#FEE2E2',
                                color: '#DC2626',
                                border: '1px solid #FCA5A5',
                                cursor: 'pointer'
                            }}
                        >
                            Limpiar
                        </button>
                    )}
                </div>
            )}

            {/* TEACHERS GRID */}
            {loading ? (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                    <div className="text-6xl mb-4">⏳</div>
                    <p className="text-slate-500 text-lg">Cargando comisiones...</p>
                </div>
            ) : filteredSummary.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                    <div className="text-6xl mb-4">💰</div>
                    <p className="text-slate-500 text-lg">No hay comisiones pendientes</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSummary.map((item, index) => {
                        const colorSet = colors[index % 6];
                        const initials = `${item.teacher.firstName?.[0] || ''}${item.teacher.lastName?.[0] || ''}`.toUpperCase();

                        return (
                            <div
                                key={item.teacher.id}
                                className="rounded-2xl cursor-pointer transition-all hover:scale-[1.02]"
                                style={{
                                    backgroundColor: colorSet.bg,
                                    padding: '24px',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                                }}
                                onClick={() => {
                                    setSelectedTeacher(item);
                                    setSelectedPayments(item.payments.map(p => p.id));
                                }}
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div
                                        style={{
                                            width: '56px',
                                            height: '56px',
                                            borderRadius: '14px',
                                            backgroundColor: colorSet.iconBg,
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold',
                                            fontSize: '20px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                        }}
                                    >
                                        {initials}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg" style={{ color: '#1E293B' }}>
                                            {item.teacher.firstName} {item.teacher.lastName}
                                        </h3>
                                        <p className="text-sm" style={{ color: '#64748B' }}>
                                            {item.paymentCount} pagos • {item.teacher.commissionPercentage}%
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-baseline gap-2 mb-3">
                                    <span className="text-3xl font-bold" style={{ color: colorSet.accent }}>
                                        ${item.totalCommission.toLocaleString()}
                                    </span>
                                </div>

                                {item.totalReserve > 0 && (
                                    <div
                                        className="flex items-center gap-2 text-sm font-medium"
                                        style={{
                                            backgroundColor: 'rgba(255,255,255,0.6)',
                                            padding: '10px 14px',
                                            borderRadius: '10px',
                                            color: '#EA580C'
                                        }}
                                    >
                                        <Clock className="h-4 w-4" />
                                        +${item.totalReserve.toLocaleString()} reserva
                                    </div>
                                )}

                                <button
                                    className="button-modern bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 flex items-center gap-2 w-full justify-center mt-4"
                                    style={{ borderRadius: '10px' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTeacher(item);
                                        setSelectedPayments(item.payments.map(p => p.id));
                                    }}
                                >
                                    <DollarSign className="w-4 h-4" />
                                    Liquidar
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* SETTLEMENT HISTORY */}
            {settlements.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Historial de Liquidaciones</h2>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        {settlements.map((s, index) => (
                            <div
                                key={s.id}
                                className="flex items-center justify-between p-4 transition-colors hover:bg-slate-50"
                                style={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            backgroundColor: '#D1FAE5',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <Check size={20} className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800">{s.teacherName}</p>
                                        <p className="text-sm text-slate-500">
                                            {new Date(s.date).toLocaleDateString('es-MX')} • {s.method} • {s.paymentCount} pagos
                                        </p>
                                    </div>
                                </div>
                                <p className="font-bold text-lg text-emerald-600">${s.amount.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* DETAIL MODAL */}
            <Dialog open={!!selectedTeacher} onOpenChange={(open) => !open && setSelectedTeacher(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto gap-0 border-0" style={{ borderRadius: '24px', padding: '0', gap: '0' }}>
                    {/* Modern Header with Gradient */}
                    <div style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        padding: '24px 28px',
                        borderRadius: '24px 24px 0 0',
                        color: 'white'
                    }}>
                        <div className="flex items-center gap-4">
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '16px',
                                background: 'rgba(255,255,255,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                fontWeight: 'bold'
                            }}>
                                {selectedTeacher?.teacher.firstName?.[0]}{selectedTeacher?.teacher.lastName?.[0]}
                            </div>
                            <div>
                                <DialogTitle style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
                                    {selectedTeacher?.teacher.firstName} {selectedTeacher?.teacher.lastName}
                                </DialogTitle>
                                <DialogDescription style={{ opacity: 0.9, fontSize: '14px', marginTop: '4px', color: 'white' }}>
                                    {selectedTeacher?.teacher.commissionPercentage || 0}% comisión • {selectedTeacher?.paymentCount || 0} pagos pendientes
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    {selectedTeacher && (
                        <div style={{ padding: '24px 28px' }} className="space-y-5">
                            {/* Summary Cards with Gradients */}
                            <div className="grid grid-cols-3 gap-4">
                                <div style={{
                                    background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
                                    borderRadius: '16px',
                                    padding: '16px',
                                    textAlign: 'center',
                                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.15)'
                                }}>
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '10px',
                                        background: '#10B981',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 8px',
                                        color: 'white'
                                    }}>
                                        <DollarSign size={18} />
                                    </div>
                                    <p style={{ fontSize: '11px', color: '#059669', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Comisión</p>
                                    <p style={{ fontSize: '24px', fontWeight: 700, color: '#047857' }}>
                                        ${selectedTeacher.totalCommission.toLocaleString()}
                                    </p>
                                </div>
                                <div style={{
                                    background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                                    borderRadius: '16px',
                                    padding: '16px',
                                    textAlign: 'center',
                                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.15)'
                                }}>
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '10px',
                                        background: '#F59E0B',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 8px',
                                        color: 'white'
                                    }}>
                                        <Clock size={18} />
                                    </div>
                                    <p style={{ fontSize: '11px', color: '#D97706', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reserva</p>
                                    <p style={{ fontSize: '24px', fontWeight: 700, color: '#B45309' }}>
                                        ${selectedTeacher.totalReserve.toLocaleString()}
                                    </p>
                                </div>
                                <div style={{
                                    background: 'linear-gradient(135deg, #E9D5FF 0%, #DDD6FE 100%)',
                                    borderRadius: '16px',
                                    padding: '16px',
                                    textAlign: 'center',
                                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.15)'
                                }}>
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '10px',
                                        background: '#8B5CF6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 8px',
                                        color: 'white'
                                    }}>
                                        <TrendingUp size={18} />
                                    </div>
                                    <p style={{ fontSize: '11px', color: '#7C3AED', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Escuela</p>
                                    <p style={{ fontSize: '24px', fontWeight: 700, color: '#6D28D9' }}>
                                        ${selectedTeacher.totalSchool.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Payments list - Modern Table */}
                            <div style={{
                                borderRadius: '16px',
                                overflow: 'hidden',
                                border: '1px solid #E2E8F0',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                            }}>
                                <div style={{
                                    background: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
                                    padding: '12px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#475569',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    <div style={{ width: '32px' }}></div>
                                    <div style={{ flex: 1 }}>Alumno / Concepto</div>
                                    <div style={{ width: '90px', textAlign: 'right' }}>Monto</div>
                                    <div style={{ width: '100px', textAlign: 'right' }}>Comisión</div>
                                </div>
                                <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                                    {selectedTeacher.payments.map((payment, idx) => (
                                        <label
                                            key={payment.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '14px 16px',
                                                cursor: 'pointer',
                                                backgroundColor: selectedPayments.includes(payment.id)
                                                    ? 'rgba(16, 185, 129, 0.08)'
                                                    : idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                                                borderTop: idx > 0 ? '1px solid #F1F5F9' : 'none',
                                                transition: 'all 0.15s ease'
                                            }}
                                            className="hover:bg-emerald-50"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedPayments.includes(payment.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedPayments([...selectedPayments, payment.id]);
                                                    } else {
                                                        setSelectedPayments(selectedPayments.filter(id => id !== payment.id));
                                                    }
                                                }}
                                                style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    marginRight: '12px',
                                                    accentColor: '#10B981',
                                                    cursor: 'pointer'
                                                }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>{payment.studentName}</p>
                                                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                                                    {payment.concept} • {new Date(payment.date).toLocaleDateString('es-MX')}
                                                </p>
                                            </div>
                                            <div style={{ width: '90px', textAlign: 'right', fontSize: '14px', color: '#475569' }}>
                                                ${payment.amount.toLocaleString()}
                                            </div>
                                            <div style={{
                                                width: '100px',
                                                textAlign: 'right',
                                                fontSize: '14px',
                                                fontWeight: 700,
                                                color: '#10B981'
                                            }}>
                                                ${payment.teacherCommission.toLocaleString()}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Settlement form - Modern Card */}
                            <div style={{
                                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                                borderRadius: '16px',
                                padding: '20px',
                                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.1)'
                            }}>
                                <p style={{ fontSize: '15px', fontWeight: 700, color: '#1E40AF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <DollarSign size={18} /> Liquidar Comisiones
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label style={{ fontSize: '12px', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Método de pago</label>
                                        <Select value={settleMethod} onValueChange={setSettleMethod}>
                                            <SelectTrigger
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    padding: '10px 16px',
                                                    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                                                    border: 'none',
                                                    borderRadius: '12px',
                                                    color: 'white',
                                                    fontWeight: 600,
                                                    fontSize: '14px',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                                                    height: '44px'
                                                }}
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent
                                                style={{
                                                    background: 'white',
                                                    borderRadius: '16px',
                                                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                                                    padding: '8px',
                                                    border: 'none',
                                                    minWidth: '200px',
                                                    zIndex: 10001
                                                }}
                                            >
                                                <div style={{
                                                    fontSize: '11px',
                                                    textTransform: 'uppercase',
                                                    color: '#3B82F6',
                                                    fontWeight: 700,
                                                    letterSpacing: '0.5px',
                                                    padding: '8px 12px',
                                                    marginBottom: '4px'
                                                }}>
                                                    Método de Pago
                                                </div>
                                                <SelectItem value="TRANSFER" style={{ borderRadius: '10px', padding: '10px 12px' }} className="focus:bg-blue-50 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-700">
                                                    💳 Transferencia
                                                </SelectItem>
                                                <SelectItem value="CASH" style={{ borderRadius: '10px', padding: '10px 12px' }} className="focus:bg-blue-50 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-700">
                                                    💵 Efectivo
                                                </SelectItem>
                                                <SelectItem value="CHECK" style={{ borderRadius: '10px', padding: '10px 12px' }} className="focus:bg-blue-50 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-700">
                                                    📄 Cheque
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Nota (opcional)</label>
                                        <Input
                                            value={settleNote}
                                            onChange={(e) => setSettleNote(e.target.value)}
                                            placeholder="Ej: Pago quincenal"
                                            style={{
                                                height: '44px',
                                                borderRadius: '12px',
                                                border: '2px solid #CBD5E1',
                                                fontSize: '14px',
                                                background: 'white'
                                            }}
                                            className="focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    paddingTop: '16px',
                                    marginTop: '16px',
                                    borderTop: '2px dashed rgba(59, 130, 246, 0.2)'
                                }}>
                                    <div>
                                        <p style={{ fontSize: '13px', color: '#64748B' }}>{selectedPayments.length} pagos seleccionados</p>
                                        <p style={{ fontSize: '28px', fontWeight: 800, color: '#1E40AF' }}>
                                            ${selectedTeacher.payments
                                                .filter(p => selectedPayments.includes(p.id))
                                                .reduce((sum, p) => sum + p.teacherCommission, 0)
                                                .toLocaleString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleSettle}
                                        disabled={selectedPayments.length === 0}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            padding: '14px 24px',
                                            background: selectedPayments.length === 0
                                                ? '#94A3B8'
                                                : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                            border: 'none',
                                            borderRadius: '14px',
                                            color: 'white',
                                            fontWeight: 700,
                                            fontSize: '15px',
                                            cursor: selectedPayments.length === 0 ? 'not-allowed' : 'pointer',
                                            boxShadow: selectedPayments.length === 0
                                                ? 'none'
                                                : '0 6px 20px rgba(16, 185, 129, 0.4)',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <Check size={18} />
                                        Liquidar Comisión
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
