"use client";

import Link from "next/link";

export function Navbar({ dict }: { dict: any }) {
    return (
        <header style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '24px 40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'transparent'
        }}>
            {/* Logo */}
            <div style={{
                fontSize: '24px',
                fontWeight: 900,
                letterSpacing: '-0.025em',
                color: '#0f172a'
            }}>
                Adminegocios
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Link href="#diagnostico">
                    <button style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        backgroundColor: 'transparent',
                        color: '#475569',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}>
                        Diagnóstico
                    </button>
                </Link>
                <Link href="/login">
                    <button style={{
                        padding: '8px 20px',
                        borderRadius: '8px',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                        Iniciar sesión
                    </button>
                </Link>
            </div>
        </header>
    );
}
