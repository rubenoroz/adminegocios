"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Building2, Edit, RefreshCw } from "lucide-react";

interface Business {
    id: string;
    name: string;
    type: string;
    enabledModules?: string; // JSON array string
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
    };
    createdAt: string;
}

const MODULE_OPTIONS = [
    { id: 'SCHOOL', label: 'Escuela', icon: '🎓', description: 'Cursos, alumnos, maestros' },
    { id: 'RETAIL', label: 'Tienda', icon: '🏪', description: 'Inventario, productos, ventas' },
    { id: 'RESTAURANT', label: 'Restaurante', icon: '🍽️', description: 'Mesas, órdenes, cocina' },
    { id: 'SERVICE', label: 'Servicios', icon: '🔧', description: 'Citas, clientes' }
];

interface Plan {
    id: string;
    name: string;
    price: number;
    maxCourses: number | null;
    maxTeachers: number | null;
    maxStudents: number | null;
}

export default function BusinessesManagementPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<string>("");
    const [selectedModules, setSelectedModules] = useState<string[]>([]);

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
            const [businessesRes, plansRes] = await Promise.all([
                fetch("/api/admin/businesses"),
                fetch("/api/admin/plans")
            ]);

            const businessesData = await businessesRes.json();
            const plansData = await plansRes.json();

            setBusinesses(businessesData);
            setPlans(plansData);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePlan = async () => {
        if (!selectedBusiness || !selectedPlan) return;

        try {
            const res = await fetch(`/api/admin/businesses/${selectedBusiness}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    planId: selectedPlan,
                    enabledModules: JSON.stringify(selectedModules),
                    recalculate: true
                })
            });

            if (res.ok) {
                alert("Plan actualizado exitosamente");
                setSelectedBusiness(null);
                setSelectedPlan("");
                fetchData();
            } else {
                alert("Error al actualizar plan");
            }
        } catch (error) {
            console.error("Error updating plan:", error);
            alert("Error al actualizar plan");
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
        <div style={{ backgroundColor: '#F1F5F9', minHeight: '100vh', paddingBottom: '64px' }}>
            {/* HEADER - Responsive */}
            <div className="p-4 lg:p-8 mb-8 lg:mb-12">
                <h1 className="text-2xl lg:text-4xl font-bold tracking-tight text-gray-900 mb-2 lg:mb-3">
                    Gestión de Negocios
                </h1>
                <p className="text-slate-500 text-sm lg:text-lg">
                    Administra los planes de todos los negocios registrados
                </p>
            </div>

            {/* NEGOCIOS */}
            <section className="px-4 lg:px-8 pb-8">
                <div className="bg-white rounded-xl lg:rounded-2xl shadow-sm overflow-hidden">

                    {/* MOBILE: Cards View */}
                    <div className="lg:hidden divide-y divide-slate-100">
                        {businesses.map((business) => (
                            <div key={business.id} className="p-4">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <Building2 size={20} className="text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-slate-900 truncate">{business.name}</h3>
                                        <p className="text-sm text-slate-500">{business.type}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                                    <div className="bg-slate-50 rounded-lg p-2">
                                        <span className="text-slate-500">Plan:</span>
                                        <span className="font-medium text-slate-900 ml-1">
                                            {business.plan?.name || 'Sin plan'}
                                        </span>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-2">
                                        <span className="text-slate-500">Precio:</span>
                                        <span className="font-medium text-slate-900 ml-1">
                                            {business.plan ? `$${business.plan.price}/mes` : '-'}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-xs text-slate-500 mb-3">
                                    📚 {business.coursesCount} cursos · 👨‍🏫 {business.teachersCount} maestros · 👨‍🎓 {business.studentsCount} alumnos
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedBusiness(business.id);
                                            setSelectedPlan(business.plan?.id || "");
                                            try {
                                                const modules = business.enabledModules ? JSON.parse(business.enabledModules) : [business.type];
                                                setSelectedModules(modules);
                                            } catch {
                                                setSelectedModules([business.type]);
                                            }
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '8px 12px',
                                            backgroundColor: '#2563EB',
                                            color: 'white',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            borderRadius: '8px',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Edit size={14} />
                                        Cambiar Plan
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!confirm("¿Estás seguro de que quieres eliminar este negocio y TODOS sus datos (usuarios, productos, etc.)? Esta acción no se puede deshacer.")) return;

                                            const reason = prompt("Escribe 'ELIMINAR' para confirmar:");
                                            if (reason !== "ELIMINAR") return;

                                            try {
                                                setLoading(true);
                                                const res = await fetch(`/api/admin/businesses/${business.id}`, {
                                                    method: "DELETE"
                                                });

                                                if (res.ok) {
                                                    alert("Negocio eliminado correctamente");
                                                    fetchData();
                                                } else {
                                                    alert("Error al eliminar el negocio");
                                                }
                                            } catch (error) {
                                                console.error(error);
                                                alert("Error de conexión");
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '8px 12px',
                                            backgroundColor: '#EF4444',
                                            color: 'white',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            borderRadius: '8px',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        🗑️ Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* DESKTOP: Table View */}
                    <div className="hidden lg:block">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: '#F8FAFC' }}>
                                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '14px', fontWeight: 600, color: '#64748B' }}>Negocio</th>
                                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '14px', fontWeight: 600, color: '#64748B' }}>Plan Actual</th>
                                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '14px', fontWeight: 600, color: '#64748B' }}>Uso</th>
                                    <th className="!text-left" style={{ textAlign: 'left', padding: '16px 24px', fontSize: '14px', fontWeight: 600, color: '#64748B' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {businesses.map((business) => (
                                    <tr key={business.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s ease' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Building2 size={20} style={{ color: '#2563EB' }} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: '#0F172A' }}>{business.name}</div>
                                                    <div style={{ fontSize: '14px', color: '#64748B' }}>{business.type}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            {business.plan ? (
                                                <div>
                                                    <div style={{ fontWeight: 500, color: '#0F172A' }}>{business.plan.name}</div>
                                                    <div style={{ fontSize: '14px', color: '#64748B' }}>${business.plan.price}/mes</div>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#94A3B8' }}>Sin plan</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ fontSize: '14px', color: '#475569' }}>
                                                <div>Cursos: {business.coursesCount}</div>
                                                <div>Maestros: {business.teachersCount}</div>
                                                <div>Alumnos: {business.studentsCount}</div>
                                            </div>
                                        </td>
                                        <td className="!text-left" style={{ padding: '16px 24px', textAlign: 'left' }}>
                                            <button
                                                onClick={() => {
                                                    setSelectedBusiness(business.id);
                                                    setSelectedPlan(business.plan?.id || "");
                                                    try {
                                                        const modules = business.enabledModules ? JSON.parse(business.enabledModules) : [business.type];
                                                        setSelectedModules(modules);
                                                    } catch {
                                                        setSelectedModules([business.type]);
                                                    }
                                                }}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '8px 16px',
                                                    borderRadius: '8px',
                                                    backgroundColor: '#2563EB',
                                                    color: 'white',
                                                    fontSize: '14px',
                                                    fontWeight: 500,
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s ease',
                                                    marginRight: '8px'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#1D4ED8';
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#2563EB';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                <Edit size={16} />
                                                Cambiar Plan
                                            </button>

                                            <button
                                                onClick={async () => {
                                                    if (!confirm("¿Estás seguro de que quieres eliminar este negocio y TODOS sus datos (usuarios, productos, etc.)? Esta acción no se puede deshacer.")) return;

                                                    const reason = prompt("Escribe 'ELIMINAR' para confirmar:");
                                                    if (reason !== "ELIMINAR") return;

                                                    try {
                                                        setLoading(true);
                                                        const res = await fetch(`/api/admin/businesses/${business.id}`, {
                                                            method: "DELETE"
                                                        });

                                                        if (res.ok) {
                                                            alert("Negocio eliminado correctamente");
                                                            fetchData();
                                                        } else {
                                                            alert("Error al eliminar el negocio");
                                                        }
                                                    } catch (error) {
                                                        console.error(error);
                                                        alert("Error de conexión");
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '8px 16px',
                                                    borderRadius: '8px',
                                                    backgroundColor: '#EF4444',
                                                    color: 'white',
                                                    fontSize: '14px',
                                                    fontWeight: 500,
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#DC2626';
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#EF4444';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* MODAL PARA CAMBIAR PLAN */}
            {selectedBusiness && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 50
                    }}
                    onClick={() => setSelectedBusiness(null)}
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            padding: '32px',
                            maxWidth: '28rem',
                            width: '100%',
                            margin: '0 16px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#0F172A' }}>
                            Cambiar Plan
                        </h2>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: '#334155',
                                marginBottom: '8px'
                            }}>
                                Seleccionar Plan
                            </label>
                            <select
                                value={selectedPlan}
                                onChange={(e) => setSelectedPlan(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    color: '#0F172A',
                                    backgroundColor: 'white',
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#3B82F6';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#CBD5E1';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                <option value="">Selecciona un plan</option>
                                {plans.map((plan) => (
                                    <option key={plan.id} value={plan.id}>
                                        {plan.name} - ${plan.price}/mes
                                        {plan.maxCourses && ` (${plan.maxCourses} cursos, ${plan.maxTeachers} maestros, ${plan.maxStudents} alumnos)`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: '#334155',
                                marginBottom: '12px'
                            }}>
                                Módulos Habilitados
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {MODULE_OPTIONS.map(mod => (
                                    <label
                                        key={mod.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '12px',
                                            borderRadius: '10px',
                                            border: selectedModules.includes(mod.id) ? '2px solid #3B82F6' : '2px solid #E2E8F0',
                                            backgroundColor: selectedModules.includes(mod.id) ? '#EFF6FF' : 'white',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedModules.includes(mod.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedModules([...selectedModules, mod.id]);
                                                } else {
                                                    setSelectedModules(selectedModules.filter(m => m !== mod.id));
                                                }
                                            }}
                                            style={{ width: '18px', height: '18px', accentColor: '#3B82F6' }}
                                        />
                                        <span style={{ fontSize: '20px' }}>{mod.icon}</span>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '14px', color: '#0F172A' }}>{mod.label}</div>
                                            <div style={{ fontSize: '11px', color: '#64748B' }}>{mod.description}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setSelectedBusiness(null)}
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    border: '1px solid #CBD5E1',
                                    color: '#334155',
                                    fontWeight: 500,
                                    backgroundColor: 'white',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleChangePlan}
                                disabled={!selectedPlan}
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    backgroundColor: selectedPlan ? '#2563EB' : '#94A3B8',
                                    color: 'white',
                                    fontWeight: 500,
                                    border: 'none',
                                    cursor: selectedPlan ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    fontSize: '14px'
                                }}
                                onMouseEnter={(e) => {
                                    if (selectedPlan) e.currentTarget.style.backgroundColor = '#1D4ED8';
                                }}
                                onMouseLeave={(e) => {
                                    if (selectedPlan) e.currentTarget.style.backgroundColor = '#2563EB';
                                }}
                            >
                                <RefreshCw size={16} />
                                Actualizar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
