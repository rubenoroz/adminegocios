"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function ForgotPasswordForm() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [resetUrl, setResetUrl] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setResetUrl("");

        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            setMessage(data.message);

            // For development only - remove in production
            if (data.resetUrl) {
                setResetUrl(data.resetUrl);
            }
        } catch (error) {
            setMessage("Error al enviar el correo");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-[400px]">
            <CardHeader>
                <CardTitle>Recuperar Contraseña</CardTitle>
                <CardDescription>
                    Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="email">Correo Electrónico</label>
                        <Input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                        />
                    </div>

                    {message && (
                        <div className="p-3 text-sm bg-blue-50 border border-blue-200 rounded-md text-blue-800">
                            {message}
                        </div>
                    )}

                    {resetUrl && (
                        <div className="p-3 text-sm bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="font-semibold mb-2">🔧 Modo Desarrollo:</p>
                            <a href={resetUrl} className="text-blue-600 hover:underline break-all">
                                {resetUrl}
                            </a>
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Enviando..." : "Enviar Enlace"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <Link href="/es/login" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" />
                    Volver al inicio de sesión
                </Link>
            </CardFooter>
        </Card>
    );
}
