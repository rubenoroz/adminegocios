"use client";

import Link from "next/link";
import Image from "next/image";

export function Navbar({ dict }: { dict: any }) {
    return (
        <header style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '40px 40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'transparent',
            position: 'relative'
        }}>
            {/* Logo Horizontal - posicionado absolutamente */}
            <Link href="/" style={{
                display: 'flex',
                alignItems: 'center',
                position: 'absolute',
                left: '-100px',
                top: '0'
            }}>
                <Image
                    src="/logo-horizontal.svg"
                    alt="ADMNegocios"
                    width={440}
                    height={120}
                    priority
                />
            </Link>
            {/* Placeholder para mantener el espacio */}
            <div style={{ width: '440px', height: '120px' }}></div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Link href="#diagnostico">
                    <button style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        backgroundColor: 'transparent',
                        color: '#94a3b8',
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
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
                    }}>
                        Iniciar sesión
                    </button>
                </Link>
            </div>
        </header>
    );
}
