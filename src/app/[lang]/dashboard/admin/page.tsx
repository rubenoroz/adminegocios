"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Building2, Users, DollarSign, TrendingUp, Plus } from "lucide-react";

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
            {/* HEADER */}
            <div style={{ padding: 'var(--spacing-lg)', marginBottom: '48px' }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
                            Panel de Super Administrador
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Gestiona todos los negocios y planes de la plataforma
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/dashboard/admin/businesses/new")}
                        className="button-modern flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                    >
                        <Plus size={18} />
                        Nuevo Negocio
                    </button>
                </div>
            </div>

            {/* ESTADÍSTICAS */}
            {stats && (
                <div style={{ padding: '0 var(--spacing-lg)', marginBottom: '40px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
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

            {/* TABLA DE NEGOCIOS */}
            <section style={{ padding: '0 var(--spacing-lg)' }} className="pb-8">
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div style={{ padding: '24px', borderBottom: '1px solid #E2E8F0' }}>
                        <h2 className="text-xl font-bold text-gray-900">Negocios Registrados</h2>
                    </div>

                    {businesses.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-slate-500 text-lg">No hay negocios registrados</p>
                        </div>
                    ) : (
                        <table className="w-full">
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
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        padding: '10px 20px',
                                                        borderRadius: '10px',
                                                        backgroundColor: '#2563EB',
                                                        color: 'white',
                                                        fontSize: '14px',
                                                        fontWeight: 600,
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#1D4ED8';
                                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#2563EB';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.2)';
                                                    }}
                                                >
                                                    Ver detalles
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
            >
                {icon}
            </div>
            <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '4px', fontWeight: 500 }}>
                {title}
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1E293B' }}>
                {value}
            </div>
        </div>
    );
}
