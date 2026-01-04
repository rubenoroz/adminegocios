"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChangePlanModal } from "@/components/admin/change-plan-modal";
import { ArrowLeft, Building2, Users, BookOpen, GraduationCap, ShieldCheck, Key, UserCheck, Pencil, Store, CheckCircle, AlertTriangle } from "lucide-react";
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
    const [showChangePlanModal, setShowChangePlanModal] = useState(false);

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
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div className="animate-spin" style={{ width: '48px', height: '48px', border: '4px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    <p style={{ color: '#64748B', fontWeight: 500 }}>Cargando información del negocio...</p>
                </div>
            </div>
        );
    }

    if (!business) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
                <div style={{ textAlign: 'center', padding: '32px' }}>
                    <div style={{ backgroundColor: '#FEF2F2', color: '#EF4444', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                        <AlertTriangle size={32} />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0F172A', marginBottom: '8px' }}>Negocio no encontrado</h2>
                    <p style={{ color: '#64748B', marginBottom: '24px' }}>No pudimos encontrar la información solicitada.</p>
                    <button
                        onClick={() => router.push("/dashboard/admin")}
                        style={{ color: '#2563EB', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '0 auto', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        <ArrowLeft size={16} />
                        Volver al panel
                    </button>
                </div>
            </div>
        );
    }

    const planFeatures = [
        { label: "Cursos", current: business.coursesCount, max: business.plan?.maxCourses, icon: <BookOpen size={16} /> },
        { label: "Maestros", current: business.teachersCount, max: business.plan?.maxTeachers, icon: <GraduationCap size={16} /> },
        { label: "Alumnos", current: business.studentsCount, max: business.plan?.maxStudents, icon: <Users size={16} /> },
    ];

    // Inline Styles System
    const cardStyle = {
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        overflow: 'hidden'
    };

    const headerStyle = {
        padding: '24px',
        borderBottom: '1px solid #F1F5F9',
        backgroundColor: '#F8FAFC',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    };

    const titleStyle = {
        fontSize: '18px',
        fontWeight: 700,
        color: '#0F172A',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        margin: 0
    };

    return (
        <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {/* Top Navigation Bar */}
            <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button
                            onClick={() => router.push("/dashboard/admin")}
                            style={{ padding: '8px', borderRadius: '9999px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}
                            aria-label="Volver"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div style={{ height: '24px', width: '1px', backgroundColor: '#E2E8F0', display: 'block' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748B' }}>Negocios /</span>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{business.name}</span>
                        </div>
                    </div>
                </div>
            </div>

            <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

                {/* Header Section */}
                <div style={{ ...cardStyle, position: 'relative', padding: '32px' }}>
                    {/* Gradient Background Decoration */}
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: 'linear-gradient(135deg, #EFF6FF 0%, #EEF2FF 100%)', borderBottomLeftRadius: '100%', opacity: 0.8, zIndex: 0 }} />

                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '24px', position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '24px' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.2)' }}>
                                <Building2 size={40} />
                            </div>
                            <div>
                                <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#0F172A', lineHeight: 1.2, margin: '0 0 8px 0' }}>{business.name}</h1>
                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #DBEAFE' }}>
                                        <Building2 size={12} />
                                        {business.type}
                                    </span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #D1FAE5' }}>
                                        <CheckCircle size={12} />
                                        Activo
                                    </span>
                                    <span style={{ fontSize: '14px', color: '#64748B' }}>
                                        ID: <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{business.id}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Owner Quick Card */}
                        {business.users.length > 0 && (
                            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '16px', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '16px', minWidth: '280px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontWeight: 700 }}>
                                    {(business.users.find(u => u.role === 'OWNER')?.name?.[0] || 'U')}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: '10px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px 0' }}>Dueño Principal</p>
                                    <p style={{ fontWeight: 600, color: '#0F172A', fontSize: '14px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {business.users.find(u => u.role === 'OWNER')?.name || "Sin nombre asignado"}
                                    </p>
                                    <p style={{ fontSize: '12px', color: '#64748B', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {business.users.find(u => u.role === 'OWNER')?.email || "Sin email"}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Grid Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'start' }} className="responsive-grid">

                    {/* LEFT COLUMN */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                        {/* Plan Details Card */}
                        <div style={cardStyle}>
                            <div style={headerStyle}>
                                <h2 style={titleStyle}>
                                    <ShieldCheck size={20} color="#2563EB" />
                                    Suscripción y Límites
                                </h2>
                                <button
                                    onClick={() => setShowChangePlanModal(true)}
                                    style={{ fontSize: '13px', fontWeight: 600, color: '#2563EB', backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                                >
                                    <Pencil size={14} />
                                    Cambiar Plan
                                </button>
                            </div>

                            <div style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
                                    <div>
                                        <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 500, margin: '0 0 4px 0' }}>Plan Actual</p>
                                        <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: 0 }}>{business.plan?.name || "Sin Plan"}</h3>
                                        <p style={{ color: '#94A3B8', fontSize: '13px', margin: '4px 0 0 0' }}>Facturación mensual recurrente</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 500, margin: '0 0 4px 0' }}>Costo</p>
                                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '4px' }}>
                                            <span style={{ fontSize: '30px', fontWeight: 800, color: '#0F172A' }}>${business.plan?.price || 0}</span>
                                            <span style={{ color: '#64748B', fontWeight: 500 }}>/mes</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                    {planFeatures.map((feat, idx) => (
                                        <div key={idx} style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '16px', border: '1px solid #F1F5F9' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', marginBottom: '8px', fontWeight: 500, fontSize: '13px' }}>
                                                {feat.icon}
                                                {feat.label}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                                <span style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>{feat.current}</span>
                                                <span style={{ fontSize: '14px', color: '#94A3B8' }}>/ {feat.max === null ? '∞' : feat.max}</span>
                                            </div>
                                            {typeof feat.max === 'number' && (
                                                <div style={{ marginTop: '12px', height: '6px', width: '100%', backgroundColor: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                                                    <div
                                                        style={{
                                                            height: '100%',
                                                            borderRadius: '999px',
                                                            width: `${Math.min((feat.current / feat.max) * 100, 100)}%`,
                                                            backgroundColor: (feat.current / feat.max) > 0.9 ? '#EF4444' : (feat.current / feat.max) > 0.7 ? '#F59E0B' : '#3B82F6'
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            {feat.max === null && (
                                                <div style={{ marginTop: '12px', fontSize: '11px', fontWeight: 600, color: '#059669', backgroundColor: '#ECFDF5', border: '1px solid #D1FAE5', borderRadius: '999px', padding: '2px 8px', display: 'inline-block' }}>
                                                    Sin límites
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Users Table */}
                        <div style={cardStyle}>
                            <div style={headerStyle}>
                                <div>
                                    <h2 style={titleStyle}>Usuarios del Sistema</h2>
                                    <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0 0' }}>Administradores y personal con acceso</p>
                                </div>
                                <div style={{ backgroundColor: '#F1F5F9', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                                    Total: {business.users.length}
                                </div>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#F8FAFC', color: '#64748B', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            <th style={{ padding: '16px 24px', fontWeight: 600 }}>Usuario</th>
                                            <th style={{ padding: '16px 24px', fontWeight: 600 }}>Email</th>
                                            <th style={{ padding: '16px 24px', fontWeight: 600 }}>Rol</th>
                                            <th style={{ padding: '16px 24px', fontWeight: 600, textAlign: 'right' }}>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody style={{ divideY: '1px', divideColor: '#F1F5F9' }}>
                                        {business.users.map((user, idx) => (
                                            <tr key={user.id} style={{ borderTop: idx > 0 ? '1px solid #F1F5F9' : 'none' }}>
                                                <td style={{ padding: '16px 24px', color: '#0F172A', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)', border: '1px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#475569' }}>
                                                        {user.name?.[0] || user.email[0].toUpperCase()}
                                                    </div>
                                                    {user.name || "Sin nombre"}
                                                </td>
                                                <td style={{ padding: '16px 24px', color: '#475569' }}>{user.email}</td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <span style={{
                                                        padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                                                        backgroundColor: user.role === 'OWNER' ? '#FAF5FF' : user.role === 'ADMIN' ? '#EFF6FF' : '#F8FAFC',
                                                        color: user.role === 'OWNER' ? '#7E22CE' : user.role === 'ADMIN' ? '#1D4ED8' : '#475569',
                                                        border: `1px solid ${user.role === 'OWNER' ? '#F3E8FF' : user.role === 'ADMIN' ? '#DBEAFE' : '#E2E8F0'}`
                                                    }}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                    <span style={{ color: '#059669', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                                                        Activo
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                        {/* Branches Summary */}
                        <div style={cardStyle}>
                            <div style={headerStyle}>
                                <h3 style={titleStyle}>
                                    <Store size={18} color="#4F46E5" />
                                    Sucursales ({business.branches.length})
                                </h3>
                            </div>
                            <div style={{ padding: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                                {business.branches.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '32px', color: '#64748B', fontSize: '13px' }}>No hay sucursales registradas</div>
                                ) : (
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {business.branches.map(branch => (
                                            <li key={branch.id} style={{ padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '11px' }}>
                                                    {branch.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>{branch.name}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* Owner Actions */}
                        <div style={cardStyle}>
                            <div style={headerStyle}>
                                <h3 style={titleStyle}>
                                    <Key size={18} color="#D97706" />
                                    Accesos Administrativos
                                </h3>
                            </div>
                            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button
                                    onClick={() => setShowRecoveryModal(true)}
                                    style={{ width: '100%', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', color: '#475569', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                                >
                                    <Key size={16} />
                                    Recuperar Contraseña
                                </button>
                                <button
                                    onClick={() => setShowRecoveryModal(true)}
                                    style={{ width: '100%', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', backgroundColor: '#7C3AED', backgroundImage: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', border: 'none', color: 'white', boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.3)' }}
                                >
                                    <UserCheck size={16} />
                                    Transferir Propiedad
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </main>

            {/* Modals */}
            <OwnerRecoveryModal
                isOpen={showRecoveryModal}
                onClose={() => setShowRecoveryModal(false)}
                businessId={business.id}
                businessName={business.name}
                currentOwner={business.users.find(u => u.role === 'OWNER')}
                onComplete={() => fetchBusiness()}
            />

            <ChangePlanModal
                isOpen={showChangePlanModal}
                onClose={() => setShowChangePlanModal(false)}
                businessId={business.id}
                currentPlanId={business.plan?.id}
                onComplete={() => fetchBusiness()}
            />

            {/* Responsive Fix */}
            <style jsx global>{`
                @media (max-width: 1024px) {
                    .responsive-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
