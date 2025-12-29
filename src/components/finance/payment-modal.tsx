"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranch } from "@/context/branch-context";
import { useToast } from "@/components/ui/use-toast";
import { DollarSign } from "lucide-react";

interface PaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fee: any; // The fee object to pay
    onSuccess: () => void;
}

export function PaymentModal({ open, onOpenChange, fee, onSuccess }: PaymentModalProps) {
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("CASH");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && fee) {
            // Default amount to remaining balance
            const paid = fee.payments?.reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0;
            const remaining = Math.max(0, fee.amount - paid);
            setAmount(remaining.toString());
        }
    }, [open, fee]);

    const handlePayment = async () => {
        if (!amount || !fee || !selectedBranch?.businessId) return;

        setLoading(true);
        try {
            const res = await fetch("/api/finance/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    feeId: fee.id,
                    amount,
                    method,
                    businessId: selectedBranch.businessId
                })
            });

            if (!res.ok) throw new Error("Failed to register payment");

            toast({
                title: "Pago registrado",
                description: `Se ha registrado el pago de $${amount} exitosamente.`
            });
            onSuccess();
        } catch (error) {
            console.error(error);
            toast({
                title: "Error al registrar pago",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    if (!fee) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrar Pago</DialogTitle>
                    <DialogDescription>
                        Abono a: <span className="font-semibold text-slate-800">{fee.title}</span> de {fee.student.firstName}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Monto a Pagar</label>
                        <div className="relative">
                            <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                type="number"
                                className="pl-8 text-lg font-semibold"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <p className="text-xs text-slate-500">Total original: ${fee.amount.toFixed(2)}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Método de Pago</label>
                        <Select value={method} onValueChange={setMethod}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CASH">Efectivo</SelectItem>
                                <SelectItem value="CARD">Tarjeta de Crédito/Débito</SelectItem>
                                <SelectItem value="TRANSFER">Transferencia / Depósito</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handlePayment} disabled={!amount || loading || parseFloat(amount) <= 0}>
                        Confirmar Pago
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
