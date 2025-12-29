"use client";

import { POSInterface } from "@/components/sales/pos-interface";
import { CartProvider } from "@/context/cart-context";

export default function SalesPage() {
    return (
        <CartProvider>
            <div className="bg-slate-100 pb-16 min-h-screen">
                {/* HEADER */}
                <div style={{
                    padding: 'var(--spacing-lg)',
                    marginBottom: '32px',
                    position: 'relative',
                    zIndex: 10
                }}>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
                            Punto de Venta
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Realiza ventas rápidas y gestiona tu inventario en tiempo real
                        </p>
                    </div>
                </div>

                {/* POS INTERFACE */}
                <div style={{ padding: '0 var(--spacing-lg)' }}>
                    <POSInterface />
                </div>
            </div>
        </CartProvider>
    );
}
