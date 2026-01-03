"use client";

import { useEffect, useState } from "react";
import { Check, CreditCard, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Plan {
    id: string;
    name: string;
    description: string;
    features: string;
    price: number;
    interval: string;
}

export function PricingSection() {
    const params = useParams();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await fetch("/api/plans");
                if (res.ok) {
                    const data = await res.json();
                    setPlans(data);
                }
            } catch (error) {
                console.error("Error loading plans:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPlans();
    }, []);

    if (loading) {
        return (
            <div className="py-24 flex justify-center bg-[#0a0f0d]">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
        );
    }

    if (plans.length === 0) return null;

    return (
        <section className="py-24 bg-[#0a0f0d] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/05 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/05 rounded-full blur-[120px]" />
            </div>

            <div className="w-full px-4 relative z-10">
                <div className="text-center mb-32">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                        Planes Simples y Transparentes
                    </h2>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Empieza con el plan que necesitas hoy y crece a tu ritmo.
                    </p>
                </div>

                {/* Grid container - Force 4 columns using min-width and scroll if needed */}
                <div className="overflow-x-auto pb-4 -mx-4 px-4">
                    <div className="grid grid-cols-4 gap-4 min-w-[1200px]">
                        {plans.map((plan, index) => {
                            // Color palette matching Admin Panel
                            const colors = [
                                { bg: '#DBEAFE', accent: '#2563EB', ring: '#93C5FD', button: 'linear-gradient(to right, #2563EB, #1D4ED8)' }, // Blue
                                { bg: '#EDE9FE', accent: '#7C3AED', ring: '#C4B5FD', button: 'linear-gradient(to right, #7C3AED, #6D28D9)' }, // Purple
                                { bg: '#FFEDD5', accent: '#EA580C', ring: '#FED7AA', button: 'linear-gradient(to right, #EA580C, #C2410C)' }, // Orange
                                { bg: '#E0F2FE', accent: '#0284C7', ring: '#7DD3FC', button: 'linear-gradient(to right, #0284C7, #0369A1)' }, // Sky
                            ];
                            const color = colors[index % colors.length];

                            return (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="h-full"
                                >
                                    <div
                                        style={{
                                            backgroundColor: 'white',
                                            borderRadius: '24px',
                                            padding: '24px',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            border: `2px solid ${color.ring}`,
                                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                                        }}
                                    >
                                        {/* Icon & Price Header */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
                                            <div
                                                style={{
                                                    width: '56px',
                                                    height: '56px',
                                                    borderRadius: '16px',
                                                    backgroundColor: color.bg,
                                                    color: color.accent,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0
                                                }}
                                            >
                                                <CreditCard size={28} />
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: color.accent, lineHeight: 1 }}>
                                                    ${plan.price}
                                                </div>
                                                <div style={{ fontSize: '14px', color: '#64748B', fontWeight: 500, marginTop: '4px' }}>
                                                    MXN / {plan.interval === 'monthly' ? 'mes' : 'año'}
                                                </div>
                                            </div>
                                        </div>

                                        <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1E293B', marginBottom: '8px' }}>
                                            {plan.name}
                                        </h3>
                                        <p style={{ color: '#64748B', fontSize: '15px', marginBottom: '24px', lineHeight: '1.5', minHeight: '45px' }}>
                                            {plan.description || "Sin descripción"}
                                        </p>

                                        {/* Divider */}
                                        <div style={{ height: '1px', backgroundColor: '#E2E8F0', width: '100%', marginBottom: '24px' }} />

                                        {/* Features List */}
                                        <div style={{ flex: 1, marginBottom: '32px' }}>
                                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', marginBottom: '16px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                                CARACTERÍSTICAS
                                            </div>
                                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {plan.features?.split('\n').map((feature, i) => (
                                                    <li key={i} style={{ display: 'flex', alignItems: 'start', gap: '10px', fontSize: '14px', color: '#475569', lineHeight: '1.4' }}>
                                                        <div style={{ minWidth: '18px', color: color.accent, paddingTop: '1px' }}>
                                                            <Check size={16} strokeWidth={3} />
                                                        </div>
                                                        {feature}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* CTA Button */}
                                        <Link
                                            href={`/${params.lang}/register?plan=${plan.id}`}
                                            style={{ textDecoration: 'none', width: '100%' }}
                                        >
                                            <button
                                                style={{
                                                    width: '100%',
                                                    padding: '14px',
                                                    borderRadius: '12px',
                                                    background: color.button,
                                                    color: 'white',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '15px',
                                                    fontWeight: 700,
                                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                                                }}
                                            >
                                                Elegir {plan.name}
                                            </button>
                                        </Link>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
