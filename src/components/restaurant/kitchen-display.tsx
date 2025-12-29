"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, ChefHat } from "lucide-react";

export function KitchenDisplay() {
    const [orders, setOrders] = useState<any[]>([]);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchOrders = async () => {
        const res = await fetch("/api/restaurant/orders?status=PENDING"); // Or PREPARING
        const data = await res.json();
        if (Array.isArray(data)) {
            setOrders(data.filter((o: any) => o.status !== 'COMPLETED' && o.status !== 'SERVED'));
        } else {
            console.error(data);
        }
    };

    const updateStatus = async (orderId: string, status: string) => {
        await fetch("/api/restaurant/orders", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, status })
        });
        fetchOrders();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center">
                    <ChefHat className="mr-2 h-6 w-6" /> Cocina (KDS)
                </h2>
                <div className="text-sm text-muted-foreground">
                    Actualización automática cada 10s
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {orders.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No hay órdenes pendientes
                    </div>
                ) : (
                    orders.map(order => (
                        <Card key={order.id} className="border-2 border-yellow-400">
                            <CardHeader className="bg-yellow-50 pb-2">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-lg">Mesa {order.table?.name || "Barra"}</CardTitle>
                                    <div className="flex items-center text-xs text-muted-foreground">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <ul className="space-y-2 mb-4">
                                    {order.items.map((item: any) => (
                                        <li key={item.id} className="text-sm border-b pb-1 last:border-0">
                                            <div className="font-bold">
                                                {item.quantity}x {item.product.name}
                                            </div>
                                            {item.notes && (
                                                <div className="text-xs text-red-500 italic">
                                                    Nota: {item.notes}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                                <div className="space-y-2">
                                    {order.status === 'PENDING' && (
                                        <Button className="w-full" onClick={() => updateStatus(order.id, 'PREPARING')}>
                                            Empezar a Preparar
                                        </Button>
                                    )}
                                    {order.status === 'PREPARING' && (
                                        <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => updateStatus(order.id, 'READY')}>
                                            <CheckCircle className="w-4 h-4 mr-2" /> Listo para Servir
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
