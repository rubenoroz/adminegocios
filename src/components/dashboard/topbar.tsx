"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Menu, X } from "lucide-react";
// import { LanguageSelector } from "@/components/language-selector"; // Deshabilitado - sitio solo español
import { BranchSelector } from "@/components/branch-selector";
import { Sidebar } from "@/components/dashboard/sidebar";
import { motion, AnimatePresence } from "framer-motion";

interface TopbarProps {
    dict: any;
    serverBusinessType?: string;
    serverRole?: string;
    serverLogoUrl?: string | null;
    serverLogoOrientation?: "HORIZONTAL" | "VERTICAL" | "SQUARE";
    serverLogoHeight?: number;
    sidebarColor?: string;
}

export function Topbar({
    dict,
    serverBusinessType = "",
    serverRole = "",
    serverLogoUrl = null,
    serverLogoOrientation = "SQUARE",
    serverLogoHeight = 64,
    sidebarColor = "#1e293b"
}: TopbarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    // Close menu automatically on route change (navigation)
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    // Lock body scroll when mobile menu is open (MOBILE ONLY)
    useEffect(() => {
        // SSR safety check - only run in browser
        if (typeof window === 'undefined') return;

        if (mobileMenuOpen) {
            // Save current scroll position and lock body
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.top = `-${window.scrollY}px`;
        } else {
            // Restore scroll position
            const scrollY = document.body.style.top;
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.top = '';
            if (scrollY) {
                window.scrollTo(0, parseInt(scrollY || '0') * -1);
            }
        }

        return () => {
            if (typeof window === 'undefined') return;
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.top = '';
        };
    }, [mobileMenuOpen]);

    return (
        <>
            <div className="topbar">
                {/* Left side - Mobile menu button + Search */}
                <div className="flex items-center gap-4">
                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50 shadow-sm"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <Menu size={22} strokeWidth={1.5} />
                    </button>

                    <div className="topbar-search relative hidden sm:block">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar..."
                            className="pl-8 bg-muted/50 w-[200px] lg:w-[300px]"
                        />
                    </div>
                </div>

                {/* Right side - Branch Selector */}
                <div className="flex items-center gap-3">
                    <BranchSelector />
                    {/* LanguageSelector deshabilitado - sitio solo español */}
                </div>
            </div>

            {/* Mobile Sidebar Overlay with Animation */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <div className="fixed inset-0 z-50 md:hidden isolate">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setMobileMenuOpen(false)}
                        />

                        {/* Sidebar Drawer */}
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: "0%" }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed inset-y-0 left-0 flex flex-col shadow-2xl z-50 bg-slate-900 border-r border-white/10"
                            style={{
                                backgroundColor: sidebarColor,
                                width: '72vw',
                                maxWidth: '280px'
                            }}
                        >
                            {/* Close button - styled like dialog-close-button */}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('Close button clicked');
                                    setMobileMenuOpen(false);
                                }}
                                aria-label="Cerrar menú"
                                style={{
                                    position: 'absolute',
                                    left: '20px',
                                    top: '20px',
                                    width: '32px',
                                    height: '32px',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: '2px solid white',
                                    borderRadius: '9999px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 10000,
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                                    cursor: 'pointer',
                                    padding: 0,
                                }}
                            >
                                <X size={16} strokeWidth={3} />
                            </button>

                            {/* Sidebar content - forced scroll with dvh */}
                            <div
                                style={{
                                    height: 'calc(100dvh - 60px)',
                                    maxHeight: 'calc(100vh - 60px)',
                                    marginTop: '60px',
                                    overflowY: 'scroll',
                                    overflowX: 'hidden',
                                    WebkitOverflowScrolling: 'touch',
                                }}
                            >
                                <Sidebar
                                    dict={dict}
                                    serverBusinessType={serverBusinessType}
                                    serverRole={serverRole}
                                    serverLogoUrl={serverLogoUrl}
                                    serverLogoOrientation={serverLogoOrientation}
                                    serverLogoHeight={serverLogoHeight}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
