"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ amount, onSuccess, onCancel }: { amount: number, onSuccess: () => void, onCancel: () => void }) {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/es/parent/dashboard?payment_success=true`,
            },
            redirect: "if_required"
        });

        if (error) {
            setMessage(error.message ?? "Ocurrió un error inesperado.");
        } else {
            onSuccess();
        }

        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            {message && <div className="text-red-500 text-sm">{message}</div>}
            <div className="flex gap-2 justify-end mt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={isLoading || !stripe || !elements}>
                    {isLoading ? "Procesando..." : `Pagar $${amount.toFixed(2)}`}
                </Button>
            </div>
        </form>
    );
}

export function PaymentModal({
    isOpen,
    onClose,
    feeId,
    amount,
    title
}: {
    isOpen: boolean;
    onClose: () => void;
    feeId: string;
    amount: number;
    title: string;
}) {
    const [clientSecret, setClientSecret] = useState("");

    useEffect(() => {
        if (isOpen && feeId) {
            // Create PaymentIntent as soon as the modal opens
            fetch("/api/parents/payments/create-intent", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("parentToken")}`
                },
                body: JSON.stringify({ feeId, amount }),
            })
                .then((res) => res.json())
                .then((data) => setClientSecret(data.clientSecret));
        }
    }, [isOpen, feeId, amount]);

    const handleSuccess = () => {
        alert("¡Pago realizado con éxito!");
        onClose();
        window.location.reload(); // Refresh to update status
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Realizar Pago</DialogTitle>
                    <CardDescription>
                        {title} - ${amount.toFixed(2)}
                    </CardDescription>
                </DialogHeader>

                {clientSecret ? (
                    <Elements options={{ clientSecret, appearance: { theme: 'stripe' } }} stripe={stripePromise}>
                        <CheckoutForm
                            amount={amount}
                            onSuccess={handleSuccess}
                            onCancel={onClose}
                        />
                    </Elements>
                ) : (
                    <div className="flex justify-center py-8">
                        Cargando pasarela de pago...
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
