"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface ReferralData {
    source: string;
    label: string;
    count: number;
    color: string;
}

interface ReferralStatsResponse {
    total: number;
    data: ReferralData[];
}

export function ReferralSourceChart() {
    const [data, setData] = useState<ReferralStatsResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/reports/referrals")
            .then(res => res.ok ? res.json() : null)
            .then(d => setData(d))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div style={{
                background: "white",
                borderRadius: "20px",
                padding: "24px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                height: "400px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!data || data.data.length === 0) {
        return (
            <div style={{
                background: "white",
                borderRadius: "20px",
                padding: "24px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                height: "400px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px"
            }}>
                <div style={{ fontSize: "48px" }}>📊</div>
                <p style={{ color: "#64748b", fontSize: "14px" }}>
                    Aún no hay datos de fuentes de referencia
                </p>
            </div>
        );
    }

    const chartData = data.data.map(d => ({
        name: d.label,
        value: d.count,
        color: d.color
    }));

    return (
        <div style={{
            background: "white",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
        }}>
            {/* Header */}
            <div style={{ marginBottom: "20px" }}>
                <h3 style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: "4px"
                }}>
                    ¿Cómo nos conocieron?
                </h3>
                <p style={{ fontSize: "13px", color: "#64748b" }}>
                    Fuentes de referencia de {data.total} alumnos activos
                </p>
            </div>

            {/* Pie Chart */}
            <div style={{ height: "280px" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            labelLine={false}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number) => [`${value} alumnos`, "Total"]}
                            contentStyle={{
                                borderRadius: "12px",
                                border: "none",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                            }}
                        />
                        <Legend
                            layout="vertical"
                            align="right"
                            verticalAlign="middle"
                            formatter={(value) => (
                                <span style={{ color: "#475569", fontSize: "13px" }}>{value}</span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Stats List */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "12px",
                marginTop: "20px",
                paddingTop: "20px",
                borderTop: "1px solid #f1f5f9"
            }}>
                {data.data.slice(0, 4).map((item) => (
                    <div
                        key={item.source}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "12px",
                            backgroundColor: "#f8fafc",
                            borderRadius: "12px"
                        }}
                    >
                        <div style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: "4px",
                            backgroundColor: item.color
                        }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>
                                {item.label}
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>
                                {item.count} alumnos ({Math.round((item.count / data.total) * 100)}%)
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
