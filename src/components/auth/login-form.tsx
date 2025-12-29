"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function LoginForm() {
    const router = useRouter();
    const [data, setData] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);

    const loginUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const callback = await signIn("credentials", {
                ...data,
                redirect: false,
            });

            if (callback?.error) {
                alert("Invalid credentials");
            }

            if (callback?.ok && !callback?.error) {
                router.push("/dashboard");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-[350px]">
            <CardHeader>
                <CardTitle>Iniciar Sesión</CardTitle>
                <CardDescription>Bienvenido de nuevo.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={loginUser} className="space-y-4">
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
                        <div className="flex items-center justify-between">
                            <label htmlFor="password">Contraseña</label>
                            <Link href="/es/forgot-password" className="text-xs text-primary hover:underline">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            required
                            value={data.password}
                            onChange={(e) => setData({ ...data, password: e.target.value })}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Entrando..." : "Iniciar Sesión"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">
                    ¿No tienes cuenta? <Link href="/register" className="text-primary hover:underline">Regístrate</Link>
                </p>
            </CardFooter>
        </Card>
    );
}
