"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError("Token inválido");
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password })
            });

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => {
                    router.push("/es/login");
                }, 2000);
            } else {
                const data = await response.text();
                setError(data || "Error al restablecer la contraseña");
            }
        } catch (error) {
            setError("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Card className="w-[400px]">
                <CardHeader>
                    <CardTitle>✅ Contraseña Restablecida</CardTitle>
                    <CardDescription>
                        Tu contraseña ha sido actualizada exitosamente.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Redirigiendo al inicio de sesión...
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-[400px]">
            <CardHeader>
                <CardTitle>Nueva Contraseña</CardTitle>
                <CardDescription>
                    Ingresa tu nueva contraseña
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="password">Nueva Contraseña</label>
                        <Input
                            id="password"
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            required
                            minLength={6}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading || !token}>
                        {loading ? "Guardando..." : "Restablecer Contraseña"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <Link href="/es/login" className="text-sm text-muted-foreground hover:text-primary">
                    Volver al inicio de sesión
                </Link>
            </CardFooter>
        </Card>
    );
}
