"use client";

import { GraduationCap, Store, Utensils, LayoutDashboard } from "lucide-react";

export function Features({ dict }: { dict: any }) {
    const items = [
        { icon: GraduationCap, title: "Escuelas", description: "Control académico y administrativo.", bgColor: 'rgba(37, 99, 235, 0.15)', iconColor: '#3b82f6' },
        { icon: Store, title: "Tiendas", description: "Ventas, personal y reportes.", bgColor: 'rgba(16, 185, 129, 0.15)', iconColor: '#10b981' },
        { icon: Utensils, title: "Restaurantes", description: "Turnos, mesas y operación diaria.", bgColor: 'rgba(234, 88, 12, 0.15)', iconColor: '#f97316' },
        { icon: LayoutDashboard, title: "Administración", description: "Visión global y control total.", bgColor: 'rgba(147, 51, 234, 0.15)', iconColor: '#a855f7' }
    ];

    return (
        <section style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '80px 40px'
        }}>
            {/* Título */}
            <h2 style={{
                fontSize: '30px',
                fontWeight: 700,
                color: '#f1f5f9',
                marginBottom: '40px'
            }}>
                ¿Para quién es?
            </h2>

            {/* Grid de 4 tarjetas */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '24px'
            }}>
                {items.map((item, index) => (
                    <div key={index} style={{
                        backgroundColor: '#131c17',
                        borderRadius: '16px',
                        padding: '24px',
                        border: '1px solid #1e3329',
                        transition: 'all 0.3s ease'
                    }}>
                        {/* Ícono */}
                        <div style={{
                            width: '48px',
                            height: '48px',
                            backgroundColor: item.bgColor,
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '16px'
                        }}>
                            <item.icon style={{ width: '24px', height: '24px', color: item.iconColor }} />
                        </div>

                        {/* Título */}
                        <h3 style={{
                            fontSize: '18px',
                            fontWeight: 600,
                            color: '#f1f5f9',
                            marginBottom: '8px'
                        }}>
                            {item.title}
                        </h3>

                        {/* Descripción */}
                        <p style={{
                            fontSize: '14px',
                            color: '#94a3b8',
                            lineHeight: 1.5,
                            margin: 0
                        }}>
                            {item.description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
