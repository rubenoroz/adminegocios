"use client";

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Banknote, Users, CheckCircle, ArrowRight, Coins, Wallet } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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

interface PaymentModalProps {
    order: Order;
    tableName: string;
    onClose: () => void;
    onPaymentComplete: () => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
};

export function PaymentModal({ order, tableName, onClose, onPaymentComplete }: PaymentModalProps) {
    const { toast } = useToast();
    const [amount, setAmount] = useState<string>(order.remainingAmount.toString());
    const [method, setMethod] = useState<'CASH' | 'CARD' | 'TRANSFER'>('CARD');
    const [selectedGuest, setSelectedGuest] = useState<string>('Todos');
    const [splitCount, setSplitCount] = useState<number>(2);
    const [paymentMode, setPaymentMode] = useState<'TOTAL' | 'GUEST' | 'SPLIT' | 'CUSTOM'>('TOTAL');
    const [tipAmount, setTipAmount] = useState<number>(0);
    const [tipPercentage, setTipPercentage] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(order);

    // Actualizar cuando cambia la orden
    useEffect(() => {
        setCurrentOrder(order);
        if (paymentMode === 'TOTAL') {
            setAmount(order.remainingAmount.toString());
        }
    }, [order, paymentMode]);

    // Agrupar items por comensal
    const itemsByGuest = useMemo(() => {
        const grouped: Record<string, typeof order.items> = {};
        currentOrder.items.forEach(item => {
            const guest = item.guestName || 'Sin Asignar';
            if (!grouped[guest]) grouped[guest] = [];
            grouped[guest].push(item);
        });
        return grouped;
    }, [currentOrder.items]);

    // Calcular total por comensal
    const totalByGuest = useMemo(() => {
        const totals: Record<string, number> = {};
        Object.entries(itemsByGuest).forEach(([guest, items]) => {
            totals[guest] = items.reduce((acc, item) => {
                const price = item.price ?? item.product.price;
                return acc + (price * item.quantity);
            }, 0);
        });
        return totals;
    }, [itemsByGuest]);

    // Cambiar modo de pago
    const handleModeChange = (mode: typeof paymentMode) => {
        setPaymentMode(mode);
        if (mode === 'TOTAL') {
            setAmount(currentOrder.remainingAmount.toString());
            setSelectedGuest('Todos');
        } else if (mode === 'SPLIT') {
            setAmount((currentOrder.remainingAmount / splitCount).toFixed(2));
        } else if (mode === 'GUEST') {
            const firstGuest = Object.keys(totalByGuest)[0];
            if (firstGuest) {
                setSelectedGuest(firstGuest);
                setAmount(totalByGuest[firstGuest].toString());
            }
        } else {
            setAmount('');
        }
        // Reset tip when changing mode
        setTipAmount(0);
        setTipPercentage(null);
    };

    const handleGuestChange = (guest: string) => {
        setSelectedGuest(guest);
        if (totalByGuest[guest]) {
            setAmount(totalByGuest[guest].toString());
        }
    };

    const handleSplitChange = (count: number) => {
        setSplitCount(count);
        setAmount((currentOrder.remainingAmount / count).toFixed(2));
    };

    const handleTipChange = (percentage: number | null) => {
        setTipPercentage(percentage);
        const baseAmount = parseFloat(amount) || 0;
        if (percentage) {
            setTipAmount(baseAmount * (percentage / 100));
        } else {
            setTipAmount(0);
        }
    };

    const handleCustomTipChange = (value: string) => {
        setTipPercentage(null);
        setTipAmount(parseFloat(value) || 0);
    };

    const handlePayment = async () => {
        const payAmount = parseFloat(amount);
        if (isNaN(payAmount) || payAmount <= 0 || payAmount > currentOrder.remainingAmount + 0.1) {
            toast({
                title: "Monto inválido",
                description: "El monto debe ser mayor a 0 y no exceder el saldo pendiente",
                variant: "destructive"
            });
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch('/api/restaurant/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: currentOrder.id,
                    amount: payAmount,
                    method,
                    tip: tipAmount,
                    guestName: selectedGuest !== 'Todos' ? selectedGuest : null
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error al procesar pago');
            }

            toast({
                title: "Pago registrado",
                description: `${formatCurrency(payAmount)} ${tipAmount > 0 ? `+ ${formatCurrency(tipAmount)} propina` : ''}`
            });

            if (data.isFullyPaid) {
                onPaymentComplete();
                onClose();
            } else {
                // Actualizar la orden con los nuevos datos
                setCurrentOrder(data.order);
                setAmount(data.order.remainingAmount.toString());
                setTipAmount(0);
                setTipPercentage(null);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Error al procesar el pago",
                variant: "destructive"
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const isPaid = currentOrder.remainingAmount <= 0;
    const totalToPay = (parseFloat(amount) || 0) + tipAmount;

    const modeColors = {
        bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        accent: '#667eea'
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div
                    className="p-5 flex justify-between items-center"
                    style={{ background: modeColors.bg }}
                >
                    <div className="text-white">
                        <h3 className="font-bold text-xl">Cobrar {tableName}</h3>
                        <p className="text-white/70 text-sm">Orden #{currentOrder.id.substring(0, 8)}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                        <X size={20} className="text-white" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Left: Order Summary */}
                    <div className="w-full md:w-5/12 p-6 bg-slate-50 border-r overflow-y-auto">
                        <div className="mb-6">
                            <h4 className="font-bold text-slate-700 mb-3">Resumen de Orden</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {currentOrder.items.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm bg-white p-2 rounded-lg">
                                        <span className="flex-1">
                                            <span className="font-medium">{item.quantity}x</span> {item.product.name}
                                            {item.guestName && (
                                                <span className="text-slate-400 ml-1">({item.guestName})</span>
                                            )}
                                        </span>
                                        <span className="font-medium text-slate-700">
                                            {formatCurrency((item.price ?? item.product.price) * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t space-y-2">
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>{formatCurrency(currentOrder.total)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Pagado</span>
                                    <span className="font-medium">
                                        {formatCurrency(currentOrder.total - currentOrder.remainingAmount)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Restante</span>
                                    <span className="font-bold text-red-600">
                                        {formatCurrency(currentOrder.remainingAmount)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Payment History */}
                        {currentOrder.payments && currentOrder.payments.length > 0 && (
                            <div>
                                <h4 className="font-bold text-slate-700 mb-2 text-sm uppercase">Pagos Realizados</h4>
                                <div className="space-y-2">
                                    {currentOrder.payments.map(p => (
                                        <div key={p.id} className="bg-white p-3 rounded-lg border text-xs">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <span className="font-bold text-slate-700">{p.method}</span>
                                                    {p.guestName && (
                                                        <span className="text-slate-400 ml-1">({p.guestName})</span>
                                                    )}
                                                    <div className="text-slate-400">
                                                        {new Date(p.timestamp).toLocaleTimeString()}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-bold text-green-600 block">
                                                        {formatCurrency(p.amount)}
                                                    </span>
                                                    {p.tip && p.tip > 0 && (
                                                        <span className="text-slate-500">
                                                            + {formatCurrency(p.tip)} propina
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Payment Actions */}
                    <div className="w-full md:w-7/12 p-6 flex flex-col overflow-y-auto">
                        {isPaid ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center"
                                >
                                    <CheckCircle size={48} />
                                </motion.div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-800">¡Cuenta Pagada!</h3>
                                    <p className="text-slate-500">La orden ha sido completada exitosamente.</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Payment Modes */}
                                <div className="grid grid-cols-4 gap-2 mb-6">
                                    {[
                                        { id: 'TOTAL' as const, label: 'Total', icon: Banknote },
                                        { id: 'GUEST' as const, label: 'Persona', icon: Users },
                                        { id: 'SPLIT' as const, label: 'Dividir', icon: ArrowRight },
                                        { id: 'CUSTOM' as const, label: 'Otro', icon: Wallet },
                                    ].map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => handleModeChange(m.id)}
                                            className={`p-3 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-medium transition-all ${paymentMode === m.id
                                                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            <m.icon size={18} />
                                            {m.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Dynamic Inputs */}
                                <div className="flex-1 space-y-5">
                                    {paymentMode === 'GUEST' && Object.keys(totalByGuest).length > 0 && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Seleccionar Comensal
                                            </label>
                                            <select
                                                value={selectedGuest}
                                                onChange={(e) => handleGuestChange(e.target.value)}
                                                className="w-full p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-violet-500"
                                            >
                                                {Object.keys(totalByGuest).map(g => (
                                                    <option key={g} value={g}>
                                                        {g} - {formatCurrency(totalByGuest[g])}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {paymentMode === 'SPLIT' && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Dividir entre
                                            </label>
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => handleSplitChange(Math.max(2, splitCount - 1))}
                                                    className="w-12 h-12 rounded-xl bg-slate-100 font-bold hover:bg-slate-200 transition-colors"
                                                >
                                                    -
                                                </button>
                                                <span className="text-2xl font-bold w-8 text-center">{splitCount}</span>
                                                <button
                                                    onClick={() => handleSplitChange(splitCount + 1)}
                                                    className="w-12 h-12 rounded-xl bg-slate-100 font-bold hover:bg-slate-200 transition-colors"
                                                >
                                                    +
                                                </button>
                                                <span className="text-slate-500 text-sm ml-2">personas</span>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Monto a Pagar
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="w-full p-4 pl-8 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-violet-500 text-2xl font-bold"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    {/* Tips Section */}
                                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                        <div className="flex items-center gap-2 mb-3 text-amber-800">
                                            <Coins size={18} />
                                            <span className="font-bold text-sm">Agregar Propina</span>
                                        </div>
                                        <div className="grid grid-cols-5 gap-2 mb-3">
                                            {[0, 10, 15, 20].map(pct => (
                                                <button
                                                    key={pct}
                                                    onClick={() => handleTipChange(pct === 0 ? null : pct)}
                                                    className={`py-2 rounded-lg text-xs font-bold transition-colors ${(pct === 0 && tipPercentage === null && tipAmount === 0) || tipPercentage === pct
                                                            ? 'bg-amber-500 text-white shadow-md'
                                                            : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-100'
                                                        }`}
                                                >
                                                    {pct === 0 ? 'No' : `${pct}%`}
                                                </button>
                                            ))}
                                            <input
                                                type="number"
                                                placeholder="$"
                                                value={tipPercentage === null && tipAmount > 0 ? tipAmount : ''}
                                                onChange={(e) => handleCustomTipChange(e.target.value)}
                                                className="w-full text-center rounded-lg border border-amber-200 text-xs font-bold bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                                            />
                                        </div>
                                        {tipAmount > 0 && (
                                            <div className="flex justify-between text-sm font-medium text-amber-900">
                                                <span>Monto de propina:</span>
                                                <span>{formatCurrency(tipAmount)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Método de Pago
                                        </label>
                                        <div className="flex gap-2">
                                            {[
                                                { id: 'CASH' as const, label: 'Efectivo', icon: Banknote },
                                                { id: 'CARD' as const, label: 'Tarjeta', icon: CreditCard },
                                                { id: 'TRANSFER' as const, label: 'Transferencia', icon: Wallet },
                                            ].map(m => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => setMethod(m.id)}
                                                    className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-colors flex items-center justify-center gap-2 ${method === m.id
                                                            ? 'border-violet-600 bg-violet-50 text-violet-700'
                                                            : 'border-slate-100 text-slate-500 hover:border-slate-200'
                                                        }`}
                                                >
                                                    <m.icon size={16} />
                                                    {m.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-6">
                                    <button
                                        onClick={handlePayment}
                                        disabled={isProcessing || !amount || parseFloat(amount) <= 0}
                                        className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-violet-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                                    >
                                        {isProcessing ? (
                                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <CheckCircle size={20} />
                                                <div className="flex flex-col leading-tight">
                                                    <span>Cobrar {formatCurrency(totalToPay)}</span>
                                                    {tipAmount > 0 && (
                                                        <span className="text-xs font-normal opacity-90">(Incluye propina)</span>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
