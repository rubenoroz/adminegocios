"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis
} from "recharts";
import {
    GripVertical,
    Settings,
    TrendingUp,
    Users,
    DollarSign,
    BookOpen,
    Calendar,
    Eye,
    EyeOff,
    CreditCard,
    GraduationCap,
    UserCheck
} from "lucide-react";

// Sample data
const revenueData = [
    { month: "Ene", ingresos: 42000, gastos: 28000 },
    { month: "Feb", ingresos: 45000, gastos: 30000 },
    { month: "Mar", ingresos: 48000, gastos: 29000 },
    { month: "Abr", ingresos: 51000, gastos: 31000 },
    { month: "May", ingresos: 49000, gastos: 30500 },
    { month: "Jun", ingresos: 53000, gastos: 32000 },
];

const enrollmentData = [
    { month: "Ene", alumnos: 220 },
    { month: "Feb", alumnos: 225 },
    { month: "Mar", alumnos: 230 },
    { month: "Abr", alumnos: 235 },
    { month: "May", alumnos: 240 },
    { month: "Jun", alumnos: 245 },
];

const courseDistribution = [
    { name: "Matemáticas", value: 45 },
    { name: "Español", value: 38 },
    { name: "Ciencias", value: 32 },
    { name: "Historia", value: 28 },
    { name: "Inglés", value: 35 },
];

const attendanceData = [
    { day: "Lun", asistencia: 95 },
    { day: "Mar", asistencia: 94 },
    { day: "Mié", asistencia: 96 },
    { day: "Jue", asistencia: 93 },
    { day: "Vie", asistencia: 92 },
];

const paymentStatus = [
    { name: "Pagados", value: 180 },
    { name: "Pendientes", value: 45 },
    { name: "Vencidos", value: 20 },
];

const teacherPerformance = [
    { subject: "Mat", score: 85 },
    { subject: "Esp", score: 90 },
    { subject: "Cie", score: 88 },
    { subject: "His", score: 82 },
    { subject: "Ing", score: 87 },
];

const monthlyGrowth = [
    { month: "Ene", crecimiento: 5 },
    { month: "Feb", crecimiento: 8 },
    { month: "Mar", crecimiento: 12 },
    { month: "Abr", crecimiento: 10 },
    { month: "May", crecimiento: 15 },
    { month: "Jun", crecimiento: 18 },
];

interface Widget {
    id: string;
    title: string;
    type: "chart" | "metric";
    chartType?: "area" | "bar" | "line" | "pie" | "radar";
    visible: boolean;
    color: string;
    bgGradient: string;
    icon: any;
    colors?: { [key: string]: string };
    data?: any[];
}

const defaultWidgets: Widget[] = [
    {
        id: "payments",
        title: "Estado de Pagos",
        type: "chart",
        chartType: "pie",
        visible: true,
        color: "#ef4444",
        bgGradient: "linear-gradient(135deg, rgba(254, 226, 226, 0.5) 0%, rgba(254, 202, 202, 0.5) 100%)",
        icon: CreditCard,
        data: paymentStatus
    },
    {
        id: "courses",
        title: "Distribución de Cursos",
        type: "chart",
        chartType: "pie",
        visible: true,
        color: "#8b5cf6",
        bgGradient: "linear-gradient(135deg, rgba(237, 233, 254, 0.5) 0%, rgba(221, 214, 254, 0.5) 100%)",
        icon: BookOpen,
        data: courseDistribution
    },
    {
        id: "enrollment",
        title: "Crecimiento de Alumnos",
        type: "chart",
        chartType: "line",
        visible: true,
        color: "#10b981",
        bgGradient: "linear-gradient(135deg, rgba(209, 250, 229, 0.5) 0%, rgba(167, 243, 208, 0.5) 100%)",
        icon: GraduationCap,
        data: enrollmentData
    },
    {
        id: "attendance",
        title: "Asistencia Semanal",
        type: "chart",
        chartType: "bar",
        visible: true,
        color: "#f59e0b",
        bgGradient: "linear-gradient(135deg, rgba(254, 243, 199, 0.5) 0%, rgba(253, 230, 138, 0.5) 100%)",
        icon: UserCheck,
        data: attendanceData
    },
    {
        id: "revenue",
        title: "Ingresos vs Gastos",
        type: "chart",
        chartType: "area",
        visible: true,
        color: "#3b82f6",
        bgGradient: "linear-gradient(135deg, rgba(219, 234, 254, 0.5) 0%, rgba(191, 219, 254, 0.5) 100%)",
        icon: DollarSign,
        colors: { ingresos: "#3b82f6", gastos: "#ef4444" },
        data: revenueData
    },
    {
        id: "teachers",
        title: "Rendimiento Profesores",
        type: "chart",
        chartType: "radar",
        visible: true,
        color: "#06b6d4",
        bgGradient: "linear-gradient(135deg, rgba(207, 250, 254, 0.5) 0%, rgba(165, 243, 252, 0.5) 100%)",
        icon: Users,
        data: teacherPerformance
    },
    {
        id: "revenue-trend",
        title: "Tendencia de Ingresos",
        type: "chart",
        chartType: "area",
        visible: true,
        color: "#14b8a6",
        bgGradient: "linear-gradient(135deg, rgba(204, 251, 241, 0.5) 0%, rgba(153, 246, 228, 0.5) 100%)",
        icon: TrendingUp,
        colors: { ingresos: "#14b8a6", gastos: "#f97316" },
        data: revenueData
    },
    {
        id: "metrics",
        title: "Métricas Rápidas",
        type: "metric",
        visible: true,
        color: "#f59e0b",
        bgGradient: "linear-gradient(135deg, rgba(226, 232, 240, 0.4) 0%, rgba(203, 213, 225, 0.4) 100%)",
        icon: Calendar
    },
];

