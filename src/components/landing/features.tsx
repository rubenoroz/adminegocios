"use client";

import { GraduationCap, Store, Utensils, LayoutDashboard } from "lucide-react";

export function Features({ dict }: { dict: any }) {
    const items = [
        { icon: GraduationCap, title: "Escuelas", description: "Control académico y administrativo.", bgColor: '#dbeafe', iconColor: '#2563eb' },
        { icon: Store, title: "Tiendas", description: "Ventas, personal y reportes.", bgColor: '#d1fae5', iconColor: '#059669' },
        { icon: Utensils, title: "Restaurantes", description: "Turnos, mesas y operación diaria.", bgColor: '#fed7aa', iconColor: '#ea580c' },
        { icon: LayoutDashboard, title: "Administración", description: "Visión global y control total.", bgColor: '#e9d5ff', iconColor: '#9333ea' }
    ];

    return (
        <section style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '80px 40px'
        }}>
            {/* Título alineado a la izquierda */}
            <h2 style={{
                fontSize: '30px',
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: '40px'
            }}>
                ¿Para quién es?
            </h2>

            {/* Grid de 4 tarjetas iguales */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '24px'
            }}>
                {items.map((item, index) => (
                    <div key={index} style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        {/* Ícono cuadrado */}
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
                            color: '#0f172a',
                            marginBottom: '8px'
                        }}>
                            {item.title}
                        </h3>

                        {/* Descripción */}
                        <p style={{
                            fontSize: '14px',
                            color: '#64748b',
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
