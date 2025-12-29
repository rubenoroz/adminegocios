"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileSpreadsheet, Check, AlertCircle, Loader2 } from "lucide-react";
import { useBranch } from "@/context/branch-context";

interface ColumnMapping {
    targetField: string;
    sourceColumn: string;
}

interface ImportConfig {
    type: "STUDENTS" | "TEACHERS" | "COURSES";
    fields: { key: string; label: string; required: boolean }[];
}

const IMPORT_CONFIGS: Record<string, ImportConfig> = {
    STUDENTS: {
        type: "STUDENTS",
        fields: [
            { key: "firstName", label: "Nombre(s)", required: true },
            { key: "lastName", label: "Apellidos", required: true },
            { key: "email", label: "Email", required: false },
            { key: "phone", label: "Teléfono", required: false },
            { key: "matricula", label: "Matrícula", required: false },
        ]
    },
    TEACHERS: {
        type: "TEACHERS",
        fields: [
            { key: "name", label: "Nombre Completo", required: true },
            { key: "email", label: "Email", required: true },
            { key: "phone", label: "Teléfono", required: false },
            { key: "hourlyRate", label: "Pago por Hora", required: false },
        ]
    },
    COURSES: {
        type: "COURSES",
        fields: [
            { key: "name", label: "Nombre del Curso/Materia", required: true },
            { key: "description", label: "Descripción", required: false },
            { key: "gradeLevel", label: "Nivel/Grado", required: false },
            { key: "schedule", label: "Horario (Texto)", required: false },
            { key: "room", label: "Aula/Salón", required: false },
        ]
    }
};

