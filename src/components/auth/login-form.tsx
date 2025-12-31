"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function LoginForm() {
    const router = useRouter();
    const [data, setData] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const loginUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const callback = await signIn("credentials", {
                ...data,
                redirect: false,
            });

            if (callback?.error) {
                setError("Credenciales inválidas");
            }

            if (callback?.ok && !callback?.error) {
                router.push("/dashboard");
            }
        } catch (error) {
            console.error(error);
            setError("Error al iniciar sesión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px',
            background: 'linear-gradient(to bottom right, #f8fafc, #ffffff, #f1f5f9)'
        }}>
            {/* Card centrada, ancho fijo máx 420px */}
            <div style={{
                width: '100%',
                maxWidth: '420px',
                backgroundColor: 'white',
                borderRadius: '24px',
                padding: '40px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)'
            }}>
                {/* Logo - link al inicio */}
                <Link href="/" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '24px',
                    textDecoration: 'none'
                }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: '#2563eb',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>A</span>
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Admnegocios</span>
                </Link>

                <h3 style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#0f172a',
                    marginBottom: '24px'
                }}>
                    Iniciar sesión
                </h3>

                <form onSubmit={loginUser}>
                    {/* Inputs uno debajo del otro */}
                    <input
                        type="email"
                        placeholder="Correo electrónico"
                        required
                        value={data.email}
                        onChange={(e) => setData({ ...data, email: e.target.value })}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            fontSize: '16px',
                            marginBottom: '16px',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        required
                        value={data.password}
                        onChange={(e) => setData({ ...data, password: e.target.value })}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            fontSize: '16px',
                            marginBottom: '24px',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />

                    {error && (
                        <div style={{
                            padding: '12px',
                            borderRadius: '12px',
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#dc2626',
                            fontSize: '14px',
                            marginBottom: '16px'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Botón primario azul ancho completo */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '16px',
                            fontWeight: 600,
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? "Entrando..." : "Entrar"}
                    </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
                    <Link href="/es/forgot-password" style={{ color: '#2563eb' }}>
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>

                <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
                    ¿No tienes cuenta?{" "}
                    <Link href="/register" style={{ color: '#2563eb', fontWeight: 600 }}>
                        Regístrate
                    </Link>
                </div>
            </div>
        </div>
    );
}
