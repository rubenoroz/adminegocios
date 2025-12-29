"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, Users, Calendar, Check, Clock, TrendingUp, Search } from "lucide-react";
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

export default function CommissionsPage() {
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

        // Filter by commission range
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
                            Comisiones
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Gestiona los pagos de comisiones a maestros
                        </p>
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
            <div style={{ padding: '0 var(--spacing-lg)', marginBottom: '32px' }}>
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
                    <div className="flex flex-wrap items-center gap-3 p-4 mt-3 bg-slate-50 rounded-xl border border-slate-200">
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
            </div>

            {/* TEACHERS GRID */}
            <section style={{ padding: '0 var(--spacing-lg)', minHeight: '400px' }} className="pb-8">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
            </section>

            {/* SETTLEMENT HISTORY */}
            {settlements.length > 0 && (
                <section style={{ padding: '0 var(--spacing-lg)' }}>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Historial de Liquidaciones</h2>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" style={{ minHeight: '200px' }}>
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
                </section>
            )}

            {/* DETAIL MODAL */}
            <Dialog open={!!selectedTeacher} onOpenChange={(open) => !open && setSelectedTeacher(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Comisiones de {selectedTeacher?.teacher.firstName} {selectedTeacher?.teacher.lastName}
                        </DialogTitle>
                        <DialogDescription>
                            Selecciona los pagos a liquidar
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTeacher && (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                                    <p className="text-xs text-emerald-600">Comisión</p>
                                    <p className="text-lg font-bold text-emerald-700">
                                        ${selectedTeacher.totalCommission.toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-amber-50 rounded-xl p-3 text-center">
                                    <p className="text-xs text-amber-600">Reserva</p>
                                    <p className="text-lg font-bold text-amber-700">
                                        ${selectedTeacher.totalReserve.toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-purple-50 rounded-xl p-3 text-center">
                                    <p className="text-xs text-purple-600">Escuela</p>
                                    <p className="text-lg font-bold text-purple-700">
                                        ${selectedTeacher.totalSchool.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Payments list */}
                            <div className="border rounded-xl overflow-hidden">
                                <div className="bg-slate-50 p-2 text-sm font-medium text-slate-600 flex">
                                    <div className="w-8"></div>
                                    <div className="flex-1">Alumno / Concepto</div>
                                    <div className="w-24 text-right">Monto</div>
                                    <div className="w-24 text-right">Comisión</div>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    {selectedTeacher.payments.map((payment, idx) => (
                                        <label
                                            key={payment.id}
                                            className="flex items-center p-2 hover:bg-blue-50 cursor-pointer border-t"
                                            style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}
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
                                                className="w-4 h-4 mr-2"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{payment.studentName}</p>
                                                <p className="text-xs text-slate-500">{payment.concept} • {new Date(payment.date).toLocaleDateString('es-MX')}</p>
                                            </div>
                                            <div className="w-24 text-right text-sm">${payment.amount.toLocaleString()}</div>
                                            <div className="w-24 text-right text-sm font-medium text-emerald-600">
                                                ${payment.teacherCommission.toLocaleString()}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Settlement form */}
                            <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                                <p className="font-medium text-blue-800">Liquidar Comisiones</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-600">Método de pago</label>
                                        <Select value={settleMethod} onValueChange={setSettleMethod}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="TRANSFER">Transferencia</SelectItem>
                                                <SelectItem value="CASH">Efectivo</SelectItem>
                                                <SelectItem value="CHECK">Cheque</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-600">Nota (opcional)</label>
                                        <Input
                                            value={settleNote}
                                            onChange={(e) => setSettleNote(e.target.value)}
                                            placeholder="Ej: Pago quincenal"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                                    <div>
                                        <p className="text-sm text-slate-600">{selectedPayments.length} pagos seleccionados</p>
                                        <p className="text-xl font-bold text-blue-800">
                                            Total: ${selectedTeacher.payments
                                                .filter(p => selectedPayments.includes(p.id))
                                                .reduce((sum, p) => sum + p.teacherCommission, 0)
                                                .toLocaleString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleSettle}
                                        disabled={selectedPayments.length === 0}
                                        className="button-modern bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 flex items-center gap-2 disabled:opacity-50"
                                        style={{ borderRadius: '8px' }}
                                    >
                                        <Check size={16} />
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
