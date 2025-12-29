import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardNotFound() {
    return (
        <div className="flex h-full flex-col items-center justify-center space-y-4">
            <h2 className="text-xl font-bold">Página no encontrada</h2>
            <p className="text-muted-foreground">La sección que buscas no existe o ha sido movida.</p>
            <Link href="/dashboard">
                <Button variant="outline">Volver al Inicio</Button>
            </Link>
        </div>
    );
}
