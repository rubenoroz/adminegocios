"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Package, AlertTriangle } from "lucide-react";
import { SalesChart } from "@/components/analytics/sales-chart";

export function Dashboard({ dict }: { dict: any }) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [forbidden, setForbidden] = useState(false);
    const t = dict.dashboard.home;

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/dashboard/stats");
            if (res.status === 403) {
                setForbidden(true);
                return;
            }
            const data = await res.json();
            if (data.error) {
                console.error(data.error);
                return;
            }
            setStats(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>{t.loading}</div>;

    if (forbidden) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4 p-8 bg-slate-50 rounded-xl border border-slate-200">
                <div className="bg-slate-200 p-4 rounded-full">
                    <AlertTriangle className="h-8 w-8 text-slate-500" />
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-slate-900">Vista Restringida</h3>
                    <p className="text-sm text-slate-500 max-w-sm mt-1">
                        Las métricas financieras están disponibles solo para administradores.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <h2 className="text-3xl font-bold tracking-tight">{t.title}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t.monthlySales}</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats?.totalSales.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">{t.currentMonth}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t.totalProducts}</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalProducts}</div>
                        <p className="text-xs text-muted-foreground">{t.catalogTotal}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t.stockAlerts}</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats?.lowStockProducts.length}</div>
                        <p className="text-xs text-muted-foreground">{t.lowStock}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    <SalesChart />
                </div>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>{t.lowStockTitle}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats?.lowStockProducts.length === 0 ? (
                                <p className="text-sm text-muted-foreground">{t.allGood}</p>
                            ) : (
                                stats?.lowStockProducts.map((product: any) => (
                                    <div key={product.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">{product.name}</p>
                                            <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                                        </div>
                                        <div className="font-bold text-red-600">
                                            {product.inventory.reduce((acc: number, item: any) => acc + item.quantity, 0)} unid.
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
