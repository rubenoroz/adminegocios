"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useRouter } from "next/navigation";
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Radar, RadarChart,
    PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from "recharts";
import {
    GripVertical, Settings, TrendingUp, Users, DollarSign, BookOpen,
    Calendar, Eye, EyeOff, CreditCard, GraduationCap, UserCheck, Lock, RotateCcw
} from "lucide-react";

// Premium color palette with better contrast
const COLORS = {
    rose: { primary: "#e11d48", secondary: "#fda4af", bg: "linear-gradient(135deg, #1f1218 0%, #4c1d3b 100%)" },
    violet: { primary: "#8b5cf6", secondary: "#c4b5fd", bg: "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)" },
    emerald: { primary: "#10b981", secondary: "#6ee7b7", bg: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)" },
    amber: { primary: "#f59e0b", secondary: "#fcd34d", bg: "linear-gradient(135deg, #451a03 0%, #78350f 100%)" },
    sky: { primary: "#0ea5e9", secondary: "#7dd3fc", bg: "linear-gradient(135deg, #0c4a6e 0%, #075985 100%)" },
    cyan: { primary: "#06b6d4", secondary: "#67e8f9", bg: "linear-gradient(135deg, #164e63 0%, #155e75 100%)" },
    teal: { primary: "#14b8a6", secondary: "#5eead4", bg: "linear-gradient(135deg, #134e4a 0%, #115e59 100%)" },
    indigo: { primary: "#6366f1", secondary: "#a5b4fc", bg: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)" },
};

interface Widget {
    id: string;
    title: string;
    type: "chart" | "metric";
    chartType?: "area" | "bar" | "line" | "pie" | "radar";
    visible: boolean;
    colorKey: keyof typeof COLORS;
    icon: any;
    colors?: { [key: string]: string };
    data?: any[];
}

const defaultWidgetsStructure: Widget[] = [
    {
        id: "payments",
        title: "Estado de Pagos",
        type: "chart",
        chartType: "pie",
        visible: true,
        colorKey: "rose",
        icon: CreditCard,
    },
    {
        id: "courses",
        title: "Distribución de Cursos",
        type: "chart",
        chartType: "pie",
        visible: true,
        colorKey: "violet",
        icon: BookOpen
    },
    {
        id: "enrollment",
        title: "Crecimiento de Alumnos",
        type: "chart",
        chartType: "line",
        visible: true,
        colorKey: "emerald",
        icon: GraduationCap
    },
    {
        id: "attendance",
        title: "Asistencia Semanal",
        type: "chart",
        chartType: "bar",
        visible: true,
        colorKey: "amber",
        icon: UserCheck
    },
    {
        id: "revenue",
        title: "Ingresos vs Gastos",
        type: "chart",
        chartType: "area",
        visible: true,
        colorKey: "sky",
        icon: DollarSign,
        colors: { ingresos: "#38bdf8", gastos: "#f87171" }
    },
    {
        id: "teachers",
        title: "Rendimiento Profesores",
        type: "chart",
        chartType: "radar",
        visible: true,
        colorKey: "cyan",
        icon: Users
    },
    {
        id: "revenue-trend",
        title: "Tendencia de Ingresos",
        type: "chart",
        chartType: "area",
        visible: true,
        colorKey: "teal",
        icon: TrendingUp,
        colors: { ingresos: "#2dd4bf", gastos: "#fb923c" }
    },
    {
        id: "metrics",
        title: "Métricas Rápidas",
        type: "metric",
        visible: true,
        colorKey: "indigo",
        icon: Calendar
    },
];

