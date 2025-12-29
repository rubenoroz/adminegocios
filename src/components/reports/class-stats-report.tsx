"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, Loader2, BarChart3 } from "lucide-react";
import { useBranch } from "@/context/branch-context";
import * as XLSX from "xlsx";

interface ClassStatRow {
    id: string;
    name: string;
    months: number[];
    total: number;
}

const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

export function ClassStatsReport() {
    const { selectedBranch } = useBranch();
    const [data, setData] = useState<ClassStatRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [year, setYear] = useState(new Date().getFullYear().toString());

    const fetchData = async () => {
        if (!selectedBranch?.businessId) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/reports/class-stats?businessId=${selectedBranch.businessId}&year=${year}`);
            if (res.ok) {
                const jsonData = await res.json();
                setData(jsonData);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedBranch?.businessId, year]);

    const handleExport = () => {
        const wb = XLSX.utils.book_new();

        const headers = ["Clase", ...MONTHS, "TOTAL ANUAL"];
        const rows = data.map(row => [
            row.name,
            ...row.months,
            row.total
        ]);

        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

        // Add totals row at bottom
        const totals = Array(13).fill(0);
        data.forEach(row => {
            row.months.forEach((val, idx) => totals[idx] += val);
            totals[12] += row.total;
        });

        XLSX.utils.sheet_add_aoa(ws, [["TOTALES", ...totals]], { origin: -1 });

        ws['!cols'] = [{ wch: 25 }, ...Array(13).fill({ wch: 8 })];

        XLSX.utils.book_append_sheet(wb, ws, "Resumen por Clase");
        XLSX.writeFile(wb, `Resumen_Clases_${year}.xlsx`);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Resumen por Clase</h2>
                    <p className="text-slate-500">Cantidad de alumnos activos por mes</p>
                </div>
                <div className="flex gap-3">
                    <Select value={year} onValueChange={setYear}>
                        <SelectTrigger className="w-[100px] bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2025">2025</SelectItem>
                        </SelectContent>
                    </Select>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 font-semibold text-white hover:opacity-90 transition-all"
                        style={{ padding: '10px 20px', borderRadius: '6px', backgroundColor: '#7C3AED', border: 'none' }}
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        Exportar Excel
                    </button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[200px]">Clase</TableHead>
                                {MONTHS.map(m => (
                                    <TableHead key={m} className="text-center w-[60px]">{m}</TableHead>
                                ))}
                                <TableHead className="text-right font-bold">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={14} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={14} className="h-24 text-center text-muted-foreground">
                                        No hay datos disponibles
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <>
                                    {data.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="font-medium">{row.name}</TableCell>
                                            {row.months.map((val, idx) => (
                                                <TableCell key={idx} className="text-center">
                                                    {val > 0 ? (
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                                                            {val}
                                                        </span>
                                                    ) : "-"}
                                                </TableCell>
                                            ))}
                                            <TableCell className="text-right font-bold">{row.total}</TableCell>
                                        </TableRow>
                                    ))}
                                    {/* Totals Row */}
                                    <TableRow className="bg-muted/50 font-bold">
                                        <TableCell>TOTALES</TableCell>
                                        {MONTHS.map((_, idx) => (
                                            <TableCell key={idx} className="text-center">
                                                {data.reduce((acc, curr) => acc + curr.months[idx], 0)}
                                            </TableCell>
                                        ))}
                                        <TableCell className="text-right">
                                            {data.reduce((acc, curr) => acc + curr.total, 0)}
                                        </TableCell>
                                    </TableRow>
                                </>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
