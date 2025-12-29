"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/db";

export function useSync() {
    const [isOnline, setIsOnline] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingSales, setPendingSales] = useState(0);

    useEffect(() => {
        // Initial check
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            syncData();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Check pending sales count
        updatePendingCount();

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    const updatePendingCount = async () => {
        const count = await db.sales.where("syncStatus").equals("pending").count();
        setPendingSales(count);
    };

    const syncData = async () => {
        if (!navigator.onLine) return;
        setIsSyncing(true);

        try {
            // 1. Sync Sales
            const salesToSync = await db.sales.where("syncStatus").equals("pending").toArray();

            for (const sale of salesToSync) {
                try {
                    const res = await fetch("/api/sales", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            items: sale.items,
                            total: sale.total,
                            paymentMethod: "CASH" // Default
                        })
                    });

                    if (res.ok) {
                        await db.sales.delete(sale.id!);
                    }
                } catch (error) {
                    console.error("Failed to sync sale", sale.id, error);
                }
            }

            // 2. Sync Products (Download latest)
            const res = await fetch("/api/products");
            if (res.ok) {
                const products = await res.json();
                await db.products.clear();
                await db.products.bulkPut(products.map((p: { id: string, name: string, price: number, sku?: string, category?: string }) => ({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    sku: p.sku,
                    category: p.category,
                    syncStatus: 'synced'
                })));
            }

            await updatePendingCount();
        } catch (error) {
            console.error("Sync failed", error);
        } finally {
            setIsSyncing(false);
        }
    };

    const saveSaleOffline = async (saleData: { items: any[], total: number }) => {
        await db.sales.add({
            items: saleData.items,
            total: saleData.total,
            createdAt: new Date(),
            syncStatus: 'pending'
        });
        await updatePendingCount();
    };

    return { isOnline, isSyncing, pendingSales, syncData, saveSaleOffline };
}
