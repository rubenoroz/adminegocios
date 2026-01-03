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
                    color: '#f1f5f9',
                    margin: 0
                }}>
                    Administra tu negocio
                    <br />
                    <span style={{ color: '#10b981' }}>sin complicaciones</span>
                </h1>

                <p style={{
                    marginTop: '24px',
                    fontSize: '18px',
                    lineHeight: 1.6,
                    color: '#94a3b8',
                    maxWidth: '480px'
                }}>
                    Admnegocios centraliza la gestión de <strong style={{ color: '#f1f5f9' }}>escuelas, academias, tiendas y restaurantes</strong> en una sola plataforma clara y poderosa.
                </p>

                {/* Botones en fila */}
                <div style={{ marginTop: '40px', display: 'flex', gap: '16px' }}>
                    <Link href="#diagnostico">
                        <button style={{
                            padding: '16px 32px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 500,
                            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)'
                        }}>
                            Hacer diagnóstico gratuito
                        </button>
                    </Link>
                    <button style={{
                        padding: '16px 24px',
                        borderRadius: '8px',
                        backgroundColor: 'transparent',
                        color: '#94a3b8',
                        border: '1px solid #1e3329',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}>
                        Ver cómo funciona
                    </button>
                </div>
            </div>

            {/* Derecha - Card visual con preview del dashboard */}
            <div style={{
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }}>
                <img
                    src="/dashboard-preview.png"
                    alt="Dashboard ADMNegocios"
                    style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block'
                    }}
                />
            </div>
        </section>
    );
}
