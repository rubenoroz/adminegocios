"use client";

import { useSync } from "@/hooks/use-sync";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function OfflineIndicator() {
    const { isOnline, isSyncing, pendingSales, syncData } = useSync();

    if (isOnline && pendingSales === 0 && !isSyncing) {
        return null;
    }

    return (
        <div className={cn(
            "fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 transition-all",
            isOnline ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
        )}>
            {isOnline ? (
                <Wifi className="w-5 h-5" />
            ) : (
                <WifiOff className="w-5 h-5" />
            )}

            <div className="flex flex-col">
                <span className="font-bold text-sm">
                    {isOnline ? "Conectado" : "Modo Offline"}
                </span>
                {pendingSales > 0 && (
                    <span className="text-xs">
                        {pendingSales} ventas pendientes de sincronizar
                    </span>
                )}
            </div>

            {isOnline && pendingSales > 0 && (
                <Button
                    size="sm"
                    variant="outline"
                    className="ml-2 h-8 bg-white/50 hover:bg-white/80 border-0"
                    onClick={syncData}
                    disabled={isSyncing}
                >
                    <RefreshCw className={cn("w-4 h-4 mr-2", isSyncing && "animate-spin")} />
                    {isSyncing ? "Sincronizando..." : "Sincronizar"}
                </Button>
            )}
        </div>
    );
}
