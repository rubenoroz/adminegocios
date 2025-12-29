"use client";

import { LucideIcon } from "lucide-react";
import { ArrowUp, ArrowDown } from "lucide-react";

interface KpiCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: number;
    positive?: boolean;
    color?: string;
    subtitle?: string;
}

export function KpiCard({
    title,
    value,
    icon: Icon,
    trend,
    positive = true,
    color = "var(--module-dashboard)",
    subtitle
}: KpiCardProps) {
    return (
        <div className="kpi-card" role="group" aria-label={title}>
            <div className="kpi-icon-wrapper">
                <div
                    className="kpi-icon"
                    style={{
                        background: `linear-gradient(135deg, ${color}15, ${color}05)`,
                        color: color
                    }}
                >
                    <Icon size={24} />
                </div>
            </div>
            <div className="kpi-body">
                <div className="kpi-title">{title}</div>
                <div className="kpi-value">{value}</div>
                {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
            </div>
            {typeof trend !== 'undefined' && (
                <div className="kpi-trend-wrapper">
                    <div
                        className={`kpi-trend ${positive ? 'positive' : 'negative'}`}
                        style={{ color: positive ? 'var(--success)' : 'var(--error)' }}
                    >
                        {positive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        <span>{Math.abs(trend)}%</span>
                    </div>
                </div>
            )}
        </div>
    );
}