export default function ExecutiveDashboard() {
    const [widgets, setWidgets] = useState<Widget[]>(defaultWidgetsStructure);
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch("/api/dashboard/executive/stats");

            if (res.status === 403) {
                setError("FORBIDDEN");
                setLoading(false);
                return;
            }

            if (!res.ok) throw new Error("Error fetching stats");

            const data = await res.json();
            setMetrics(data.metrics);

            const savedConfig = localStorage.getItem('dashboard-executive-config-v2');
            let baseWidgets = defaultWidgetsStructure;

            if (savedConfig) {
                try {
                    const parsed = JSON.parse(savedConfig);
                    baseWidgets = parsed.map((savedW: Widget) => {
                        const defaultW = defaultWidgetsStructure.find(dw => dw.id === savedW.id);
                        return {
                            ...savedW,
                            icon: defaultW?.icon || Calendar,
                            colorKey: defaultW?.colorKey || savedW.colorKey,
                        };
                    });
                } catch (e) {
                    console.error("Error parsing saved config", e);
                }
            }

            const populatedWidgets = baseWidgets.map(w => {
                let widgetData: any[] = [];
                switch (w.id) {
                    case "payments": widgetData = data.paymentStatus; break;
                    case "courses": widgetData = data.courseDistribution; break;
                    case "enrollment": widgetData = data.enrollmentData; break;
                    case "attendance": widgetData = data.attendanceData; break;
                    case "revenue": widgetData = data.revenueData; break;
                    case "revenue-trend": widgetData = data.revenueData; break;
                    case "teachers": widgetData = data.teacherPerformance; break;
                }
                return { ...w, data: widgetData };
            });

            setWidgets(populatedWidgets);

        } catch (err) {
            console.error(err);
            setError("ERROR");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!loading && !error) {
            const configToSave = widgets.map(({ data, ...rest }) => rest);
            localStorage.setItem('dashboard-executive-config-v2', JSON.stringify(configToSave));
        }
    }, [widgets, loading, error]);

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const items = Array.from(widgets);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setWidgets(items);
    };

    const toggleWidgetVisibility = (id: string) => {
        setWidgets(widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
    };

    const resetConfiguration = () => {
        if (confirm('¿Restaurar configuración por defecto?')) {
            localStorage.removeItem('dashboard-executive-config-v2');
            fetchData();
        }
    };

    const updateChartType = (id: string, chartType: any) => {
        setWidgets(widgets.map(w => w.id === id ? { ...w, chartType } : w));
    };

    // Premium Chart Renderer
    const renderChart = (widget: Widget) => {
        const palette = COLORS[widget.colorKey];
        const chartColors = [palette.primary, palette.secondary, "#f472b6", "#a78bfa", "#fbbf24"];
        const seriesColors = widget.colors || {};

        const dataKeys = widget.data && widget.data.length > 0
            ? Object.keys(widget.data[0]).filter(key =>
                !['label', 'month', 'day', 'name', 'subject', 'date'].includes(key)
            )
            : [];

        const commonGrid = <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />;
        const commonXAxis = <XAxis
            dataKey={widget.data?.[0]?.month ? "month" : widget.data?.[0]?.day ? "day" : "name"}
            stroke="rgba(255,255,255,0.6)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dy={8}
        />;
        const commonYAxis = <YAxis
            stroke="rgba(255,255,255,0.6)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={40}
        />;
        const commonTooltip = <Tooltip
            contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                padding: '12px 16px',
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                color: '#fff',
            }}
            itemStyle={{ color: '#e2e8f0' }}
            labelStyle={{ color: '#fff', fontWeight: 600, marginBottom: 4 }}
        />;

        if (!widget.data || widget.data.length === 0) {
            return (
                <div className="flex items-center justify-center h-[260px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <p className="text-sm font-medium">Sin datos disponibles</p>
                </div>
            );
        }

        switch (widget.chartType) {
            case "area":
                return (
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={widget.data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <defs>
                                {dataKeys.map((key, i) => (
                                    <linearGradient key={key} id={`gradient-${widget.id}-${key}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={seriesColors[key] || chartColors[i % chartColors.length]} stopOpacity={0.5} />
                                        <stop offset="100%" stopColor={seriesColors[key] || chartColors[i % chartColors.length]} stopOpacity={0.05} />
                                    </linearGradient>
                                ))}
                            </defs>
                            {commonGrid}
                            {commonXAxis}
                            {commonYAxis}
                            {commonTooltip}
                            {dataKeys.map((key, index) => (
                                <Area
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={seriesColors[key] || chartColors[index % chartColors.length]}
                                    fill={`url(#gradient-${widget.id}-${key})`}
                                    strokeWidth={3}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                );
            case "line":
                return (
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={widget.data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            {commonGrid}
                            {commonXAxis}
                            {commonYAxis}
                            {commonTooltip}
                            {dataKeys.map((key, index) => (
                                <Line
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={seriesColors[key] || chartColors[index % chartColors.length]}
                                    strokeWidth={3}
                                    dot={{ r: 5, fill: palette.primary, strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 7, strokeWidth: 0, fill: palette.secondary }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                );
            case "bar":
                return (
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={widget.data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            {commonGrid}
                            {commonXAxis}
                            {commonYAxis}
                            {commonTooltip}
                            {dataKeys.map((key, index) => (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    fill={seriesColors[key] || chartColors[index % chartColors.length]}
                                    radius={[8, 8, 0, 0]}
                                    maxBarSize={50}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );
            case "pie":
                return (
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie
                                data={widget.data}
                                cx="50%" cy="50%"
                                innerRadius={55}
                                outerRadius={90}
                                paddingAngle={4}
                                dataKey="value"
                                stroke="none"
                            >
                                {widget.data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color || chartColors[index % chartColors.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    color: '#fff',
                                }}
                            />
                            <Legend
                                formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                );
            case "radar":
                return (
                    <ResponsiveContainer width="100%" height={260}>
                        <RadarChart data={widget.data} cx="50%" cy="50%" outerRadius="75%">
                            <PolarGrid stroke="rgba(255,255,255,0.15)" />
                            <PolarAngleAxis dataKey="subject" stroke="rgba(255,255,255,0.7)" fontSize={11} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.3)" />
                            <Radar
                                name="Score"
                                dataKey="score"
                                stroke={palette.primary}
                                fill={palette.primary}
                                fillOpacity={0.5}
                                strokeWidth={2}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    color: '#fff'
                                }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                );
            default: return null;
        }
    };

    // Premium Widget Card
    const WidgetCard = ({ widget, isDragging = false, showGrip = false }: { widget: Widget; isDragging?: boolean; showGrip?: boolean }) => {
        const Icon = widget.icon;
        const palette = COLORS[widget.colorKey];

        return (
            <div
                className={`${isDragging ? 'opacity-70 scale-105' : ''}`}
                style={{
                    background: palette.bg,
                    borderRadius: '24px',
                    padding: '28px',
                    height: '100%',
                    minHeight: widget.type === "metric" ? 'auto' : '380px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255,255,255,0.1) inset',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 30px 60px -15px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255,255,255,0.15) inset';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255,255,255,0.1) inset';
                }}
            >
                {/* Decorative gradient orb */}
                <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-30%',
                    width: '300px',
                    height: '300px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${palette.primary}40 0%, transparent 70%)`,
                    pointerEvents: 'none',
                }} />

                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                        {showGrip && <GripVertical size={20} style={{ color: 'rgba(255,255,255,0.5)' }} className="cursor-grab" />}
                        <div
                            style={{
                                padding: '12px',
                                borderRadius: '16px',
                                background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.secondary} 100%)`,
                                boxShadow: `0 8px 16px ${palette.primary}50`,
                            }}
                        >
                            <Icon size={22} color="#fff" />
                        </div>
                        <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                            {widget.title}
                        </h3>
                    </div>
                    {showGrip && widget.type === "chart" && (
                        <select
                            value={widget.chartType}
                            onChange={(e) => updateChartType(widget.id, e.target.value)}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '10px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#fff',
                                cursor: 'pointer',
                                outline: 'none',
                            }}
                        >
                            <option value="area" style={{ background: '#1e293b' }}>Área</option>
                            <option value="line" style={{ background: '#1e293b' }}>Línea</option>
                            <option value="bar" style={{ background: '#1e293b' }}>Barras</option>
                            <option value="pie" style={{ background: '#1e293b' }}>Pastel</option>
                            <option value="radar" style={{ background: '#1e293b' }}>Radar</option>
                        </select>
                    )}
                </div>

                <div className="relative z-10">
                    {widget.type === "chart" ? renderChart(widget) : (
                        <div className="grid grid-cols-2 gap-5">
                            {[
                                { label: "Alumnos", value: metrics?.students || 0, icon: Users, color: "#3b82f6" },
                                { label: "Cursos", value: metrics?.courses || 0, icon: BookOpen, color: "#10b981" },
                                { label: "Ingresos", value: `$${metrics?.revenue?.toLocaleString() || 0}`, icon: DollarSign, color: "#f59e0b" },
                                { label: "Asistencia", value: `${metrics?.attendance || 0}%`, icon: Calendar, color: "#8b5cf6" },
                            ].map((m, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        background: 'rgba(255,255,255,0.08)',
                                        backdropFilter: 'blur(10px)',
                                        padding: '20px',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                                        e.currentTarget.style.transform = 'scale(1.02)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <m.icon size={14} style={{ color: m.color }} />
                                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {m.label}
                                        </span>
                                    </div>
                                    <div style={{ color: '#fff', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                                        {m.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Forbidden State
    if (error === "FORBIDDEN") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-8">
                <div
                    style={{
                        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                        padding: '24px',
                        borderRadius: '24px',
                        marginBottom: '24px',
                    }}
                >
                    <Lock size={48} style={{ color: '#dc2626' }} />
                </div>
                <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
                    Acceso Restringido
                </h2>
                <p style={{ color: '#64748b', maxWidth: '400px', textAlign: 'center', marginBottom: '32px', fontSize: '16px' }}>
                    Esta sección contiene información sensible y solo está disponible para los propietarios del negocio.
                </p>
                <button
                    onClick={() => router.push("/dashboard")}
                    style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: '#fff',
                        padding: '14px 32px',
                        borderRadius: '14px',
                        border: 'none',
                        fontSize: '15px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(59, 130, 246, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(59, 130, 246, 0.5)';
                    }}
                >
                    Volver al Dashboard
                </button>
            </div>
        );
    }

    // Loading State
    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-5">
                    <div
                        style={{
                            width: '56px',
                            height: '56px',
                            border: '4px solid #e2e8f0',
                            borderTopColor: '#6366f1',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                        }}
                    />
                    <p style={{ color: '#64748b', fontSize: '15px', fontWeight: 600 }}>Cargando métricas ejecutivas...</p>
                </div>
                <style jsx>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    const visibleWidgets = widgets.filter(w => w.visible);

    return (
        <div style={{ padding: '8px', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                marginBottom: '40px',
                paddingBottom: '24px',
                borderBottom: '1px solid #e2e8f0',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 style={{
                            fontSize: '32px',
                            fontWeight: 800,
                            color: '#0f172a',
                            letterSpacing: '-0.03em',
                            marginBottom: '8px',
                        }}>
                            Dashboard Ejecutivo
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '16px', fontWeight: 500 }}>
                            Visión estratégica en tiempo real para la toma de decisiones.
                        </p>
                    </div>
                    <button
                        onClick={() => setEditMode(!editMode)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 24px',
                            borderRadius: '14px',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            background: editMode
                                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            color: '#fff',
                            boxShadow: editMode
                                ? '0 10px 25px -5px rgba(16, 185, 129, 0.5)'
                                : '0 10px 25px -5px rgba(99, 102, 241, 0.5)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <Settings size={18} />
                        {editMode ? "Guardar Diseño" : "Personalizar Vista"}
                    </button>
                </div>
            </div>

            {/* Edit Mode Panel */}
            {editMode && (
                <div
                    style={{
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                        borderRadius: '20px',
                        padding: '24px',
                        marginBottom: '32px',
                        border: '2px dashed #cbd5e1',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#334155' }}>Widgets Disponibles</h3>
                        <button
                            onClick={resetConfiguration}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                                color: '#dc2626',
                                fontSize: '13px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)';
                            }}
                        >
                            <RotateCcw size={14} />
                            Restaurar
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {widgets.map(widget => {
                            const palette = COLORS[widget.colorKey];
                            return (
                                <button
                                    key={widget.id}
                                    onClick={() => toggleWidgetVisibility(widget.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '10px 18px',
                                        borderRadius: '12px',
                                        border: widget.visible ? 'none' : '2px solid #e2e8f0',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        background: widget.visible
                                            ? `linear-gradient(135deg, ${palette.primary} 0%, ${palette.primary}dd 100%)`
                                            : '#fff',
                                        color: widget.visible ? '#fff' : '#64748b',
                                        boxShadow: widget.visible ? `0 8px 16px ${palette.primary}40` : 'none',
                                    }}
                                >
                                    {widget.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                                    {widget.title}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Content Grid */}
            {editMode ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="widgets">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))',
                                    gap: '28px',
                                    paddingBottom: '48px',
                                }}
                            >
                                {visibleWidgets.map((widget, index) => (
                                    <Draggable key={widget.id} draggableId={widget.id} index={index}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                style={{ ...provided.draggableProps.style }}
                                            >
                                                <WidgetCard widget={widget} isDragging={snapshot.isDragging} showGrip={true} />
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            ) : (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))',
                        gap: '28px',
                        paddingBottom: '48px',
                    }}
                >
                    {visibleWidgets.map(widget => (
                        <WidgetCard key={widget.id} widget={widget} />
                    ))}
                </div>
            )}
        </div>
    );
}