export function DataImporter() {
    const { selectedBranch } = useBranch();
    const [importType, setImportType] = useState<"STUDENTS" | "TEACHERS" | "COURSES">("STUDENTS");
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [step, setStep] = useState<"UPLOAD" | "MAP" | "PREVIEW" | "IMPORTING" | "DONE">("UPLOAD");
    const [importStats, setImportStats] = useState({ total: 0, success: 0, failed: 0 });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        setFile(file);

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: "binary" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            if (jsonData.length > 0) {
                const headers = jsonData[0] as string[];
                setHeaders(headers);
                setPreviewData(jsonData.slice(1)); // Remove header row
                setStep("MAP");

                // Auto-map columns if names match closely
                const newMapping: Record<string, string> = {};
                const config = IMPORT_CONFIGS[importType];

                config.fields.forEach(field => {
                    const match = headers.find(h =>
                        h.toLowerCase().includes(field.label.toLowerCase()) ||
                        h.toLowerCase().includes(field.key.toLowerCase())
                    );
                    if (match) {
                        newMapping[field.key] = match;
                    }
                });
                setMapping(newMapping);
            }
        };
        reader.readAsBinaryString(file);
    }, [importType]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        },
        maxFiles: 1
    });

    const handleImport = async () => {
        if (!selectedBranch?.businessId) return;

        setStep("IMPORTING");
        let successCount = 0;
        let failedCount = 0;

        const config = IMPORT_CONFIGS[importType];

        // Process data based on mapping
        const processedData = previewData.map((row: any) => {
            const item: any = {};
            Object.entries(mapping).forEach(([targetField, sourceColumn]) => {
                const columnIndex = headers.indexOf(sourceColumn);
                if (columnIndex !== -1) {
                    item[targetField] = row[columnIndex];
                }
            });
            return item;
        }).filter(item => {
            // Basic validation: check required fields
            return config.fields.every(f => !f.required || (item[f.key] && String(item[f.key]).trim() !== ""));
        });

        try {
            // Send to API in batches
            const batchSize = 50;
            for (let i = 0; i < processedData.length; i += batchSize) {
                const batch = processedData.slice(i, i + batchSize);

                const response = await fetch("/api/import", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: importType,
                        data: batch,
                        businessId: selectedBranch.businessId,
                        branchId: selectedBranch.id
                    })
                });

                const result = await response.json();
                successCount += result.success;
                failedCount += result.failed;
            }

            setImportStats({ total: processedData.length, success: successCount, failed: failedCount });
            setStep("DONE");
        } catch (error) {
            console.error("Import error:", error);
            alert("Error durante la importación");
            setStep("PREVIEW");
        }
    };

    const handleDownloadTemplate = () => {
        const wb = XLSX.utils.book_new();

        // Sheet 1: Students
        const studentHeaders = IMPORT_CONFIGS.STUDENTS.fields.map(f => f.label);
        const studentWs = XLSX.utils.aoa_to_sheet([studentHeaders]);
        XLSX.utils.book_append_sheet(wb, studentWs, "Alumnos");

        // Sheet 2: Teachers
        const teacherHeaders = IMPORT_CONFIGS.TEACHERS.fields.map(f => f.label);
        const teacherWs = XLSX.utils.aoa_to_sheet([teacherHeaders]);
        XLSX.utils.book_append_sheet(wb, teacherWs, "Maestros");

        // Sheet 3: Courses
        const courseHeaders = IMPORT_CONFIGS.COURSES.fields.map(f => f.label);
        const courseWs = XLSX.utils.aoa_to_sheet([courseHeaders]);
        XLSX.utils.book_append_sheet(wb, courseWs, "Cursos_Materias");

        XLSX.writeFile(wb, "Plantilla_Importacion_Escuela.xlsx");
    };

    const reset = () => {
        setFile(null);
        setPreviewData([]);
        setHeaders([]);
        setMapping({});
        setStep("UPLOAD");
        setImportStats({ total: 0, success: 0, failed: 0 });
    };

    return (
        <div className="space-y-6">
            {/* Fila superior: selector y botón */}
            <div className="flex items-center justify-between">
                <Select
                    value={importType}
                    onValueChange={(v: any) => {
                        setImportType(v);
                        reset();
                    }}
                    disabled={step !== "UPLOAD"}
                >
                    <SelectTrigger
                        className="w-[220px] bg-white border-slate-200"
                        style={{ gap: '6px', paddingRight: '10px' }}
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="STUDENTS">Importar Alumnos</SelectItem>
                        <SelectItem value="TEACHERS">Importar Maestros</SelectItem>
                        <SelectItem value="COURSES">Importar Cursos/Materias</SelectItem>
                    </SelectContent>
                </Select>

                <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 14px',
                        backgroundColor: '#059669',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'white',
                        cursor: 'pointer',
                        width: 'auto',
                        whiteSpace: 'nowrap'
                    }}
                >
                    <FileSpreadsheet style={{ width: '16px', height: '16px' }} />
                    Descargar Plantilla
                </button>
            </div>

            {/* Zona de arrastre */}
            {step === "UPLOAD" && (
                <div
                    {...getRootProps()}
                    style={{
                        marginTop: '24px',
                        border: isDragActive ? '2px solid #3B82F6' : '2px dashed #CBD5E1',
                        borderRadius: '16px',
                        padding: '48px 24px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: isDragActive ? '#EFF6FF' : '#FFFFFF',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <input {...getInputProps()} />
                    <div style={{
                        width: '56px',
                        height: '56px',
                        backgroundColor: '#DBEAFE',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px'
                    }}>
                        <FileSpreadsheet style={{ width: '28px', height: '28px', color: '#2563EB' }} />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>
                        {isDragActive ? "Suelta el archivo aquí" : "Arrastra tu archivo Excel aquí"}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#64748B' }}>
                        o haz clic para seleccionar (Soporta .xlsx, .xls)
                    </p>
                </div>
            )}

            {step === "MAP" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Mapeo de Columnas</CardTitle>
                        <CardDescription>
                            Relaciona las columnas de tu Excel con los campos del sistema
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            {IMPORT_CONFIGS[importType].fields.map((field) => (
                                <div key={field.key} className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-1">
                                        {field.label}
                                        {field.required && <span className="text-red-500">*</span>}
                                    </label>
                                    <Select
                                        value={mapping[field.key] || ""}
                                        onValueChange={(value) => setMapping({ ...mapping, [field.key]: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar columna..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {headers.map((header) => (
                                                <SelectItem key={header} value={header}>
                                                    {header}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-4">
                            <button
                                onClick={reset}
                                className="font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                                style={{ padding: '12px 24px', borderRadius: '6px', border: '2px solid #E2E8F0', backgroundColor: 'transparent' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => setStep("PREVIEW")}
                                className="font-semibold text-white hover:opacity-90 transition-all"
                                style={{ padding: '12px 24px', borderRadius: '6px', backgroundColor: '#2563EB', border: 'none' }}
                            >
                                Continuar
                            </button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === "PREVIEW" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Vista Previa</CardTitle>
                        <CardDescription>
                            Revisa los datos antes de importar. Se procesarán {previewData.length} registros.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="border rounded-md overflow-hidden max-h-[400px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {IMPORT_CONFIGS[importType].fields.map(f => (
                                            <TableHead key={f.key}>{f.label}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewData.slice(0, 5).map((row, i) => (
                                        <TableRow key={i}>
                                            {IMPORT_CONFIGS[importType].fields.map(f => {
                                                const colName = mapping[f.key];
                                                const colIndex = headers.indexOf(colName);
                                                return (
                                                    <TableCell key={f.key}>
                                                        {colIndex !== -1 ? row[colIndex] : "-"}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <p className="text-sm text-muted-foreground text-center">
                            Mostrando primeros 5 registros de {previewData.length}
                        </p>

                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setStep("MAP")}
                                className="font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                                style={{ padding: '12px 24px', borderRadius: '6px', border: '2px solid #E2E8F0', backgroundColor: 'transparent' }}
                            >
                                Atrás
                            </button>
                            <button
                                onClick={handleImport}
                                className="font-semibold text-white hover:opacity-90 transition-all flex items-center gap-2"
                                style={{ padding: '12px 24px', borderRadius: '6px', backgroundColor: '#059669', border: 'none' }}
                            >
                                <Upload className="h-5 w-5" />
                                Importar {previewData.length} Registros
                            </button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === "IMPORTING" && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
                        <h3 className="text-lg font-medium">Procesando Importación...</h3>
                        <p className="text-muted-foreground">Por favor no cierres esta ventana</p>
                    </CardContent>
                </Card>
            )}

            {step === "DONE" && (
                <Card>
                    <CardContent className="py-12 text-center space-y-4">
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <Check className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-green-700">¡Importación Completada!</h3>
                            <p className="text-muted-foreground">
                                Se procesaron {importStats.total} registros
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mt-6">
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-2xl font-bold text-green-700">{importStats.success}</p>
                                <p className="text-sm text-green-600">Exitosos</p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg">
                                <p className="text-2xl font-bold text-red-700">{importStats.failed}</p>
                                <p className="text-sm text-red-600">Fallidos</p>
                            </div>
                        </div>

                        <button
                            onClick={reset}
                            className="mt-6 font-semibold text-white hover:opacity-90 transition-all"
                            style={{ padding: '12px 28px', borderRadius: '6px', backgroundColor: '#2563EB', border: 'none' }}
                        >
                            Importar Otro Archivo
                        </button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
