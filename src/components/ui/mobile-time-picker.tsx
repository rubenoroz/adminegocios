"use client";

import { format, isBefore, isEqual, addDays, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, AlertCircle, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useMemo } from "react";

interface MobileTimePickerProps {
    startTime: Date;
    endTime: Date;
    onStartTimeChange: (newTime: Date) => void;
    onEndTimeChange: (newTime: Date) => void;
    showDate?: boolean;
    label?: string;
    /** Interval in minutes between time options (default: 15) */
    interval?: number;
    /** Earliest hour to show (default: 6) */
    minHour?: number;
    /** Latest hour to show (default: 23) */
    maxHour?: number;
    /** Allow changing the date (default: true) */
    allowDateChange?: boolean;
}

/**
 * Time picker component with dropdown selectors.
 * Shows day navigation and hour/minute dropdowns for easy selection.
 */
export function MobileTimePicker({
    startTime,
    endTime,
    onStartTimeChange,
    onEndTimeChange,
    showDate = true,
    label = "Horario",
    interval = 15,
    minHour = 6,
    maxHour = 23,
    allowDateChange = true,
}: MobileTimePickerProps) {
    // Generate time options
    const timeOptions = useMemo(() => {
        const options: { value: string; label: string }[] = [];
        for (let hour = minHour; hour <= maxHour; hour++) {
            for (let min = 0; min < 60; min += interval) {
                const h = hour.toString().padStart(2, "0");
                const m = min.toString().padStart(2, "0");
                options.push({
                    value: `${h}:${m}`,
                    label: `${h}:${m}`,
                });
            }
        }
        return options;
    }, [interval, minHour, maxHour]);

    const startTimeStr = format(startTime, "HH:mm");
    const endTimeStr = format(endTime, "HH:mm");

    // Check if end time is before or equal to start time
    const hasError = isBefore(endTime, startTime) || isEqual(endTime, startTime);

    const handleStartChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const timeValue = e.target.value;
        if (!timeValue) return;

        const [hours, minutes] = timeValue.split(":").map(Number);
        const newDate = new Date(startTime);
        newDate.setHours(hours, minutes, 0, 0);
        onStartTimeChange(newDate);
    };

    const handleEndChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const timeValue = e.target.value;
        if (!timeValue) return;

        const [hours, minutes] = timeValue.split(":").map(Number);
        const newDate = new Date(endTime);
        newDate.setHours(hours, minutes, 0, 0);
        onEndTimeChange(newDate);
    };

    const handlePrevDay = () => {
        const newStart = subDays(startTime, 1);
        const newEnd = subDays(endTime, 1);
        onStartTimeChange(newStart);
        onEndTimeChange(newEnd);
    };

    const handleNextDay = () => {
        const newStart = addDays(startTime, 1);
        const newEnd = addDays(endTime, 1);
        onStartTimeChange(newStart);
        onEndTimeChange(newEnd);
    };

    const selectStyle: React.CSSProperties = {
        width: "100%",
        padding: "12px 14px",
        borderRadius: "10px",
        border: "1px solid #E2E8F0",
        backgroundColor: "white",
        fontSize: "16px",
        fontWeight: 600,
        color: "#0F172A",
        textAlign: "center",
        cursor: "pointer",
        appearance: "none",
        WebkitAppearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
        paddingRight: "36px",
    };

    const selectErrorStyle: React.CSSProperties = {
        ...selectStyle,
        border: "1px solid #FCA5A5",
        backgroundColor: "#FEF2F2",
        color: "#DC2626",
    };

    const navButtonStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        borderRadius: "10px",
        border: "1px solid #E2E8F0",
        backgroundColor: "white",
        cursor: "pointer",
        color: "#64748B",
        transition: "all 0.15s ease",
    };

    // Get day of week with first letter capitalized
    const dayOfWeek = format(startTime, "EEEE", { locale: es });
    const capitalizedDay = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
    const dateNum = format(startTime, "d");
    const month = format(startTime, "MMMM", { locale: es });
    const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);

    return (
        <div
            style={{
                backgroundColor: "#F8FAFC",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "20px",
                border: hasError ? "1px solid #FCA5A5" : "1px solid #E2E8F0",
            }}
        >
            {/* Date Display with Navigation */}
            {showDate && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "16px",
                        padding: "12px",
                        backgroundColor: "white",
                        borderRadius: "10px",
                        border: "1px solid #E2E8F0",
                    }}
                >
                    {allowDateChange && (
                        <button
                            type="button"
                            onClick={handlePrevDay}
                            style={navButtonStyle}
                            title="Día anterior"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            flex: 1,
                            justifyContent: "center",
                        }}
                    >
                        <Calendar size={20} color="#3B82F6" />
                        <div style={{ textAlign: "center" }}>
                            <div style={{
                                fontSize: "18px",
                                fontWeight: 700,
                                color: "#0F172A",
                                lineHeight: 1.2,
                            }}>
                                {capitalizedDay}
                            </div>
                            <div style={{
                                fontSize: "14px",
                                color: "#64748B",
                                fontWeight: 500,
                            }}>
                                {dateNum} de {capitalizedMonth}
                            </div>
                        </div>
                    </div>

                    {allowDateChange && (
                        <button
                            type="button"
                            onClick={handleNextDay}
                            style={navButtonStyle}
                            title="Día siguiente"
                        >
                            <ChevronRight size={20} />
                        </button>
                    )}
                </div>
            )}

            {/* Time Selectors */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                }}
            >
                {/* Start Time */}
                <div style={{ flex: 1 }}>
                    <label
                        style={{
                            display: "block",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#64748B",
                            marginBottom: "6px",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                        }}
                    >
                        Inicio
                    </label>
                    <select
                        value={startTimeStr}
                        onChange={handleStartChange}
                        style={selectStyle}
                    >
                        {timeOptions.map((opt) => (
                            <option key={`start-${opt.value}`} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Separator */}
                <div
                    style={{
                        color: "#94A3B8",
                        fontWeight: 600,
                        fontSize: "18px",
                        marginTop: "22px",
                    }}
                >
                    →
                </div>

                {/* End Time */}
                <div style={{ flex: 1 }}>
                    <label
                        style={{
                            display: "block",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#64748B",
                            marginBottom: "6px",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                        }}
                    >
                        Fin
                    </label>
                    <select
                        value={endTimeStr}
                        onChange={handleEndChange}
                        style={hasError ? selectErrorStyle : selectStyle}
                    >
                        {timeOptions.map((opt) => (
                            <option key={`end-${opt.value}`} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Error Message */}
            {hasError && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginTop: "10px",
                        color: "#DC2626",
                        fontSize: "13px",
                        fontWeight: 500,
                    }}
                >
                    <AlertCircle size={14} />
                    <span>La hora de fin debe ser después del inicio</span>
                </div>
            )}
        </div>
    );
}
