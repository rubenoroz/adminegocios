"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CreditCard, Plus, Users, Edit, Trash2, X, Check } from "lucide-react";

interface Plan {
    id: string;
    name: string;
    description: string;
    features: string;
    price: number;
    interval: string;
    maxCourses: number | null;
    maxTeachers: number | null;
    maxStudents: number | null;
    maxBranches: number | null;
    maxInventoryItems: number | null;
    isActive: boolean;
    _count?: {
        businesses: number;
    };
}

interface PlanFormData {
    name: string;
    description: string;
    features: string;
    price: number;
    interval: string;
    maxCourses: number | null;
    maxTeachers: number | null;
    maxStudents: number | null;
    maxBranches: number | null;
    maxInventoryItems: number | null;
}

export default function PlansManagementPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [formData, setFormData] = useState<PlanFormData>({
        name: "",
        description: "",
        features: "",
        price: 0,
        interval: "monthly",
        maxCourses: null,
        maxTeachers: null,
        maxStudents: null,
        maxBranches: null,
        maxInventoryItems: null
    });

    useEffect(() => {
        if (status === "loading") return;

        if (!session?.user || session.user.role !== "SUPERADMIN") {
            router.push("/dashboard");
            return;
        }

        fetchPlans();
    }, [session, status, router]);

    const fetchPlans = async () => {
        try {
            const res = await fetch("/api/admin/plans");
            const data = await res.json();
            setPlans(data);
        } catch (error) {
            console.error("Error fetching plans:", error);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingPlan(null);
        setFormData({
            name: "",
            description: "",
            features: "",
            price: 0,
            interval: "monthly",
            maxCourses: null,
            maxTeachers: null,
            maxStudents: null,
            maxBranches: null,
            maxInventoryItems: null
        });
        setShowModal(true);
    };

    const openEditModal = (plan: Plan) => {
        setEditingPlan(plan);
        setFormData({
            name: plan.name,
            description: plan.description || "",
            features: plan.features || "",
            price: plan.price,
            interval: plan.interval,
            maxCourses: plan.maxCourses,
            maxTeachers: plan.maxTeachers,
            maxStudents: plan.maxStudents,
            maxBranches: plan.maxBranches,
            maxInventoryItems: plan.maxInventoryItems
        });
        setShowModal(true);
    };

    const handleSavePlan = async () => {
        try {
            const url = editingPlan
                ? `/api/admin/plans/${editingPlan.id}`
                : "/api/admin/plans";
            const method = editingPlan ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                alert(editingPlan ? "Plan actualizado" : "Plan creado");
                setShowModal(false);
                fetchPlans();
            } else {
                alert("Error al guardar plan");
            }
        } catch (error) {
            console.error("Error saving plan:", error);
            alert("Error al guardar plan");
        }
    };

    const handleDeletePlan = async (planId: string) => {
        if (!confirm("¿Estás seguro de que deseas eliminar este plan?")) return;

        try {
            const res = await fetch(`/api/admin/plans/${planId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                alert("Plan eliminado");
                fetchPlans();
            } else {
                const data = await res.json();
                alert(data.error || "Error al eliminar plan");
            }
        } catch (error) {
            console.error("Error deleting plan:", error);
            alert("Error al eliminar plan");
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
            {/* HEADER */}
            <div style={{ padding: '32px', marginBottom: '48px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: '36px', fontWeight: 'bold', letterSpacing: '-0.025em', color: '#111827', marginBottom: '12px' }}>
                            Gestión de Planes
                        </h1>
                        <p style={{ color: '#6B7280', fontSize: '18px' }}>
                            Administra los planes de subscripción y sus características
                        </p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 24px',
                            borderRadius: '12px',
                            background: 'linear-gradient(to right, #10B981, #059669)',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.3)';
                        }}
                    >
                        <Plus size={18} />
                        Nuevo Plan
                    </button>
                </div>
            </div>

            {/* GRID DE PLANES */}
            <section style={{ padding: '0 var(--spacing-lg)' }} className="pb-8">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
                    {plans.map((plan, index) => {
                        const colors = [
                            { bg: '#DBEAFE', accent: '#2563EB', ring: '#93C5FD' },
                            { bg: '#EDE9FE', accent: '#7C3AED', ring: '#C4B5FD' },
                            { bg: '#FFEDD5', accent: '#EA580C', ring: '#FED7AA' }
                        ];
                        const color = colors[index % 3];
                        const featuresList = plan.features ? plan.features.split('\n') : [];

                        return (
                            <div
                                key={plan.id}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: '24px',
                                    padding: '32px',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                                    border: `2px solid ${color.ring}`,
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                {/* Icono y nombre */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
                                    <div
                                        style={{
                                            width: '64px',
                                            height: '64px',
                                            borderRadius: '16px',
                                            backgroundColor: color.bg,
                                            color: color.accent,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <CreditCard size={32} />
                                    </div>
                                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: color.accent }}>
                                        ${plan.price} <span style={{ fontSize: '20px' }}>MXN</span>
                                        <span style={{ fontSize: '16px', color: '#64748B', fontWeight: 'normal' }}>
                                            /{plan.interval === 'monthly' ? 'mo' : 'yr'}
                                        </span>
                                    </div>
                                </div>

                                <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1E293B', marginBottom: '8px' }}>
                                    {plan.name}
                                </h3>
                                <p style={{ color: '#64748B', fontSize: '15px', marginBottom: '24px', lineHeight: '1.5' }}>
                                    {plan.description || "Sin descripción"}
                                </p>

                                {/* Features List */}
                                <div style={{ flex: 1, marginBottom: '24px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '12px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                        Características
                                    </div>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {featuresList.map((feature, i) => (
                                            <li key={i} style={{ display: 'flex', alignItems: 'start', gap: '10px', fontSize: '15px', color: '#475569' }}>
                                                <div style={{ minWidth: '20px', color: color.accent, paddingTop: '2px' }}>
                                                    <Check size={16} strokeWidth={3} />
                                                </div>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Estadísticas */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748B', marginBottom: '24px', padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '12px' }}>
                                    <Users size={16} />
                                    <span>{plan._count?.businesses || 0} negocios activos</span>
                                </div>

                                {/* Botones de acción */}
                                <div style={{ display: 'flex', gap: '12px', paddingTop: '20px', borderTop: '1px solid #E2E8F0' }}>
                                    <button
                                        onClick={() => openEditModal(plan)}
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            borderRadius: '12px',
                                            backgroundColor: color.bg,
                                            color: color.accent,
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '15px',
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            transition: 'opacity 0.2s'
                                        }}
                                    >
                                        <Edit size={18} />
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDeletePlan(plan.id)}
                                        style={{
                                            padding: '12px 16px',
                                            borderRadius: '12px',
                                            backgroundColor: '#FEE2E2',
                                            color: '#DC2626',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '15px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* MODAL DE CREAR/EDITAR PLAN */}
            {showModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 50,
                        padding: '16px',
                        backdropFilter: 'blur(4px)'
                    }}
                    onClick={() => setShowModal(false)}
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '24px',
                            padding: '40px',
                            maxWidth: '900px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0F172A' }}>
                                {editingPlan ? 'Editar Plan' : 'Crear Nuevo Plan'}
                            </h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '8px', borderRadius: '50%' }}>
                                <X size={28} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                            {/* Columna Izquierda - Info General */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#334155', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                                    Información General
                                </h3>

                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#64748B', marginBottom: '8px' }}>
                                        Nombre del Plan
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        style={{ width: '100%', padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '15px' }}
                                        placeholder="ej: Enterprise"
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#64748B', marginBottom: '8px' }}>
                                            Precio (MXN)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                            style={{ width: '100%', padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '15px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#64748B', marginBottom: '8px' }}>
                                            Intervalo
                                        </label>
                                        <select
                                            value={formData.interval}
                                            onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
                                            style={{ width: '100%', padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '15px', backgroundColor: 'white' }}
                                        >
                                            <option value="monthly">Mensual</option>
                                            <option value="yearly">Anual</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#64748B', marginBottom: '8px' }}>
                                        Descripción Corta
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        style={{ width: '100%', padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '15px' }}
                                        placeholder="ej: Ideal para grandes empresas"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#64748B', marginBottom: '8px' }}>
                                        Características (una por línea)
                                    </label>
                                    <textarea
                                        value={formData.features}
                                        onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                                        style={{ width: '100%', padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '15px', minHeight: '150px' }}
                                        placeholder="Multi-sucursal&#10;API pública&#10;Soporte 24/7"
                                    />
                                </div>
                            </div>

                            {/* Columna Derecha - Límites */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#334155', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                                    Límites Técnicos (Dejar vacío para ilimitado)
                                </h3>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#64748B', marginBottom: '8px' }}>
                                            Máx. Cursos
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.maxCourses || ""}
                                            onChange={(e) => setFormData({ ...formData, maxCourses: e.target.value ? Number(e.target.value) : null })}
                                            style={{ width: '100%', padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '15px' }}
                                            placeholder="∞"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#64748B', marginBottom: '8px' }}>
                                            Máx. Maestros
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.maxTeachers || ""}
                                            onChange={(e) => setFormData({ ...formData, maxTeachers: e.target.value ? Number(e.target.value) : null })}
                                            style={{ width: '100%', padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '15px' }}
                                            placeholder="∞"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#64748B', marginBottom: '8px' }}>
                                            Máx. Alumnos
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.maxStudents || ""}
                                            onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value ? Number(e.target.value) : null })}
                                            style={{ width: '100%', padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '15px' }}
                                            placeholder="∞"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#64748B', marginBottom: '8px' }}>
                                            Máx. Sucursales
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.maxBranches || ""}
                                            onChange={(e) => setFormData({ ...formData, maxBranches: e.target.value ? Number(e.target.value) : null })}
                                            style={{ width: '100%', padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '15px' }}
                                            placeholder="∞"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#64748B', marginBottom: '8px' }}>
                                            Máx. Items Inventario
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.maxInventoryItems || ""}
                                            onChange={(e) => setFormData({ ...formData, maxInventoryItems: e.target.value ? Number(e.target.value) : null })}
                                            style={{ width: '100%', padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '15px' }}
                                            placeholder="∞"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #E2E8F0' }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    flex: 1,
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: '1px solid #E2E8F0',
                                    backgroundColor: 'white',
                                    color: '#64748B',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSavePlan}
                                style={{
                                    flex: 2,
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: 'linear-gradient(to right, #2563EB, #1D4ED8)',
                                    color: 'white',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {editingPlan ? 'Guardar Cambios' : 'Crear Plan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
