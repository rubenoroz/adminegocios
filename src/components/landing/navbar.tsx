"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar({ dict, lang }: { dict: any; lang: string }) {
    // Sanitize lang to ensure we don't duplicate paths if lang is polluted
    const safeLang = lang?.split('/')[0] || 'es';
    const loginPath = `/${safeLang}/login`;

    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="landing-navbar" style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '40px 40px',
            // On desktop we want flex. On mobile we might want block to handle absolute overlay. 
            // We'll keep default flex for desktop stability.
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'transparent',
            position: 'relative',
            zIndex: 50
        }}>
            {/* ================= DESKTOP ELEMENTS (Hidden on Mobile via CSS) ================= */}

            {/* Logo Horizontal */}
            <Link href={`/${lang}`} className="navbar-logo" style={{
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

            {/* Placeholder */}
            <div className="navbar-placeholder" style={{ width: '440px', height: '120px' }}></div>

            {/* Desktop Actions */}
            <div className="navbar-actions" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>

                <Link href={loginPath}>
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

            {/* ================= MOBILE TOGGLE (Visible ONLY on Mobile via Tailwind/CSS) ================= */}
            <div className="mobile-header-controls" style={{ display: 'none', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Mobile Logo */}
                <Link href={`/${lang}`} style={{ display: 'flex', alignItems: 'center' }}>
                    <Image
                        src="/logo-horizontal.svg"
                        alt="ADMNegocios"
                        width={200}
                        height={60}
                        priority
                        style={{ height: '40px', width: 'auto' }}
                    />
                </Link>

                {/* Hamburger Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px',
                        color: '#f1f5f9',
                        cursor: 'pointer'
                    }}
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* ================= MOBILE OVERLAY ================= */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'absolute',
                            top: '80px',
                            left: '20px',
                            right: '20px',
                            backgroundColor: '#131c17',
                            borderRadius: '16px',
                            border: '1px solid #1e3329',
                            padding: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                            zIndex: 100
                        }}
                    >
                        <Link href={loginPath} onClick={() => setIsOpen(false)} style={{ width: '100%' }}>
                            <button style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 600,
                                textAlign: 'center',
                                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
                            }}>
                                Iniciar sesión
                            </button>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
