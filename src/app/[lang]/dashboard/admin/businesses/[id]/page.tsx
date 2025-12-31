"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Users, BookOpen, GraduationCap, ShieldCheck, Key, UserCheck } from "lucide-react";
import { OwnerRecoveryModal } from "@/components/admin/owner-recovery-modal";

interface Business {
    id: string;
    name: string;
    type: string;
    plan: {
        id: string;
        name: string;
        price: number;
        maxCourses: number | null;
        maxTeachers: number | null;
        maxStudents: number | null;
    } | null;
    coursesCount: number;
    teachersCount: number;
    studentsCount: number;
    branches: Array<{ id: string; name: string }>;
    users: Array<{ id: string; email: string; name: string; role: string }>;
}

export default function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [business, setBusiness] = useState<Business | null>(null);
    const [loading, setLoading] = useState(true);
    const [businessId, setBusinessId] = useState<string>("");
    const [showRecoveryModal, setShowRecoveryModal] = useState(false);

    useEffect(() => {
        params.then(p => setBusinessId(p.id));
    }, [params]);

    useEffect(() => {
        if (status === "loading" || !businessId) return;

        if (!session?.user || session.user.role !== "SUPERADMIN") {
            router.push("/dashboard");
            return;
        }

        fetchBusiness();
    }, [session, status, router, businessId]);

    const fetchBusiness = async () => {
        try {
            const res = await fetch(`/api/admin/businesses/${businessId}`);
            const data = await res.json();
            setBusiness(data);
        } catch (error) {
            console.error("Error fetching business:", error);
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

    if (!business) {
        return (
            <div className="bg-slate-100 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Negocio no encontrado</h2>
                    <button
                        onClick={() => router.push("/dashboard/admin")}
                        className="text-blue-600 hover:underline"
                    >
                        Volver al panel
                    </button>
                </div>
            </div>
        );
    }

    const usagePercentage = (current: number, max: number | null) => {
        if (max === null) return 0;
        return Math.min((current / max) * 100, 100);
    };

    return (
        <div className="bg-slate-100 min-h-screen pb-16">
            {/* HEADER */}
            <div style={{ padding: 'var(--spacing-lg)', marginBottom: '48px' }}>
                <button
                    onClick={() => router.push("/dashboard/admin")}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        backgroundColor: 'white',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        color: '#64748B',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        marginBottom: '16px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F8FAFC';
                        e.currentTarget.style.borderColor = '#CBD5E1';
                        e.currentTarget.style.color = '#0F172A';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#E2E8F0';
                        e.currentTarget.style.color = '#64748B';
                    }}
                >
                    <ArrowLeft size={20} />
                    Volver
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
                        <Building2 size={32} className="text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                            {business.name}
                        </h1>
                        <p className="text-muted-foreground text-lg mt-1">
                            {business.type} • Plan {business.plan?.name || "Sin plan"}
                        </p>
                    </div>
                </div>
            </div>

            {/* ESTADÍSTICAS */}
            <section style={{ padding: '0 var(--spacing-lg)', marginBottom: '40px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                    {/* Cursos */}
                    <StatCard
                        title="Cursos"
                        current={business.coursesCount}
                        max={business.plan?.maxCourses || null}
                        icon={<BookOpen size={28} />}
                        bgColor="#DBEAFE"
                        iconColor="#2563EB"
                    />
                    {/* Maestros */}
                    <StatCard
                        title="Maestros"
                        current={business.teachersCount}
                        max={business.plan?.maxTeachers || null}
                        icon={<GraduationCap size={28} />}
                        bgColor="#EDE9FE"
                        iconColor="#7C3AED"
                    />
                    {/* Alumnos */}
                    <StatCard
                        title="Alumnos"
                        current={business.studentsCount}
                        max={business.plan?.maxStudents || null}
                        icon={<Users size={28} />}
                        bgColor="#D1FAE5"
                        iconColor="#059669"
                    />
                </div>
            </section>

            {/* INFORMACIÓN DEL PLAN */}
            <section style={{ padding: '0 var(--spacing-lg)', marginBottom: '40px' }}>
                <div className="bg-white rounded-2xl shadow-sm p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Detalles del Plan</h2>
                    {business.plan ? (
                        <div>
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <div className="text-sm text-slate-500 mb-1">Plan Actual</div>
                                    <div className="text-xl font-bold text-slate-900">{business.plan.name}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-slate-500 mb-1">Precio</div>
                                    <div className="text-xl font-bold text-slate-900">${business.plan.price}/mes</div>
                                </div>
                            </div>
                            <div className="border-t border-slate-200 pt-6">
                                <div className="text-sm font-semibold text-slate-700 mb-4">Límites del Plan</div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>Cursos: {business.plan.maxCourses === null ? '∞' : business.plan.maxCourses}</div>
                                    <div>Maestros: {business.plan.maxTeachers === null ? '∞' : business.plan.maxTeachers}</div>
                                    <div>Alumnos: {business.plan.maxStudents === null ? '∞' : business.plan.maxStudents}</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-500">Este negocio no tiene un plan asignado</p>
                    )}
                </div>
            </section>

            {/* USUARIOS Y SUCURSALES */}
            <div style={{ padding: '0 var(--spacing-lg)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '40px' }}>
                {/* Sucursales */}
                <div className="bg-white rounded-2xl shadow-sm p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Sucursales</h3>
                    <ul className="space-y-2">
                        {business.branches.map(branch => (
                            <li key={branch.id} className="text-slate-700">{branch.name}</li>
                        ))}
                    </ul>
                </div>

                {/* Usuarios */}
                <div className="bg-white rounded-2xl shadow-sm p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Usuarios ({business.users.length})</h3>
                    <ul className="space-y-2">
                        {business.users.slice(0, 5).map(user => (
                            <li key={user.id} className="flex justify-between text-slate-700">
                                <span>{user.name || user.email}</span>
                                <span className="text-xs bg-slate-100 px-2 py-1 rounded">{user.role}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* GESTIÓN DE DUEÑO */}
            <section style={{ padding: '0 var(--spacing-lg)' }}>
                <div className="bg-white rounded-2xl shadow-sm p-8">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            backgroundColor: '#FEF3C7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <ShieldCheck size={24} style={{ color: '#D97706' }} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Gestión de Dueño</h3>
                            <p className="text-sm text-slate-500">Recuperar acceso o transferir propiedad</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => setShowRecoveryModal(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 20px',
                                borderRadius: '10px',
                                backgroundColor: '#2563EB',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#1D4ED8';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#2563EB';
                            }}
                        >
                            <Key size={18} />
                            Recuperar Acceso
                        </button>
                        <button
                            onClick={() => setShowRecoveryModal(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 20px',
                                borderRadius: '10px',
                                backgroundColor: '#7C3AED',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#6D28D9';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#7C3AED';
                            }}
                        >
                            <UserCheck size={18} />
                            Transferir Propiedad
                        </button>
                    </div>

                    {/* Current Owner Info */}
                    {business.users.filter(u => u.role === 'OWNER').length > 0 && (
                        <div style={{
                            marginTop: '20px',
                            padding: '12px 16px',
                            backgroundColor: '#F8FAFC',
                            borderRadius: '8px',
                            fontSize: '14px',
                            color: '#475569'
                        }}>
                            <strong>Dueño actual:</strong> {business.users.find(u => u.role === 'OWNER')?.name || business.users.find(u => u.role === 'OWNER')?.email}
                        </div>
                    )}
                </div>
            </section>

            {/* Owner Recovery Modal */}
            <OwnerRecoveryModal
                isOpen={showRecoveryModal}
                onClose={() => setShowRecoveryModal(false)}
                businessId={business.id}
                businessName={business.name}
                currentOwner={business.users.find(u => u.role === 'OWNER')}
                onComplete={() => fetchBusiness()}
            />
        </div>
    );
}

interface StatCardProps {
    title: string;
    current: number;
    max: number | null;
    icon: React.ReactNode;
    bgColor: string;
    iconColor: string;
}

function StatCard({ title, current, max, icon, bgColor, iconColor }: StatCardProps) {
    const percentage = max === null ? 0 : Math.min((current / max) * 100, 100);

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
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
            <div className="text-sm text-slate-500 mb-1">{title}</div>
            <div className="text-3xl font-bold text-slate-900 mb-2">
                {current} {max !== null && `/ ${max}`}
            </div>
            {max !== null && (
                <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%`, backgroundColor: iconColor }}
                    />
                </div>
            )}
            {max === null && (
                <div className="text-xs text-slate-500">Ilimitado</div>
            )}
        </div>
    );
}
