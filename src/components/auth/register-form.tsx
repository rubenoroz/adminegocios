"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

export function RegisterForm() {
    const router = useRouter();
    const [data, setData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        businessName: "",
        businessType: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const registerUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validate passwords match
        if (data.password !== data.confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        // Validate password length
        if (data.password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                router.push("/login");
            } else {
                const errorData = await response.json();
                setError(errorData.message || "Error creating account");
            }
        } catch (error) {
            console.error(error);
            setError("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-[400px]">
            <CardHeader>
                <CardTitle>Crear cuenta</CardTitle>
                <CardDescription>Empieza a administrar tu negocio hoy.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={registerUser} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="name">Nombre Completo</label>
                        <Input
                            id="name"
                            required
                            value={data.name}
                            onChange={(e) => setData({ ...data, name: e.target.value })}
                        />
                    </div>
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
                            minLength={6}
                            value={data.password}
                            onChange={(e) => setData({ ...data, password: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            required
                            minLength={6}
                            value={data.confirmPassword}
                            onChange={(e) => setData({ ...data, confirmPassword: e.target.value })}
                        />
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="businessName">Nombre del Negocio</label>
                        <Input
                            id="businessName"
                            required
                            value={data.businessName}
                            onChange={(e) => setData({ ...data, businessName: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="businessType">Tipo de Negocio</label>
                        <Select
                            value={data.businessType}
                            onValueChange={(value) => setData({ ...data, businessType: value })}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="RETAIL">Tienda Minorista</SelectItem>
                                <SelectItem value="RESTAURANT">Restaurante</SelectItem>
                                <SelectItem value="SCHOOL">Escuela</SelectItem>
                                <SelectItem value="SERVICE">Servicios</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Creando..." : "Registrarse"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <p className="text-sm text-muted-foreground">
                    ¿Ya tienes cuenta? <Link href="/login" className="text-primary hover:underline">Inicia sesión</Link>
                </p>
            </CardFooter>
        </Card>
    );
}
