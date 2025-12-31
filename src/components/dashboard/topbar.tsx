"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Menu, X } from "lucide-react";
// import { LanguageSelector } from "@/components/language-selector"; // Deshabilitado - sitio solo español
import { BranchSelector } from "@/components/branch-selector";
import { Sidebar } from "@/components/dashboard/sidebar";

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

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50"
                        onClick={() => setMobileMenuOpen(false)}
                    />

                    {/* Sidebar */}
                    <div
                        className="fixed inset-y-0 left-0 w-72 flex flex-col"
                        style={{ backgroundColor: sidebarColor }}
                    >
                        {/* Close button */}
                        <button
                            className="absolute top-4 right-4 p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 z-10"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <X size={24} />
                        </button>

                        {/* Sidebar content */}
                        <Sidebar
                            dict={dict}
                            serverBusinessType={serverBusinessType}
                            serverRole={serverRole}
                            serverLogoUrl={serverLogoUrl}
                            serverLogoOrientation={serverLogoOrientation}
                            serverLogoHeight={serverLogoHeight}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
