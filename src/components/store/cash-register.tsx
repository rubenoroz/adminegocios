"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calculator, DollarSign, ArrowUp, ArrowDown, Clock, Plus, Minus, CheckCircle, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useBranch } from "@/context/branch-context";
import { useToast } from "@/components/ui/use-toast";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";

export function CashRegister() {
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [cashStatus, setCashStatus] = useState<"closed" | "open">("closed");
    const [openingAmount, setOpeningAmount] = useState(0);
    const [currentBalance, setCurrentBalance] = useState(0);
    const [movements, setMovements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openCashOpen, setOpenCashOpen] = useState(false);
    const [closeCashOpen, setCloseCashOpen] = useState(false);
    const [movementOpen, setMovementOpen] = useState(false);
    const [newOpeningAmount, setNewOpeningAmount] = useState("");
    const [newMovement, setNewMovement] = useState({ type: "in", amount: "", reason: "" });
    const [countedCash, setCountedCash] = useState("");

    useEffect(() => {
        fetchCashStatus();
    }, [selectedBranch]);

    const fetchCashStatus = async () => {
        setLoading(true);
        try {
            await new Promise(r => setTimeout(r, 500));
            setCashStatus("open");
            setOpeningAmount(2000);
            setCurrentBalance(3450);
            setMovements([
                { id: "1", type: "sale", amount: 450, reason: "Venta V001", time: "10:30" },
                { id: "2", type: "sale", amount: 180, reason: "Venta V002", time: "11:15" },
                { id: "3", type: "out", amount: -150, reason: "Pago proveedor", time: "12:00" },
                { id: "4", type: "sale", amount: 75, reason: "Venta V004", time: "13:45" },
                { id: "5", type: "in", amount: 500, reason: "Depósito", time: "14:00" },
                { id: "6", type: "sale", amount: 340, reason: "Venta V005", time: "14:20" },
            ]);
        } catch (error) {
            console.error("Error fetching cash status:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCash = () => {
        const amount = parseFloat(newOpeningAmount) || 0;
        setCashStatus("open");
        setOpeningAmount(amount);
        setCurrentBalance(amount);
        setMovements([]);
        setOpenCashOpen(false);
        setNewOpeningAmount("");
        toast({ title: `Caja abierta con $${amount.toLocaleString()}` });
    };

    const handleCloseCash = () => {
        const counted = parseFloat(countedCash) || 0;
        const diff = counted - currentBalance;
        setCloseCashOpen(false);
        setCashStatus("closed");
        toast({
            title: diff === 0 ? "Caja cerrada correctamente" : diff > 0 ? `Sobrante: $${diff.toLocaleString()}` : `Faltante: $${Math.abs(diff).toLocaleString()}`,
            variant: diff === 0 ? "default" : "destructive"
        });
    };

    const handleAddMovement = () => {
        const amount = parseFloat(newMovement.amount) || 0;
        if (amount <= 0) return;
        const actualAmount = newMovement.type === "in" ? amount : -amount;
        const newMov = {
            id: Date.now().toString(),
            type: newMovement.type,
            amount: actualAmount,
            reason: newMovement.reason || (newMovement.type === "in" ? "Entrada de efectivo" : "Salida de efectivo"),
            time: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
        };
        setMovements(prev => [...prev, newMov]);
        setCurrentBalance(prev => prev + actualAmount);
        setMovementOpen(false);
        setNewMovement({ type: "in", amount: "", reason: "" });
        toast({ title: newMovement.type === "in" ? `Entrada: +$${amount}` : `Salida: -$${amount}` });
    };

    const salesTotal = movements.filter(m => m.type === "sale").reduce((sum, m) => sum + m.amount, 0);
    const entriesTotal = movements.filter(m => m.type === "in").reduce((sum, m) => sum + m.amount, 0);
    const exitsTotal = movements.filter(m => m.type === "out").reduce((sum, m) => sum + Math.abs(m.amount), 0);

    return (
        <div className="bg-slate-100 pb-16">
            {/* Header */}
            <div style={{ padding: "var(--spacing-lg)", marginBottom: "32px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">Caja Registradora</h1>
                        <p className="text-muted-foreground text-lg">Gestión de efectivo y corte de caja</p>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                        {cashStatus === "closed" ? (
                            <Dialog open={openCashOpen} onOpenChange={setOpenCashOpen}>
                                <DialogTrigger asChild>
                                    <button className="button-modern gradient-green" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <CheckCircle size={18} /> Abrir Caja
                                    </button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Abrir Caja</DialogTitle>
                                        <DialogDescription>Ingresa el monto inicial de la caja</DialogDescription>
                                    </DialogHeader>
                                    <div style={{ padding: "16px 0" }}>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Monto Inicial</label>
                                        <input type="number" value={newOpeningAmount} onChange={(e) => setNewOpeningAmount(e.target.value)} className="modern-input" placeholder="0.00" style={{ fontSize: "24px", textAlign: "center" }} />
                                    </div>
                                    <DialogFooter>
                                        <button onClick={() => setOpenCashOpen(false)} className="filter-chip">Cancelar</button>
                                        <button onClick={handleOpenCash} className="button-modern gradient-green">Abrir Caja</button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        ) : (
                            <>
                                <Dialog open={movementOpen} onOpenChange={setMovementOpen}>
                                    <DialogTrigger asChild>
                                        <button className="button-modern gradient-blue" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <Plus size={18} /> Movimiento
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Nuevo Movimiento</DialogTitle>
                                            <DialogDescription>Registra entrada o salida de efectivo</DialogDescription>
                                        </DialogHeader>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px 0" }}>
                                            <div style={{ display: "flex", gap: "12px" }}>
                                                <button onClick={() => setNewMovement({ ...newMovement, type: "in" })} className={newMovement.type === "in" ? "button-modern gradient-green" : "filter-chip"} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                                    <ArrowUp size={18} /> Entrada
                                                </button>
                                                <button onClick={() => setNewMovement({ ...newMovement, type: "out" })} className={newMovement.type === "out" ? "button-modern gradient-red" : "filter-chip"} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                                    <ArrowDown size={18} /> Salida
                                                </button>
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Monto</label>
                                                <input type="number" value={newMovement.amount} onChange={(e) => setNewMovement({ ...newMovement, amount: e.target.value })} className="modern-input" placeholder="0.00" />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Razón</label>
                                                <input type="text" value={newMovement.reason} onChange={(e) => setNewMovement({ ...newMovement, reason: e.target.value })} className="modern-input" placeholder="Descripción del movimiento" />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <button onClick={() => setMovementOpen(false)} className="filter-chip">Cancelar</button>
                                            <button onClick={handleAddMovement} className="button-modern gradient-blue">Registrar</button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                                <Dialog open={closeCashOpen} onOpenChange={setCloseCashOpen}>
                                    <DialogTrigger asChild>
                                        <button className="filter-chip" style={{ display: "flex", alignItems: "center", gap: "8px", borderColor: "#ef4444", color: "#ef4444" }}>
                                            <AlertCircle size={18} /> Cerrar Caja
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Corte de Caja</DialogTitle>
                                            <DialogDescription>Cuenta el efectivo y cierra la caja</DialogDescription>
                                        </DialogHeader>
                                        <div style={{ padding: "16px 0" }}>
                                            <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "12px", marginBottom: "16px" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><span>Fondo inicial:</span><span>${openingAmount.toLocaleString()}</span></div>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><span>Ventas en efectivo:</span><span style={{ color: "#059669" }}>+${salesTotal.toLocaleString()}</span></div>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><span>Entradas:</span><span style={{ color: "#059669" }}>+${entriesTotal.toLocaleString()}</span></div>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><span>Salidas:</span><span style={{ color: "#ef4444" }}>-${exitsTotal.toLocaleString()}</span></div>
                                                <div style={{ borderTop: "2px solid #e2e8f0", paddingTop: "8px", marginTop: "8px", display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "18px" }}><span>Esperado:</span><span>${currentBalance.toLocaleString()}</span></div>
                                            </div>
                                            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Efectivo Contado</label>
                                            <input type="number" value={countedCash} onChange={(e) => setCountedCash(e.target.value)} className="modern-input" placeholder="0.00" style={{ fontSize: "24px", textAlign: "center" }} />
                                            {countedCash && (
                                                <div style={{ marginTop: "12px", padding: "12px", borderRadius: "8px", textAlign: "center", backgroundColor: parseFloat(countedCash) === currentBalance ? "#D1FAE5" : "#FEE2E2", color: parseFloat(countedCash) === currentBalance ? "#059669" : "#DC2626" }}>
                                                    {parseFloat(countedCash) === currentBalance ? "✓ Cuadra" : parseFloat(countedCash) > currentBalance ? `Sobrante: $${(parseFloat(countedCash) - currentBalance).toLocaleString()}` : `Faltante: $${(currentBalance - parseFloat(countedCash)).toLocaleString()}`}
                                                </div>
                                            )}
                                        </div>
                                        <DialogFooter>
                                            <button onClick={() => setCloseCashOpen(false)} className="filter-chip">Cancelar</button>
                                            <button onClick={handleCloseCash} className="button-modern" style={{ backgroundColor: "#ef4444", color: "white" }}>Cerrar Caja</button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center mx-8">
                    <div className="animate-spin w-12 h-12 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-slate-500">Cargando estado de caja...</p>
                </div>
            ) : cashStatus === "closed" ? (
                <div style={{ padding: "0 var(--spacing-lg)" }}>
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">🔒</div>
                        <p className="text-slate-500 text-lg mb-4">La caja está cerrada</p>
                        <p className="text-slate-400">Abre la caja para comenzar a registrar ventas</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* KPIs */}
                    <motion.div style={{ padding: "0 var(--spacing-lg)", marginBottom: "32px" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <ModernKpiCard title="Balance Actual" value={`$${currentBalance.toLocaleString()}`} icon={Calculator} gradientClass="gradient-green" subtitle="En caja" />
                            <ModernKpiCard title="Fondo Inicial" value={`$${openingAmount.toLocaleString()}`} icon={DollarSign} gradientClass="gradient-blue" subtitle="Apertura" />
                            <ModernKpiCard title="Ventas Efectivo" value={`$${salesTotal.toLocaleString()}`} icon={ArrowUp} gradientClass="gradient-purple" subtitle="Del turno" />
                            <ModernKpiCard title="Movimientos" value={movements.length.toString()} icon={Clock} gradientClass="gradient-orange" subtitle="Registrados" />
                        </div>
                    </motion.div>

                    {/* Movements List */}
                    <section style={{ padding: "0 var(--spacing-lg)" }} className="pb-8">
                        <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "16px", color: "#1e293b" }}>Movimientos del Turno</h2>
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                            {movements.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">No hay movimientos aún</div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    {movements.map((mov, index) => (
                                        <div key={mov.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: index < movements.length - 1 ? "1px solid #e2e8f0" : "none", backgroundColor: index % 2 === 0 ? "#fff" : "#f8fafc" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                <div style={{ width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: mov.type === "sale" ? "#D1FAE5" : mov.type === "in" ? "#DBEAFE" : "#FEE2E2", color: mov.type === "sale" ? "#059669" : mov.type === "in" ? "#2563EB" : "#DC2626" }}>
                                                    {mov.type === "sale" ? <DollarSign size={18} /> : mov.type === "in" ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 500, color: "#1e293b" }}>{mov.reason}</div>
                                                    <div style={{ fontSize: "12px", color: "#94a3b8" }}>{mov.time}</div>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: "18px", fontWeight: 700, color: mov.amount >= 0 ? "#059669" : "#DC2626" }}>
                                                {mov.amount >= 0 ? "+" : ""}{mov.amount.toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
