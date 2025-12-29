"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    LogOut,
    User,
    GraduationCap,
    Calendar,
    CreditCard,
    Menu,
    X
} from "lucide-react";

export default function ParentPortalLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [parent, setParent] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const parentData = localStorage.getItem("parentData");
        if (!parentData) {
            router.push("/es/parent/login");
            return;
        }
        setParent(JSON.parse(parentData));
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("parentToken");
        localStorage.removeItem("parentData");
        router.push("/es/parent/login");
    };

    if (!parent) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
                ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            `}>
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-gray-100">
                        <h1 className="text-xl font-bold text-blue-600">Portal de Padres</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Hola, {parent.firstName}
                        </p>
                    </div>

                    <nav className="flex-1 p-4 space-y-1">
                        <Link href="/es/parent/dashboard">
                            <Button variant="ghost" className="w-full justify-start">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Resumen
                            </Button>
                        </Link>
                        {/* We will add dynamic links for each student later or keep it centralized */}
                    </nav>

                    <div className="p-4 border-t border-gray-100">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={handleLogout}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Cerrar Sesión
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                    <h1 className="font-semibold text-gray-900">Portal de Padres</h1>
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
