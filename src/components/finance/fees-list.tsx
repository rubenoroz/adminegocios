"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, MoreHorizontal, DollarSign, CheckCircle2, Clock, AlertCircle, Plus, X, ChevronDown } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useBranch } from "@/context/branch-context";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { PaymentModal } from "./payment-modal";
import { AssignFeeModal } from "./assign-fee-modal";

export function FeesList() {
    const { selectedBranch } = useBranch();
    const [fees, setFees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal state
    const [selectedFee, setSelectedFee] = useState<any>(null);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [activeFilters, setActiveFilters] = useState<string[]>([]);

    const fetchFees = async () => {
        try {
            const res = await fetch(`/api/finance/fees`);
            if (res.ok) {
                const data = await res.json();
                setFees(data);
            }
        } catch (error) {
            console.error("Error fetching fees:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFees();
    }, []); // In a real app we might filter by branch if the API supported it, but fees are usually student-centric

    const handleOpenPayment = (fee: any) => {
        setSelectedFee(fee);
        setIsPaymentOpen(true);
    };

    const handlePaymentSuccess = () => {
        setIsPaymentOpen(false);
        fetchFees(); // Refresh list to update status
    };

    const handleAssignSuccess = () => {
        fetchFees();
    };

    // Derived state for filtering
    const filteredFees = fees.filter(fee => {
        const studentName = `${fee.student.firstName} ${fee.student.lastName}`.toLowerCase();
        const matchesSearch = studentName.includes(searchTerm.toLowerCase()) || fee.title.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = activeFilters.length === 0 || activeFilters.includes(fee.status);

        return matchesSearch && matchesFilter;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PAID":
                return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none shadow-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Pagado</Badge>;
            case "PARTIAL":
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none shadow-none"><Clock className="w-3 h-3 mr-1" /> Parcial</Badge>;
            case "OVERDUE":
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none shadow-none"><AlertCircle className="w-3 h-3 mr-1" /> Vencido</Badge>;
            default:
                return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none shadow-none">Pendiente</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 flex-1">
                    <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <Input
                        placeholder="Buscar por alumno o concepto..."
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
                    <Filter className="h-4 w-4" />
                    Filtros
                    {activeFilters.length > 0 && (
                        <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{activeFilters.length}</span>
                    )}
                    <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
                <button onClick={() => setIsAssignOpen(true)} className="button-modern bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 flex items-center gap-2 shrink-0" style={{ borderRadius: '8px' }}>
                    <Plus className="h-4 w-4" /> Nuevo Cobro
                </button>
            </div>

            {/* Filter Chips */}
            {showFilters && (
                <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-sm font-semibold text-slate-500">Filtrar por estado:</span>
                    {[
                        { value: 'PENDING', label: 'Pendiente', bgActive: '#F1F5F9', colorActive: '#475569', borderActive: '#CBD5E1' },
                        { value: 'PAID', label: 'Pagado', bgActive: '#D1FAE5', colorActive: '#047857', borderActive: '#6EE7B7' },
                        { value: 'PARTIAL', label: 'Parcial', bgActive: '#DBEAFE', colorActive: '#1D4ED8', borderActive: '#93C5FD' },
                        { value: 'OVERDUE', label: 'Vencido', bgActive: '#FEE2E2', colorActive: '#DC2626', borderActive: '#FCA5A5' }
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
                                {isActive && <X size={14} />}
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
                            <X size={14} /> Limpiar
                        </button>
                    )}
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" style={{ minHeight: '400px' }}>
                <Table>
                    <TableHeader>
                        <TableRow style={{ backgroundColor: '#F8FAFC' }}>
                            <TableHead className="py-4 font-bold text-slate-700">Alumno</TableHead>
                            <TableHead className="font-bold text-slate-700">Concepto</TableHead>
                            <TableHead className="font-bold text-slate-700">Fecha Límite</TableHead>
                            <TableHead className="font-bold text-slate-700">Monto</TableHead>
                            <TableHead className="font-bold text-slate-700">Pagado</TableHead>
                            <TableHead className="font-bold text-slate-700">Estado</TableHead>
                            <TableHead className="text-center font-bold text-slate-700">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredFees.map((fee, index) => {
                            const paidAmount = fee.payments.reduce((acc: number, curr: any) => acc + curr.amount, 0);
                            const initials = `${fee.student.firstName?.[0] || ''}${fee.student.lastName?.[0] || ''}`.toUpperCase();

                            return (
                                <TableRow
                                    key={fee.id}
                                    style={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}
                                    className="hover:bg-blue-50/50 transition-colors"
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-4">
                                            <div
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '10px',
                                                    background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 'bold',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                {initials}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-900">
                                                    {fee.student.firstName} {fee.student.lastName}
                                                </div>
                                                <div className="text-xs text-slate-500">{fee.student.matricula}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-700 font-medium">{fee.title}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Clock className="w-4 h-4 text-slate-400" />
                                            {format(new Date(fee.dueDate), "dd MMM yyyy", { locale: es })}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-slate-800">
                                        ${fee.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        ${paidAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(fee.status)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {fee.status !== 'PAID' ? (
                                            <button
                                                onClick={() => handleOpenPayment(fee)}
                                                className="button-modern bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 flex items-center gap-2 mx-auto"
                                                style={{ borderRadius: '8px', padding: '8px 16px', fontSize: '13px' }}
                                            >
                                                <DollarSign className="w-4 h-4" />
                                                Registrar Pago
                                            </button>
                                        ) : (
                                            <span className="text-emerald-600 font-semibold flex items-center gap-1 justify-center">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Completado
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {filteredFees.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                                    No se encontraron registros.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <PaymentModal
                open={isPaymentOpen}
                onOpenChange={setIsPaymentOpen}
                fee={selectedFee}
                onSuccess={handlePaymentSuccess}
            />

            <AssignFeeModal
                open={isAssignOpen}
                onOpenChange={setIsAssignOpen}
                onSuccess={handleAssignSuccess}
            />
        </div>
    );
}
