"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

        if (data.password !== data.confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

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

    const inputStyle = {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        fontSize: '16px',
        outline: 'none',
        boxSizing: 'border-box' as const
    };

    const labelStyle = {
        display: 'block',
        fontSize: '14px',
        fontWeight: 500,
        color: '#0f172a',
        marginBottom: '8px'
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
                    marginBottom: '8px'
                }}>
                    Crear cuenta
                </h3>
                <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    marginBottom: '24px'
                }}>
                    Empieza a administrar tu negocio hoy.
                </p>

                <form onSubmit={registerUser}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Nombre Completo</label>
                        <input
                            type="text"
                            required
                            value={data.name}
                            onChange={(e) => setData({ ...data, name: e.target.value })}
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Email</label>
                        <input
                            type="email"
                            required
                            value={data.email}
                            onChange={(e) => setData({ ...data, email: e.target.value })}
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Contraseña</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={data.password}
                            onChange={(e) => setData({ ...data, password: e.target.value })}
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Confirmar Contraseña</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={data.confirmPassword}
                            onChange={(e) => setData({ ...data, confirmPassword: e.target.value })}
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Nombre del Negocio</label>
                        <input
                            type="text"
                            required
                            value={data.businessName}
                            onChange={(e) => setData({ ...data, businessName: e.target.value })}
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={labelStyle}>Tipo de Negocio</label>
                        <select
                            required
                            value={data.businessType}
                            onChange={(e) => setData({ ...data, businessType: e.target.value })}
                            style={{
                                ...inputStyle,
                                color: data.businessType ? '#0f172a' : '#94a3b8',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="" disabled>Selecciona un tipo</option>
                            <option value="RETAIL">Tienda Minorista</option>
                            <option value="RESTAURANT">Restaurante</option>
                            <option value="SCHOOL">Escuela</option>
                            <option value="SERVICE">Servicios</option>
                        </select>
                    </div>

                    {error && (
                        <div style={{
                            padding: '12px',
                            borderRadius: '8px',
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#dc2626',
                            fontSize: '14px',
                            marginBottom: '16px'
                        }}>
                            {error}
                        </div>
                    )}

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
                        {loading ? "Creando..." : "Registrarse"}
                    </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
                    ¿Ya tienes cuenta?{" "}
                    <Link href="/login" style={{ color: '#2563eb', fontWeight: 600 }}>
                        Inicia sesión
                    </Link>
                </div>
            </div>
        </div>
    );
}
