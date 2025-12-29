"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
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
    FileText
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

    useEffect(() => {
        console.log("Dashboard Session Status:", status);
        if (status === "unauthenticated") {
            console.log("Redirecting to login due to unauthenticated status");
            router.push("/login");
        }
    }, [status, router]);

    if (status === "loading") {
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
        console.log("No session found in DashboardPage");
        return null;
    }

    const studentsData = [220, 225, 230, 235, 240, 242, 245];
    const coursesData = [15, 16, 17, 17, 18, 18, 18];
    const revenueData = [38000, 40000, 42000, 43000, 44000, 44500, 45230];
    const attendanceData = [96, 95, 94, 93, 94, 95, 94.5];

    // Extraer el lang del pathname
    const lang = pathname?.split('/')[1] || 'es';

    // ACCESOS RÁPIDOS CON NAVEGACIÓN FUNCIONAL
    const quickActions = [
        { icon: UserPlus, label: "Inscribir Alumno", href: `/${lang}/dashboard/students/new`, gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" },
        { icon: BookOpen, label: "Crear Curso", href: `/${lang}/dashboard/courses/new`, gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" },
        { icon: DollarSign, label: "Nuevo Cobro", href: `/${lang}/dashboard/finance/new`, gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)" },
        { icon: FileText, label: "Reportes", href: `/${lang}/dashboard/reports`, gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }
    ];

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
                        value="245"
                        icon={GraduationCap}
                        trend={12}
                        positive={true}
                        gradientClass="gradient-students"
                        subtitle="Inscritos activos"
                        sparklineData={studentsData}
                    />
                    <ModernKpiCard
                        title="Cursos Activos"
                        value="18"
                        icon={BookOpen}
                        trend={5.8}
                        positive={true}
                        gradientClass="gradient-courses"
                        subtitle="En este periodo"
                        sparklineData={coursesData}
                    />
                    <ModernKpiCard
                        title="Ingresos del Mes"
                        value="$45,230"
                        icon={DollarSign}
                        trend={8.3}
                        positive={true}
                        gradientClass="gradient-finance"
                        subtitle="MXN"
                        sparklineData={revenueData}
                    />
                    <ModernKpiCard
                        title="Asistencia"
                        value="94.5%"
                        icon={Calendar}
                        trend={1.2}
                        positive={false}
                        gradientClass="gradient-reports"
                        subtitle="Promedio semanal"
                        sparklineData={attendanceData}
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

                    {/* ACTIVIDAD RECIENTE */}
                    <motion.div
                        className="kpi-card-modern"
                        style={{
                            background: 'linear-gradient(135deg, rgba(254, 243, 199, 0.5) 0%, rgba(253, 230, 138, 0.5) 100%)',
                            position: 'relative'
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
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

                        <div style={{ position: 'relative', zIndex: 1, marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div className="kpi-icon-gradient" style={{
                                    marginBottom: 'var(--spacing-sm)',
                                    background: 'rgba(245, 158, 11, 0.15)',
                                    color: '#d97706'
                                }}>
                                    <FileText size={32} />
                                </div>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                                    Actividad Reciente
                                </h3>
                            </div>
                            <span style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                color: '#92400e',
                                background: 'rgba(254, 243, 199, 0.8)',
                                padding: '6px 12px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid rgba(217, 119, 6, 0.2)'
                            }}>
                                HOY
                            </span>
                        </div>

                        <div className="space-y-6" style={{ position: 'relative', zIndex: 1 }}>
                            {[
                                { icon: DollarSign, title: "Pago registrado", desc: "Juan Pérez - $2,500 MXN", time: "5 min", color: '#10b981' },
                                { icon: UserPlus, title: "Nuevo alumno", desc: "María González - 5to A", time: "1 hora", color: '#3b82f6' },
                                { icon: Calendar, title: "Pago vencido", desc: "Carlos Ramírez", time: "2 horas", color: '#f59e0b' },
                                { icon: BookOpen, title: "Asistencia", desc: "Matemáticas - 3B", time: "3 horas", color: '#8b5cf6' }
                            ].map((activity, index) => (
                                <motion.div
                                    key={index}
                                    className="flex gap-4 relative"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + index * 0.1 }}
                                >
                                    {index !== 3 && (
                                        <div style={{
                                            position: 'absolute',
                                            left: '32px',
                                            top: '64px',
                                            bottom: '-24px',
                                            width: '2px',
                                            background: 'rgba(120, 113, 108, 0.2)'
                                        }} />
                                    )}

                                    <div className="kpi-icon-gradient" style={{
                                        flexShrink: 0,
                                        background: `${activity.color}15`,
                                        color: activity.color
                                    }}>
                                        <activity.icon size={32} />
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
                                            <p style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                                                {activity.title}
                                            </p>
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#78716c', whiteSpace: 'nowrap' }}>
                                                {activity.time}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>
                                            {activity.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