export default function ExecutiveDashboard() {
    const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets);
    const [editMode, setEditMode] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const savedConfig = localStorage.getItem('dashboard-executive-config');
        if (savedConfig) {
            try {
                const parsed = JSON.parse(savedConfig);
                // Restaurar iconos desde defaultWidgets ya que no se serializan en JSON
                const restoredWidgets = parsed.map((widget: Widget) => {
                    const defaultWidget = defaultWidgets.find(dw => dw.id === widget.id);
                    return {
                        ...widget,
                        icon: defaultWidget?.icon || Calendar
                    };
                });
                setWidgets(restoredWidgets);
            } catch (error) {
                console.error('Error loading dashboard config:', error);
            }
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('dashboard-executive-config', JSON.stringify(widgets));
        }
    }, [widgets, isLoaded]);

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(widgets);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setWidgets(items);
    };

    const toggleWidgetVisibility = (id: string) => {
        setWidgets(widgets.map(w =>
            w.id === id ? { ...w, visible: !w.visible } : w
        ));
    };

    const resetConfiguration = () => {
        if (confirm('¿Estás seguro de que quieres restaurar la configuración por defecto?')) {
            setWidgets(defaultWidgets);
            localStorage.removeItem('dashboard-executive-config');
        }
    };

    const updateChartType = (id: string, chartType: "area" | "bar" | "line" | "pie" | "radar") => {
        setWidgets(widgets.map(w => {
            if (w.id === id) {
                let compatibleData = w.data;
                if (chartType === "radar" && (!w.data || !w.data[0]?.subject)) {
                    compatibleData = teacherPerformance;
                } else if (chartType === "pie") {
                    if (w.data && !w.data[0]?.name && w.data[0]?.label) {
                        compatibleData = w.data.map(item => ({
                            name: item.label || item.month || item.day || "Item",
                            value: item.value || item.asistencia || item.crecimiento || item.alumnos || 0
                        }));
                    }
                }
                return { ...w, chartType, data: compatibleData };
            }
            return w;
        }));
    };

    const renderChart = (widget: Widget) => {
        const colors = [widget.color, "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"];
        const seriesColors = widget.colors || {};
        const dataKeys = widget.data && widget.data.length > 0
            ? Object.keys(widget.data[0]).filter(key => key !== 'label' && key !== 'month' && key !== 'day' && key !== 'name' && key !== 'subject')
            : [];

        switch (widget.chartType) {
            case "area":
                return (
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={widget.data}>
                            <defs>
                                {dataKeys.map(key => (
                                    <linearGradient key={key} id={`gradient-${widget.id}-${key}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={seriesColors[key] || widget.color} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={seriesColors[key] || widget.color} stopOpacity={0} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey={widget.data && widget.data[0]?.month ? "month" : "name"} stroke="#6b7280" fontSize={12} />
                            <YAxis stroke="#6b7280" fontSize={12} />
                            <Tooltip />
                            {dataKeys.map((key, index) => (
                                <Area
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={seriesColors[key] || colors[index % colors.length]}
                                    fill={`url(#gradient-${widget.id}-${key})`}
                                    strokeWidth={2}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case "line":
                return (
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={widget.data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                            <YAxis stroke="#6b7280" fontSize={12} />
                            <Tooltip />
                            {dataKeys.map((key, index) => (
                                <Line
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={seriesColors[key] || colors[index % colors.length]}
                                    strokeWidth={3}
                                    dot={{ fill: seriesColors[key] || colors[index % colors.length], r: 4 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                );

            case "bar":
                const isAttendance = widget.data && widget.data[0]?.asistencia !== undefined;
                return (
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={widget.data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey={widget.data && widget.data[0]?.day ? "day" : "month"} stroke="#6b7280" fontSize={12} />
                            <YAxis
                                stroke="#6b7280"
                                fontSize={12}
                                domain={isAttendance ? [0, 100] : undefined}
                                tickFormatter={isAttendance ? (value) => `${value}%` : undefined}
                            />
                            <Tooltip formatter={isAttendance ? (value: any) => `${value}%` : undefined} />
                            {dataKeys.map((key, index) => (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    fill={seriesColors[key] || colors[index % colors.length]}
                                    radius={[8, 8, 0, 0]}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );

            case "pie":
                return (
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie
                                data={widget.data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                outerRadius={70}
                                fill={widget.color}
                                dataKey="value"
                            >
                                {widget.data?.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                );

            case "radar":
                return (
                    <ResponsiveContainer width="100%" height={220}>
                        <RadarChart data={widget.data}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis dataKey="subject" stroke="#6b7280" fontSize={12} />
                            <PolarRadiusAxis stroke="#6b7280" fontSize={12} />
                            <Radar
                                name="Score"
                                dataKey="score"
                                stroke={widget.color}
                                fill={widget.color}
                                fillOpacity={0.3}
                            />
                            <Tooltip />
                        </RadarChart>
                    </ResponsiveContainer>
                );

            default:
                return null;
        }
    };

    const visibleWidgets = widgets.filter(w => w.visible);

    // Componente de Widget reutilizable
    const WidgetCard = ({ widget, isDragging = false, showGrip = false }: { widget: Widget; isDragging?: boolean; showGrip?: boolean }) => {
        const Icon = widget.icon;

        return (
            <div
                className={`kpi-card-modern ${isDragging ? 'opacity-50' : ''}`}
                style={{
                    background: widget.bgGradient,
                    position: 'relative',
                    cursor: showGrip ? 'grab' : 'default',
                    maxWidth: '100%',
                    width: '100%'
                }}
            >
                {/* Overlay */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)',
                    pointerEvents: 'none'
                }} />

                {/* Header */}
                <div style={{
                    position: 'relative',
                    zIndex: 1,
                    marginBottom: 'var(--spacing-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        {showGrip && <GripVertical size={18} className="text-slate-400" />}
                        <div className="kpi-icon-gradient" style={{
                            marginBottom: 0,
                            background: `${widget.color}15`,
                            color: widget.color
                        }}>
                            <Icon size={32} />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                            {widget.title}
                        </h3>
                    </div>
                    {showGrip && widget.type === "chart" && (
                        <select
                            value={widget.chartType}
                            onChange={(e) => updateChartType(widget.id, e.target.value as any)}
                            className="px-2 py-1 text-sm rounded-lg border border-slate-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <option value="area">Área</option>
                            <option value="line">Línea</option>
                            <option value="bar">Barras</option>
                            <option value="pie">Pastel</option>
                            <option value="radar">Radar</option>
                        </select>
                    )}
                </div>

                {/* Contenido */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                    {widget.type === "chart" ? (
                        renderChart(widget)
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Alumnos", value: "245", icon: Users, color: "#3b82f6" },
                                { label: "Cursos", value: "18", icon: BookOpen, color: "#10b981" },
                                { label: "Ingresos", value: "$53K", icon: DollarSign, color: "#f59e0b" },
                                { label: "Asistencia", value: "94%", icon: Calendar, color: "#8b5cf6" },
                            ].map((metric, idx) => {
                                const MetricIcon = metric.icon;
                                return (
                                    <div
                                        key={idx}
                                        className="p-3 rounded-lg bg-white/60 border border-white/50 hover:bg-white/90 transition-all"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <MetricIcon size={14} style={{ color: metric.color }} />
                                            <span className="text-xs text-slate-600 font-medium">{metric.label}</span>
                                        </div>
                                        <div className="text-xl font-bold text-slate-900">{metric.value}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div>
            {/* HEADER INDEPENDIENTE */}
            <div style={{
                padding: 'var(--spacing-lg)',
                marginBottom: '64px',
                position: 'relative',
                zIndex: 10
            }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
                            Dashboard Ejecutivo
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Personaliza tu vista arrastrando y configurando los widgets
                        </p>
                    </div>
                    <button
                        onClick={() => setEditMode(!editMode)}
                        className="flex items-center gap-2 h-10 px-4 rounded-lg border border-slate-200 hover:bg-accent transition-all duration-300 shadow-sm font-medium"
                    >
                        <Settings size={18} />
                        {editMode ? "Guardar" : "Personalizar"}
                    </button>
                </div>
            </div>

            {/* Edit Mode Controls */}
            {editMode && (
                <div style={{ padding: '0 var(--spacing-lg)', marginBottom: '32px' }}>
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">Widgets Disponibles</h3>
                            <button
                                onClick={resetConfiguration}
                                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                Restaurar
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {widgets.map(widget => (
                                <button
                                    key={widget.id}
                                    onClick={() => toggleWidgetVisibility(widget.id)}
                                    className={`px-3 py-1.5 text-sm rounded-lg border-2 transition-all flex items-center gap-2 ${widget.visible
                                        ? "border-primary-600 bg-primary-50"
                                        : "border-slate-200 bg-white"
                                        }`}
                                >
                                    {widget.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                    {widget.title}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* GRID 2x2 - SEPARADO DE DND */}
            <div className="px-6">
                {editMode ? (
                    // Modo edición: CON drag and drop
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="widgets">
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                                >
                                    {visibleWidgets.map((widget, index) => (
                                        <Draggable key={widget.id} draggableId={widget.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    style={provided.draggableProps.style}
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
                    // Modo normal: SIN drag and drop - grid simple
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {visibleWidgets.map((widget) => (
                            <WidgetCard key={widget.id} widget={widget} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
