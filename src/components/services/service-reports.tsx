"use client";

import { useState, useEffect } from "react";
import { Calendar, TrendingUp, DollarSign, Users, Clock, CheckCircle, XCircle, BarChart3, User } from "lucide-react";

interface ReportData {
    period: string;
    summary: {
        totalAppointments: number;
        completedAppointments: number;
        cancelledAppointments: number;
        completionRate: number;
        totalRevenue: number;
        avgPerDay: number;
    };
    byService: { name: string; count: number; completed: number; revenue: number; color: string }[];
    byEmployee: { name: string; count: number; completed: number; revenue: number }[];
    daily: { date: string; count: number; revenue: number }[];
}

export function ServiceReports() {
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("month");

    useEffect(() => {
        fetchData();
    }, [period]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/services/reports?period=${period}`);
            const json = await res.json();
            if (!json.error) setData(json);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>;
    }

    const kpis = [
        { label: "Total Citas", value: data?.summary.totalAppointments || 0, icon: Calendar, color: "#3B82F6", bg: "#EFF6FF" },
        { label: "Completadas", value: data?.summary.completedAppointments || 0, icon: CheckCircle, color: "#10B981", bg: "#D1FAE5" },
        { label: "Canceladas", value: data?.summary.cancelledAppointments || 0, icon: XCircle, color: "#EF4444", bg: "#FEE2E2" },
        { label: "Tasa de Éxito", value: `${data?.summary.completionRate || 0}%`, icon: TrendingUp, color: "#8B5CF6", bg: "#EDE9FE" },
        { label: "Ingresos", value: `$${(data?.summary.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: "#F59E0B", bg: "#FEF3C7" },
        { label: "Promedio/Día", value: data?.summary.avgPerDay || 0, icon: BarChart3, color: "#06B6D4", bg: "#CFFAFE" },
    ];

    const maxServiceRevenue = Math.max(...(data?.byService.map(s => s.revenue) || [1]));
    const maxEmployeeRevenue = Math.max(...(data?.byEmployee.map(e => e.revenue) || [1]));

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A' }}>Reportes y Estadísticas</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                        { key: "week", label: "Semana" },
                        { key: "month", label: "Mes" },
                        { key: "year", label: "Año" }
                    ].map(p => (
                        <button key={p.key} onClick={() => setPeriod(p.key)}
                            style={{ padding: '10px 20px', borderRadius: '10px', backgroundColor: period === p.key ? '#3B82F6' : '#F1F5F9', color: period === p.key ? 'white' : '#64748B', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {kpis.map((kpi, idx) => {
                    const Icon = kpi.icon;
                    return (
                        <div key={idx} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon size={20} color={kpi.color} />
                                </div>
                            </div>
                            <div style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{kpi.value}</div>
                            <div style={{ fontSize: '13px', color: '#64748B' }}>{kpi.label}</div>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                {/* By Service */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart3 size={20} color="#3B82F6" /> Por Servicio
                    </h3>
                    {data?.byService && data.byService.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {data.byService.map((service, idx) => (
                                <div key={idx}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: service.color }} />
                                            <span style={{ fontWeight: 600, color: '#0F172A' }}>{service.name}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
                                            <span style={{ color: '#64748B' }}>{service.count} citas</span>
                                            <span style={{ fontWeight: 700, color: '#059669' }}>${service.revenue.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div style={{ height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${(service.revenue / maxServiceRevenue) * 100}%`, height: '100%', backgroundColor: service.color, borderRadius: '4px' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: '#64748B', textAlign: 'center', padding: '24px' }}>Sin datos</p>
                    )}
                </div>

                {/* By Employee */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={20} color="#8B5CF6" /> Por Empleado
                    </h3>
                    {data?.byEmployee && data.byEmployee.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {data.byEmployee.map((emp, idx) => (
                                <div key={idx}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg, #8B5CF6, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: '12px' }}>
                                                {emp.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <span style={{ fontWeight: 600, color: '#0F172A' }}>{emp.name}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
                                            <span style={{ color: '#64748B' }}>{emp.count} citas</span>
                                            <span style={{ fontWeight: 700, color: '#059669' }}>${emp.revenue.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div style={{ height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${(emp.revenue / maxEmployeeRevenue) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #8B5CF6, #6366F1)', borderRadius: '4px' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: '#64748B', textAlign: 'center', padding: '24px' }}>Sin datos</p>
                    )}
                </div>
            </div>

            {/* Daily Chart */}
            {data?.daily && data.daily.length > 0 && (
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', marginTop: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={20} color="#10B981" /> Actividad Diaria
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '120px', overflowX: 'auto', paddingBottom: '24px' }}>
                        {data.daily.slice(-30).map((day, idx) => {
                            const maxCount = Math.max(...data.daily.map(d => d.count));
                            const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                            return (
                                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '24px' }}>
                                    <div style={{ width: '20px', height: `${height}px`, minHeight: '4px', backgroundColor: '#3B82F6', borderRadius: '4px 4px 0 0', transition: 'height 0.3s' }} title={`${day.date}: ${day.count} citas, $${day.revenue}`} />
                                    <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px', transform: 'rotate(-45deg)', transformOrigin: 'top left', whiteSpace: 'nowrap' }}>
                                        {new Date(day.date).getDate()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
