"use client";

import Link from "next/link";

export function Hero({ dict }: { dict: any }) {
    return (
        <section className="hero-section" style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '96px 40px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '64px',
            alignItems: 'center'
        }}>
            {/* Izquierda - Texto */}
            <div className="hero-text">
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

                <p className="border mt-8 max-w-2xl mx-auto text-xl text-slate-400">
                    Admnegocios centraliza la gestión de escuelas, tiendas, consultorios, contructoras, restaurantes y otros servicios en una sola plataforma clara y poderosa con visión global y control total.
                </p>

                {/* Botones en fila */}
                <div className="hero-buttons" style={{ marginTop: '40px' }}>
                    <Link href="/register">
                        <button style={{
                            padding: '16px 32px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '18px',
                            fontWeight: 600,
                            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
                            transition: 'transform 0.2s',
                        }}>
                            Crea tu cuenta gratis
                        </button>
                    </Link>
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
