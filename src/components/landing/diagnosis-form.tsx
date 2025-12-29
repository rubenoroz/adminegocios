"use client";

import Link from "next/link";

export function DiagnosisForm({ dict }: { dict: any }) {
    return (
        <section id="diagnostico" style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '96px 40px'
        }}>
            {/* Banda grande con degradado */}
            <div style={{
                background: 'linear-gradient(to right, #2563eb, #4f46e5)',
                borderRadius: '24px',
                padding: '64px',
                textAlign: 'center',
                boxShadow: '0 25px 50px -12px rgba(37, 99, 235, 0.25)'
            }}>
                {/* Título grande */}
                <h2 style={{
                    fontSize: '36px',
                    fontWeight: 800,
                    color: 'white',
                    margin: 0
                }}>
                    Descubre qué necesita tu negocio
                </h2>

                {/* Texto explicativo */}
                <p style={{
                    marginTop: '24px',
                    fontSize: '18px',
                    color: 'rgba(255,255,255,0.9)',
                    maxWidth: '640px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    lineHeight: 1.6
                }}>
                    Responde unas preguntas y obtén un diagnóstico personalizado de procesos, módulos y áreas de mejora.
                </p>

                {/* Botón blanco */}
                <Link href="/register">
                    <button style={{
                        marginTop: '40px',
                        padding: '16px 40px',
                        borderRadius: '8px',
                        backgroundColor: 'white',
                        color: '#1d4ed8',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 600,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                        Iniciar diagnóstico
                    </button>
                </Link>
            </div>
        </section>
    );
}
