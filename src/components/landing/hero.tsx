"use client";

import Link from "next/link";

export function Hero({ dict }: { dict: any }) {
    return (
        <section style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '96px 40px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '64px',
            alignItems: 'center'
        }}>
            {/* Izquierda - Texto */}
            <div>
                <h1 style={{
                    fontSize: '48px',
                    fontWeight: 800,
                    lineHeight: 1.1,
                    color: '#0f172a',
                    margin: 0
                }}>
                    Administra tu negocio
                    <br />
                    <span style={{ color: '#2563eb' }}>sin complicaciones</span>
                </h1>

                <p style={{
                    marginTop: '24px',
                    fontSize: '18px',
                    lineHeight: 1.6,
                    color: '#475569',
                    maxWidth: '480px'
                }}>
                    Admnegocios centraliza la gestión de <strong style={{ color: '#0f172a' }}>escuelas, academias, tiendas y restaurantes</strong> en una sola plataforma clara y poderosa.
                </p>

                {/* Botones en fila */}
                <div style={{ marginTop: '40px', display: 'flex', gap: '16px' }}>
                    <Link href="#diagnostico">
                        <button style={{
                            padding: '16px 32px',
                            borderRadius: '8px',
                            backgroundColor: '#059669',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 500,
                            boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.3)'
                        }}>
                            Hacer diagnóstico gratuito
                        </button>
                    </Link>
                    <button style={{
                        padding: '16px 24px',
                        borderRadius: '8px',
                        backgroundColor: 'transparent',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}>
                        Ver cómo funciona
                    </button>
                </div>
            </div>

            {/* Derecha - Card visual */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '24px',
                padding: '24px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)'
            }}>
                <div style={{
                    height: '256px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8',
                    fontSize: '16px'
                }}>
                    Preview del Dashboard
                </div>
            </div>
        </section>
    );
}
