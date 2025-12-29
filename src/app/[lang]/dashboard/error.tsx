"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex h-full flex-col items-center justify-center space-y-4">
            <h2 className="text-xl font-bold">Algo salió mal</h2>
            <p className="text-muted-foreground">{error.message || "Ha ocurrido un error inesperado."}</p>
            <Button onClick={() => reset()}>Intentar de nuevo</Button>
        </div>
    );
}
