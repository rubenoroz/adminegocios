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
            {/* HEADER - Responsive */}
            <div style={{ padding: 'var(--spacing-lg)', marginBottom: '48px' }}>
                <button
                    onClick={() => router.push("/dashboard/admin")}
                    className="flex items-center gap-2 py-2 px-4 bg-white border border-slate-200 rounded-lg text-slate-500 text-sm font-medium mb-4 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all"
                >
                    <ArrowLeft size={20} />
                    Volver
                </button>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-blue-100 flex items-center justify-center">
                        <Building2 size={24} className="lg:w-8 lg:h-8 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl lg:text-4xl font-bold tracking-tight text-gray-900">
                            {business.name}
                        </h1>
                        <p className="text-muted-foreground text-sm lg:text-lg mt-1">
                            {business.type} • Plan {business.plan?.name || "Sin plan"}
                        </p>
                    </div>
                </div>
            </div>

            {/* ESTADÍSTICAS - Responsive Grid */}
            <section style={{ padding: '0 var(--spacing-lg)', marginBottom: '40px' }}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
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

            {/* INFORMACIÓN DEL PLAN - Responsive */}
            <section style={{ padding: '0 var(--spacing-lg)', marginBottom: '40px' }}>
                <div className="bg-white rounded-xl lg:rounded-2xl shadow-sm p-4 lg:p-8">
                    <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">Detalles del Plan</h2>
                    {business.plan ? (
                        <div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-4 lg:mb-6">
                                <div>
                                    <div className="text-xs lg:text-sm text-slate-500 mb-1">Plan Actual</div>
                                    <div className="text-lg lg:text-xl font-bold text-slate-900">{business.plan.name}</div>
                                </div>
                                <div>
                                    <div className="text-xs lg:text-sm text-slate-500 mb-1">Precio</div>
                                    <div className="text-lg lg:text-xl font-bold text-slate-900">${business.plan.price}/mes</div>
                                </div>
                            </div>
                            <div className="border-t border-slate-200 pt-4 lg:pt-6">
                                <div className="text-xs lg:text-sm font-semibold text-slate-700 mb-3 lg:mb-4">Límites del Plan</div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-4 text-sm">
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

            {/* USUARIOS Y SUCURSALES - Responsive */}
            <div className="px-4 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-10">
                {/* Sucursales */}
                <div className="bg-white rounded-xl lg:rounded-2xl shadow-sm p-4 lg:p-8">
                    <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-3 lg:mb-4">Sucursales</h3>
                    <ul className="space-y-2">
                        {business.branches.map(branch => (
                            <li key={branch.id} className="text-sm lg:text-base text-slate-700">{branch.name}</li>
                        ))}
                    </ul>
                </div>

                {/* Usuarios */}
                <div className="bg-white rounded-xl lg:rounded-2xl shadow-sm p-4 lg:p-8">
                    <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-3 lg:mb-4">Usuarios ({business.users.length})</h3>
                    <ul className="space-y-2">
                        {business.users.slice(0, 5).map(user => (
                            <li key={user.id} className="flex justify-between text-sm lg:text-base text-slate-700">
                                <span className="truncate">{user.name || user.email}</span>
                                <span className="text-xs bg-slate-100 px-2 py-1 rounded ml-2">{user.role}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* GESTIÓN DE DUEÑO - Responsive */}
            <section className="px-4 lg:px-8">
                <div className="bg-white rounded-xl lg:rounded-2xl shadow-sm p-4 lg:p-8">
                    <div className="flex items-center gap-3 mb-4 lg:mb-5">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl bg-amber-100 flex items-center justify-center">
                            <ShieldCheck size={20} className="lg:w-6 lg:h-6 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-lg lg:text-xl font-bold text-gray-900">Gestión de Dueño</h3>
                            <p className="text-xs lg:text-sm text-slate-500">Recuperar acceso o transferir propiedad</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => setShowRecoveryModal(true)}
                            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                        >
                            <Key size={16} />
                            Recuperar Acceso
                        </button>
                        <button
                            onClick={() => setShowRecoveryModal(true)}
                            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors"
                        >
                            <UserCheck size={16} />
                            Transferir Propiedad
                        </button>
                    </div>

                    {/* Current Owner Info */}
                    {business.users.filter(u => u.role === 'OWNER').length > 0 && (
                        <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
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
        <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm">
            <div
                style={{ backgroundColor: bgColor, color: iconColor }}
                className="w-10 h-10 lg:w-14 lg:h-14 rounded-lg lg:rounded-xl flex items-center justify-center mb-3 lg:mb-4"
            >
                <span className="scale-75 lg:scale-100">{icon}</span>
            </div>
            <div className="text-xs lg:text-sm text-slate-500 mb-1">{title}</div>
            <div className="text-xl lg:text-3xl font-bold text-slate-900 mb-2">
                {current} {max !== null && `/ ${max}`}
            </div>
            {max !== null && (
                <div className="w-full bg-slate-200 rounded-full h-1.5 lg:h-2">
                    <div
                        className="h-1.5 lg:h-2 rounded-full transition-all"
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
