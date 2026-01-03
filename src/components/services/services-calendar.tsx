"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, GripVertical } from "lucide-react";

interface Appointment {
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    service: { name: string; color: string; duration: number };
    customer: { name: string };
}

export function ServicesCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [view, setView] = useState<"day" | "week">("week");
    const [loading, setLoading] = useState(true);
    const [draggedAppt, setDraggedAppt] = useState<string | null>(null);

    // Get week dates
    const getWeekDates = (date: Date) => {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
        const monday = new Date(date);
        monday.setDate(diff);

        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d;
        });
    };

    const weekDates = getWeekDates(currentDate);

    useEffect(() => {
        fetchAppointments();
    }, [currentDate, view]);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            // Fetch for the entire week
            const startDate = weekDates[0].toISOString().split('T')[0];
            const endDate = weekDates[6].toISOString().split('T')[0];

            // For simplicity, fetch without date filter and filter client-side
            const res = await fetch(`/api/appointments`);
            const data = await res.json();

            if (Array.isArray(data)) {
                // Filter appointments for current week
                const weekAppts = data.filter((apt: Appointment) => {
                    const aptDate = new Date(apt.startTime);
                    return aptDate >= weekDates[0] && aptDate <= new Date(weekDates[6].getTime() + 86400000);
                });
                setAppointments(weekAppts);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const prevWeek = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - 7);
        setCurrentDate(d);
    };

    const nextWeek = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + 7);
        setCurrentDate(d);
    };

    const today = () => setCurrentDate(new Date());

    const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7am to 8pm

    const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    const getAppointmentStyle = (apt: Appointment) => {
        const start = new Date(apt.startTime);
        const end = new Date(apt.endTime);
        const startHour = start.getHours() + start.getMinutes() / 60;
        const endHour = end.getHours() + end.getMinutes() / 60;
        const top = (startHour - 7) * 60;
        const height = (endHour - startHour) * 60;
        return { top: `${top}px`, height: `${Math.max(height, 25)}px` };
    };

    const getAppointmentsForDay = (date: Date) => {
        return appointments.filter(apt => {
            const aptDate = new Date(apt.startTime);
            return aptDate.toDateString() === date.toDateString();
        });
    };

    // Drag & Drop handlers
    const handleDragStart = (e: React.DragEvent, aptId: string) => {
        setDraggedAppt(aptId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, date: Date, hour: number) => {
        e.preventDefault();
        if (!draggedAppt) return;

        const newStartTime = new Date(date);
        newStartTime.setHours(hour, 0, 0, 0);

        try {
            await fetch(`/api/appointments/${draggedAppt}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startTime: newStartTime.toISOString() })
            });
            fetchAppointments();
        } catch (error) {
            console.error(error);
        }
        setDraggedAppt(null);
    };

    const isToday = (date: Date) => date.toDateString() === new Date().toDateString();
    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={prevWeek} style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#F1F5F9', border: 'none', cursor: 'pointer' }}>
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextWeek} style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#F1F5F9', border: 'none', cursor: 'pointer' }}>
                        <ChevronRight size={20} />
                    </button>
                    <button onClick={today} style={{
                        padding: '10px 16px', borderRadius: '10px',
                        backgroundColor: isToday(currentDate) ? '#3B82F6' : '#F1F5F9',
                        color: isToday(currentDate) ? 'white' : '#0F172A',
                        border: 'none', cursor: 'pointer', fontWeight: 600
                    }}>
                        Hoy
                    </button>
                </div>

                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>
                    {weekDates[0].toLocaleDateString('es-MX', { month: 'long', day: 'numeric' })} - {weekDates[6].toLocaleDateString('es-MX', { month: 'long', day: 'numeric', year: 'numeric' })}
                </h2>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setView("day")} style={{
                        padding: '10px 16px', borderRadius: '10px',
                        backgroundColor: view === 'day' ? '#3B82F6' : '#F1F5F9',
                        color: view === 'day' ? 'white' : '#0F172A',
                        border: 'none', cursor: 'pointer', fontWeight: 500
                    }}>Día</button>
                    <button onClick={() => setView("week")} style={{
                        padding: '10px 16px', borderRadius: '10px',
                        backgroundColor: view === 'week' ? '#3B82F6' : '#F1F5F9',
                        color: view === 'week' ? 'white' : '#0F172A',
                        border: 'none', cursor: 'pointer', fontWeight: 500
                    }}>Semana</button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                {/* Day Headers */}
                <div style={{ display: 'grid', gridTemplateColumns: view === 'week' ? '70px repeat(7, 1fr)' : '70px 1fr', borderBottom: '1px solid #E2E8F0' }}>
                    <div style={{ padding: '12px', backgroundColor: '#F8FAFC' }}></div>
                    {(view === 'week' ? weekDates : [currentDate]).map((date, idx) => (
                        <div key={idx} style={{
                            padding: '12px', textAlign: 'center', backgroundColor: '#F8FAFC',
                            borderLeft: '1px solid #E2E8F0'
                        }}>
                            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
                                {view === 'week' ? dayNames[idx] : date.toLocaleDateString('es-MX', { weekday: 'long' })}
                            </div>
                            <div style={{
                                fontSize: '20px', fontWeight: 700,
                                color: isToday(date) ? '#3B82F6' : '#0F172A',
                                backgroundColor: isToday(date) ? '#EFF6FF' : 'transparent',
                                borderRadius: '8px', padding: '4px 8px', display: 'inline-block'
                            }}>
                                {date.getDate()}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Time Grid */}
                <div style={{ position: 'relative', height: `${14 * 60}px`, overflowY: 'auto' }}>
                    {hours.map(hour => (
                        <div key={hour} style={{
                            position: 'absolute',
                            top: `${(hour - 7) * 60}px`,
                            left: 0, right: 0,
                            height: '60px',
                            display: 'grid',
                            gridTemplateColumns: view === 'week' ? '70px repeat(7, 1fr)' : '70px 1fr'
                        }}>
                            <div style={{
                                padding: '4px 12px', fontSize: '13px', color: '#64748B',
                                fontWeight: 500, borderBottom: '1px solid #F1F5F9'
                            }}>
                                {hour.toString().padStart(2, '0')}:00
                            </div>
                            {(view === 'week' ? weekDates : [currentDate]).map((date, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        borderLeft: '1px solid #F1F5F9',
                                        borderBottom: '1px solid #F1F5F9',
                                        position: 'relative'
                                    }}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, date, hour)}
                                />
                            ))}
                        </div>
                    ))}

                    {/* Render appointments */}
                    {(view === 'week' ? weekDates : [currentDate]).map((date, dayIdx) => {
                        const dayAppts = getAppointmentsForDay(date);
                        return dayAppts.map(apt => {
                            const style = getAppointmentStyle(apt);
                            const columnWidth = view === 'week' ? `calc((100% - 70px) / 7)` : 'calc(100% - 70px)';
                            const left = view === 'week' ? `calc(70px + ${dayIdx} * ${columnWidth})` : '70px';

                            return (
                                <div
                                    key={apt.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, apt.id)}
                                    style={{
                                        position: 'absolute',
                                        left,
                                        width: `calc(${columnWidth} - 8px)`,
                                        marginLeft: '4px',
                                        top: style.top,
                                        height: style.height,
                                        backgroundColor: apt.service.color,
                                        borderRadius: '6px',
                                        padding: '4px 8px',
                                        color: 'white',
                                        fontSize: '12px',
                                        overflow: 'hidden',
                                        cursor: 'grab',
                                        boxShadow: draggedAppt === apt.id ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                                        opacity: draggedAppt === apt.id ? 0.7 : 1,
                                        transition: 'box-shadow 0.2s, opacity 0.2s',
                                        zIndex: 10
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <GripVertical size={12} style={{ opacity: 0.7 }} />
                                        <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {apt.service.name}
                                        </span>
                                    </div>
                                    <div style={{ opacity: 0.9, fontSize: '11px' }}>{apt.customer.name}</div>
                                </div>
                            );
                        });
                    })}

                    {/* Current time line */}
                    {(view === 'week' ? weekDates : [currentDate]).some(d => isToday(d)) && (
                        <div style={{
                            position: 'absolute',
                            left: '70px',
                            right: 0,
                            top: `${(new Date().getHours() + new Date().getMinutes() / 60 - 7) * 60}px`,
                            height: '2px',
                            backgroundColor: '#EF4444',
                            zIndex: 20
                        }}>
                            <div style={{ position: 'absolute', left: '-5px', top: '-4px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                        </div>
                    )}
                </div>
            </div>

            {loading && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
                </div>
            )}
        </div>
    );
}
