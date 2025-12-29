"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function ParentLoginForm() {
    const router = useRouter();
    const [data, setData] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/parents/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();

                // Store token
                localStorage.setItem("parentToken", result.token);
                localStorage.setItem("parentData", JSON.stringify(result.parent));

                // Check if must change password
                if (result.parent.mustChangePassword) {
                    router.push("/es/parent/change-password");
                } else {
                    router.push("/es/parent/dashboard");
                }
            } else {
                setError("Credenciales inválidas");
            }
        } catch (error) {
            setError("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-[400px]">
            <CardHeader>
                <CardTitle>Portal de Padres</CardTitle>
                <CardDescription>Accede para ver la información de tus hijos</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="email">Email</label>
                        <Input
                            id="email"
                            type="email"
                            required
                            value={data.email}
                            onChange={(e) => setData({ ...data, email: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="password">Contraseña</label>
                        <Input
                            id="password"
                            type="password"
                            required
                            value={data.password}
                            onChange={(e) => setData({ ...data, password: e.target.value })}
                        />
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Entrando..." : "Iniciar Sesión"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <p className="text-sm text-muted-foreground">
                    ¿Problemas para acceder? Contacta a la escuela
                </p>
            </CardFooter>
        </Card>
    );
}
