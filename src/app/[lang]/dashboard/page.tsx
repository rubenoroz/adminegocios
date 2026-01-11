"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";
import Link from "next/link";
import {
    BookOpen,
    DollarSign,
    TrendingUp,
    GraduationCap,
    Calendar,
    UserPlus,
    FileText,
    AlertTriangle
} from "lucide-react";


const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [forbidden, setForbidden] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login"); // The middleware/page logic already redirects, but safe to keep
        } else if (status === "authenticated") {
            fetchStats();
        }
    }, [status, router]);

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/dashboard/stats");
            if (res.status === 403) {
                setForbidden(true);
                return;
            }
            if (!res.ok) {
                throw new Error("Error fetching dashboard stats");
            }
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error(error);
            // toast.error("Error cargando estadísticas");
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div
                className="flex items-center justify-center min-h-screen"
                style={{ backgroundColor: '#ffffff' }}
            >
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4" style={{ color: '#64748b' }}>Cargando...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    // Extraer el lang del pathname
    const lang = pathname?.split('/')[1] || 'es';

    // ACCESOS RÁPIDOS CON NAVEGACIÓN FUNCIONAL
    const quickActions = [
        { icon: UserPlus, label: "Inscribir Alumno", href: `/${lang}/dashboard/students`, gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" },
        { icon: BookOpen, label: "Crear Curso", href: `/${lang}/dashboard/courses`, gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" },
        { icon: DollarSign, label: "Nuevo Cobro", href: `/${lang}/dashboard/finance`, gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)" },
        { icon: FileText, label: "Reportes", href: `/${lang}/dashboard/reports`, gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }
    ];

    if (forbidden) {
        return (
            <div className="min-h-screen p-8 flex flex-col items-center justify-center">
                <div className="bg-orange-100 p-6 rounded-full mb-6">
                    <AlertTriangle className="h-12 w-12 text-orange-600" />
                </div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">Vista Principal Limitada</h1>
                <p className="text-slate-500 max-w-md text-center mb-8">
                    Este dashboard muestra estadísticas financieras sensibles.
                    Como no eres el propietario, puedes acceder a tus secciones específicas desde el menú lateral.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                    {quickActions.map(action => (
                        <Link key={action.label} href={action.href} className="flex flex-col items-center p-6 bg-white border rounded-xl hover:shadow-md transition-shadow">
                            <div className="p-3 rounded-full bg-slate-100 mb-3">
                                <action.icon size={24} className="text-slate-600" />
                            </div>
                            <span className="font-semibold text-slate-700">{action.label}</span>
                        </Link>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* HEADER CONTAINER INDEPENDIENTE */}
            <div style={{
                padding: 'var(--spacing-lg)',
                marginBottom: '64px',
                position: 'relative',
                zIndex: 10
            }}>
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
                    Dashboard
                </h1>
                <p className="text-muted-foreground text-lg">
                    Bienvenido de nuevo, <span className="font-semibold text-foreground">{session.user?.name}</span>
                </p>
            </div>

            {/* SECCIÓN MÉTRICAS */}
            <motion.div
                style={{ padding: '0 var(--spacing-lg)', marginBottom: '64px' }}
                initial="hidden"
                animate="show"
                variants={containerVariants}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <ModernKpiCard
                        title="Total Alumnos"
                        value={stats?.totalStudents || 0}
                        icon={GraduationCap}
                        // trend={12} // Trend calculation is complex, omitting for now to avoid fake data
                        positive={true}
                        gradientClass="gradient-students"
                        subtitle="Inscritos activos"
                        sparklineData={undefined} // Removed fake sparkline
                    />
                    <ModernKpiCard
                        title="Cursos Activos"
                        value={stats?.activeCourses || 0}
                        icon={BookOpen}
                        // trend={5.8}
                        positive={true}
                        gradientClass="gradient-courses"
                        subtitle="En este periodo"
                        sparklineData={undefined}
                    />
                    <ModernKpiCard
                        title="Ingresos del Mes"
                        value={`$${(stats?.totalSales || 0).toLocaleString()}`}
                        icon={DollarSign}
                        // trend={8.3}
                        positive={true}
                        gradientClass="gradient-finance"
                        subtitle="MXN"
                        sparklineData={undefined}
                    />
                    <ModernKpiCard
                        title="Asistencia"
                        value={`${stats?.attendanceAvg || 0}%`}
                        icon={Calendar}
                        // trend={1.2}
                        positive={stats?.attendanceAvg >= 90}
                        gradientClass="gradient-reports"
                        subtitle="Promedio semanal"
                        sparklineData={undefined}
                    />
                </div>
            </motion.div>

            {/* SECCIÓN OPERACIÓN */}
            <motion.div
                style={{
                    padding: 'var(--spacing-lg)',
                    marginTop: '64px'
                }}
                initial="hidden"
                animate="show"
                variants={containerVariants}
            >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* ACCESOS RÁPIDOS */}
                    <motion.div
                        className="kpi-card-modern"
                        style={{
                            background: 'linear-gradient(135deg, rgba(226, 232, 240, 0.4) 0%, rgba(203, 213, 225, 0.4) 100%)',
                            position: 'relative'
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -4 }}
                    >
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)',
                            pointerEvents: 'none'
                        }} />

                        <div style={{ position: 'relative', zIndex: 1, marginBottom: 'var(--spacing-lg)' }}>
                            <div className="kpi-icon-gradient" style={{
                                marginBottom: 'var(--spacing-sm)',
                                background: 'rgba(99, 102, 241, 0.15)',
                                color: '#4f46e5'
                            }}>
                                <TrendingUp size={32} />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                                Accesos Rápidos
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4" style={{ position: 'relative', zIndex: 1 }}>
                            {quickActions.map((action, index) => (
                                <Link
                                    key={action.label}
                                    href={action.href}
                                    style={{ textDecoration: 'none' }}
                                >
                                    <motion.div
                                        className="kpi-card-modern"
                                        style={{
                                            background: action.gradient,
                                            padding: 'var(--spacing-md)',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            border: 'none'
                                        }}
                                        whileHover={{ y: -4, scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        tabIndex={0}
                                        role="button"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                router.push(action.href);
                                            }
                                        }}
                                    >
                                        <div className="kpi-icon-gradient" style={{ margin: '0 auto var(--spacing-sm)' }}>
                                            <action.icon size={32} />
                                        </div>
                                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'white', display: 'block' }}>
                                            {action.label}
                                        </span>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </motion.div>

                    {/* LOW STOCK ALERT (NEW) instead of Fake Activity */}
                    <motion.div
                        className="kpi-card-modern"
                        style={{
                            background: 'linear-gradient(135deg, rgba(254, 226, 226, 0.5) 0%, rgba(254, 202, 202, 0.5) 100%)',
                            position: 'relative'
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        whileHover={{ y: -4 }}
                    >
                        <div style={{ position: 'relative', zIndex: 1, marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div className="kpi-icon-gradient" style={{
                                    marginBottom: 'var(--spacing-sm)',
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    color: '#b91c1c'
                                }}>
                                    <AlertTriangle size={32} />
                                </div>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                                    Alertas de Inventario
                                </h3>
                            </div>
                        </div>

                        <div className="space-y-4" style={{ position: 'relative', zIndex: 1 }}>
                            {stats?.lowStockProducts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-4 text-emerald-600">
                                    <p className="font-semibold">¡Todo en orden!</p>
                                    <p className="text-sm">No hay productos con bajo inventario.</p>
                                </div>
                            ) : (
                                stats?.lowStockProducts.map((product: any, index: number) => (
                                    <div key={index} className="flex justify-between items-center bg-white/50 p-3 rounded-lg border border-red-100">
                                        <div>
                                            <p className="font-bold text-slate-800">{product.name}</p>
                                            <p className="text-xs text-slate-500">SKU: {product.sku}</p>
                                        </div>
                                        <div className="text-red-600 font-bold bg-red-50 px-3 py-1 rounded-full text-sm">
                                            {product.inventory.reduce((acc: number, item: any) => acc + item.quantity, 0)} unid.
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
