"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, TrendingDown, Plus, CreditCard, Wallet, Receipt } from "lucide-react";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";

export function AccountingDashboard() {
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [newExpense, setNewExpense] = useState({
        description: "",
        amount: "",
        category: "OTHER"
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch("/api/accounting/summary");
            const data = await res.json();
            if (data.error) {
                console.error(data.error);
                return;
            }
            setSummary(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async () => {
        try {
            const res = await fetch("/api/accounting/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newExpense)
            });
            if (res.ok) {
                setOpen(false);
                setNewExpense({ description: "", amount: "", category: "OTHER" });
                fetchData();
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-slate-500 text-lg">Cargando datos contables...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-8">
                <ModernKpiCard
                    title="Ingresos Totales"
                    value={`$${summary?.totalIncome?.toLocaleString() || '0'}`}
                    icon={TrendingUp}
                    gradientClass="gradient-finance"
                    subtitle="Entradas registradas"
                />
                <ModernKpiCard
                    title="Gastos Totales"
                    value={`$${summary?.totalExpenses?.toLocaleString() || '0'}`}
                    icon={TrendingDown}
                    gradientClass="gradient-students" // Esto usa el gradiente rojo/rosa definido en CSS global o similar
                    subtitle="Salidas registradas"
                />
                <ModernKpiCard
                    title="Ganancia Neta"
                    value={`$${summary?.netProfit?.toLocaleString() || '0'}`}
                    icon={DollarSign}
                    gradientClass="gradient-courses" // Azul/Emerald
                    subtitle="Balance final"
                />
            </div>

            {/* Transactions Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Transacciones Recientes</h3>
                        <p className="text-sm text-slate-500">Historial de movimientos financieros</p>
                    </div>
                    <div className="w-fit ml-auto">
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <button className="button-modern bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 flex items-center gap-2" style={{ borderRadius: '8px' }}>
                                    <Plus className="h-4 w-4" /> Registrar Gasto
                                </button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Registrar Nuevo Gasto</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Descripción</label>
                                        <Input
                                            placeholder="Ej: Pago de luz"
                                            value={newExpense.description}
                                            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Monto</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input
                                                type="number"
                                                className="pl-8"
                                                placeholder="0.00"
                                                value={newExpense.amount}
                                                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Categoría</label>
                                        <Select value={newExpense.category} onValueChange={(v) => setNewExpense({ ...newExpense, category: v })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="RENT">Renta</SelectItem>
                                                <SelectItem value="UTILITIES">Servicios (Luz/Agua)</SelectItem>
                                                <SelectItem value="SUPPLIES">Insumos</SelectItem>
                                                <SelectItem value="SALARY">Nómina</SelectItem>
                                                <SelectItem value="OTHER">Otros</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter className="gap-4">
                                    <button
                                        onClick={() => setOpen(false)}
                                        className="font-semibold text-white hover:opacity-90 transition-all"
                                        style={{
                                            borderRadius: '6px',
                                            backgroundColor: '#DC2626',
                                            padding: '12px 24px',
                                            fontSize: '15px',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleAddExpense}
                                        className="font-semibold text-white hover:opacity-90 transition-all"
                                        style={{
                                            borderRadius: '6px',
                                            backgroundColor: '#2563EB',
                                            padding: '12px 24px',
                                            fontSize: '15px',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Guardar Gasto
                                    </button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {summary?.transactions.map((t: any, index: number) => (
                                    <tr
                                        key={t.id}
                                        className="hover:bg-blue-50/50 transition-colors"
                                        style={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {new Date(t.date).toLocaleDateString('es-MX')}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-800">
                                            {t.description}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${t.type === 'INCOME'
                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                : 'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                {t.type === 'INCOME' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                {t.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {t.type === 'INCOME' ? '+' : '-'}${t.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                                {(!summary?.transactions || summary.transactions.length === 0) && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                            No hay transacciones registradas recientemente
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

