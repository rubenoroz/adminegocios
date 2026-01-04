"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Building2, Users, DollarSign, TrendingUp, Plus, Pencil, Trash2 } from "lucide-react";

interface Business {
    id: string;
    name: string;
    type: string;
    plan: {
        id: string;
        name: string;
        price: number;
    } | null;
    coursesCount: number;
    teachersCount: number;
    studentsCount: number;
    _count: {
        users: number;
        branches: number;
        courses: number;
        students: number;
        employees: number;
    };
    createdAt: string;
}

interface Stats {
    totalBusinesses: number;
    totalUsers: number;
    totalRevenue: number;
    activeBusinesses: number;
}

export default function AdminDashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "loading") return;

        if (!session?.user || session.user.role !== "SUPERADMIN") {
            router.push("/dashboard");
            return;
        }

        fetchData();
    }, [session, status, router]);

    const fetchData = async () => {
        try {
            const res = await fetch("/api/admin/businesses");
            const data = await res.json();
            setBusinesses(data);

            // Calcular estadísticas
            const stats: Stats = {
                totalBusinesses: data.length,
                totalUsers: data.reduce((sum: number, b: Business) => sum + b._count.users, 0),
                totalRevenue: data.reduce((sum: number, b: Business) => sum + (b.plan?.price || 0), 0),
                activeBusinesses: data.length
            };
            setStats(stats);
        } catch (error) {
            console.error("Error fetching admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="bg-slate-100 min-h-screen flex items-center justify-center">
                <div className="animate-spin w-12 h-12 border-2 border-blue-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="bg-slate-100 min-h-screen pb-16">
            {/* HEADER - Responsive */}
            <div style={{ padding: 'var(--spacing-lg)', marginBottom: '48px' }}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl lg:text-4xl font-bold tracking-tight text-gray-900 mb-2 lg:mb-3">
                            Panel de Super Administrador
                        </h1>
                        <p className="text-muted-foreground text-base lg:text-lg">
                            Gestiona todos los negocios y planes de la plataforma
                        </p>
                    </div>
                    <div className="flex justify-end lg:justify-start">
                        <button
                            onClick={() => router.push("/dashboard/admin/businesses/new")}
                            className="button-modern gradient-blue flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Nuevo Negocio
                        </button>
                    </div>
                </div>
            </div>

            {/* ESTADÍSTICAS - Responsive Grid */}
            {stats && (
                <div style={{ padding: '0 var(--spacing-lg)', marginBottom: '40px' }}>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        <StatCard
                            title="Total Negocios"
                            value={stats.totalBusinesses}
                            icon={<Building2 size={28} />}
                            bgColor="#DBEAFE"
                            iconColor="#2563EB"
                        />
                        <StatCard
                            title="Usuarios Activos"
                            value={stats.totalUsers}
                            icon={<Users size={28} />}
                            bgColor="#EDE9FE"
                            iconColor="#7C3AED"
                        />
                        <StatCard
                            title="Negocios Activos"
                            value={stats.activeBusinesses}
                            icon={<TrendingUp size={28} />}
                            bgColor="#D1FAE5"
                            iconColor="#059669"
                        />
                        <StatCard
                            title="Ingreso Mensual"
                            value={`$${stats.totalRevenue.toLocaleString()}`}
                            icon={<DollarSign size={28} />}
                            bgColor="#FFEDD5"
                            iconColor="#EA580C"
                        />
                    </div>
                </div>
            )}

            {/* NEGOCIOS - Responsive Layout */}
            <section style={{ padding: '0 var(--spacing-lg)' }} className="pb-8">
                <div className="bg-white rounded-xl lg:rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 lg:p-6 border-b border-slate-200">
                        <h2 className="text-lg lg:text-xl font-bold text-gray-900">Negocios Registrados</h2>
                    </div>

                    {businesses.length === 0 ? (
                        <div className="p-8 lg:p-12 text-center">
                            <p className="text-slate-500 text-base lg:text-lg">No hay negocios registrados</p>
                        </div>
                    ) : (
                        <>
                            {/* MOBILE/TABLET: Cards View */}
                            <div className="lg:hidden divide-y divide-slate-100">
                                {businesses.map((business) => (
                                    <div key={business.id} className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{business.name}</h3>
                                                <p className="text-sm text-slate-500">
                                                    {new Date(business.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                {business.type}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                                            <div className="bg-slate-50 rounded-lg p-2">
                                                <span className="text-slate-500">Plan:</span>
                                                <span className="font-medium text-slate-900 ml-1">
                                                    {business.plan?.name || 'Sin plan'}
                                                </span>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg p-2">
                                                <span className="text-slate-500">Usuarios:</span>
                                                <span className="font-medium text-slate-900 ml-1">
                                                    {business._count.users}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-xs text-slate-500 mb-3">
                                            📚 {business.coursesCount} cursos · 👨‍🏫 {business.teachersCount} maestros · 👨‍🎓 {business.studentsCount} alumnos
                                        </div>

                                        <div className="flex flex-wrap gap-2 justify-end">
                                            <button
                                                onClick={() => router.push(`/dashboard/admin/businesses/${business.id}`)}
                                                className="button-modern-sm button-modern-sm-blue"
                                            >
                                                Ver detalles
                                            </button>
                                            <button
                                                onClick={() => {/* TODO: Open change plan modal */ }}
                                                className="button-modern-sm gradient-green flex items-center gap-1"
                                            >
                                                <Pencil size={14} />
                                                Cambiar Plan
                                            </button>
                                            <button
                                                onClick={() => {/* TODO: Open delete confirmation */ }}
                                                className="button-modern-sm gradient-red flex items-center gap-1"
                                            >
                                                <Trash2 size={14} />
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* DESKTOP: Table View */}
                            <table className="w-full hidden lg:table">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50">
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Negocio</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Tipo</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Plan</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Uso (Cursos/Maestros/Alumnos)</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Usuarios</th>
                                        <th className="!text-left px-6 py-4 text-sm font-semibold text-slate-600">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {businesses.map((business) => (
                                        <tr
                                            key={business.id}
                                            className="border-b border-gray-100 transition-colors hover:bg-slate-50"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-900">{business.name}</div>
                                                <div className="text-sm text-slate-500">
                                                    {new Date(business.createdAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                    {business.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {business.plan ? (
                                                    <div>
                                                        <div className="font-medium text-slate-900">{business.plan.name}</div>
                                                        <div className="text-sm text-slate-500">${business.plan.price}/mes</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">Sin plan</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    {business.coursesCount} / {business.teachersCount} / {business.studentsCount}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-slate-900">
                                                    {business._count.users} usuarios
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => router.push(`/dashboard/admin/businesses/${business.id}`)}
                                                        className="button-modern-sm button-modern-sm-blue"
                                                    >
                                                        Ver detalles
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    bgColor: string;
    iconColor: string;
}

function StatCard({ title, value, icon, bgColor, iconColor }: StatCardProps) {
    return (
        <div
            style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
            }}
            className="!p-4 lg:!p-6"
        >
            <div
                style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    backgroundColor: bgColor,
                    color: iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px'
                }}
                className="!w-10 !h-10 lg:!w-14 lg:!h-14 !mb-3 lg:!mb-4"
            >
                <span className="scale-75 lg:scale-100">{icon}</span>
            </div>
            <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '4px', fontWeight: 500 }}>
                {title}
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1E293B' }} className="!text-xl lg:!text-3xl">
                {value}
            </div>
        </div>
    );
}
