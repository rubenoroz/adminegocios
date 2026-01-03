"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Upload,
    Check,
    AlertCircle,
    Loader2,
    ArrowRight,
    ArrowLeft,
    Download,
    GraduationCap,
    Users,
    BookOpen,
    Package,
    UserCircle,
    UtensilsCrossed,
    Sparkles,
    ClipboardList,
    FileSpreadsheet,
    HelpCircle,
    Copy,
    Lightbulb,
    CheckCircle2
} from "lucide-react";
import { useBranch } from "@/context/branch-context";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// --- Configuration Types ---
interface ImportConfig {
    type: "STUDENTS" | "TEACHERS" | "COURSES" | "PRODUCTS" | "CUSTOMERS" | "MENU_ITEMS";
    label: string;
    icon: React.ElementType;
    description: string;
    gradient: string;
    accentColor: string;
    fields: { key: string; label: string; required: boolean; description?: string }[];
    exampleData?: string;
    tips?: string[];
}

const IMPORT_CONFIGS: Record<string, ImportConfig> = {
    STUDENTS: {
        type: "STUDENTS",
        label: "Alumnos",
        icon: GraduationCap,
        description: "Importa tu lista de estudiantes con sus datos de contacto y matrículas.",
        gradient: "from-purple-600 to-violet-400",
        accentColor: "#7c3aed",
        fields: [
            { key: "firstName", label: "Nombre(s)", required: true, description: "Nombre o nombres del alumno" },
            { key: "lastName", label: "Apellidos", required: true, description: "Apellidos completos" },
            { key: "email", label: "Email", required: false, description: "Correo electrónico (opcional)" },
            { key: "phone", label: "Teléfono", required: false, description: "Número de contacto" },
            { key: "matricula", label: "Matrícula", required: false, description: "Número de matrícula interno" },
        ],
        exampleData: "Nombre(s)\tApellidos\tEmail\tTeléfono\tMatrícula\nJuan Carlos\tGómez López\tjuan@email.com\t555-1234\tALU001\nMaría\tRodríguez\tmaria@email.com\t555-5678\tALU002",
        tips: ["Puedes copiar directamente desde Excel o Google Sheets", "La matrícula es opcional pero ayuda a identificar duplicados"]
    },
    TEACHERS: {
        type: "TEACHERS",
        label: "Maestros / Personal",
        icon: Users,
        description: "Registra a tu equipo docente y personal administrativo.",
        gradient: "from-orange-500 to-amber-400",
        accentColor: "#f59e0b",
        fields: [
            { key: "name", label: "Nombre Completo", required: true, description: "Nombre y apellidos" },
            { key: "email", label: "Email", required: true, description: "Se usará para el acceso al sistema" },
            { key: "phone", label: "Teléfono", required: false },
            { key: "hourlyRate", label: "Pago por Hora", required: false, description: "En formato numérico (ej: 150)" },
        ],
        exampleData: "Nombre Completo\tEmail\tTeléfono\tPago por Hora\nProf. Ana García\tana@escuela.com\t555-1111\t200\nLic. Roberto Sánchez\troberto@escuela.com\t555-2222\t180",
        tips: ["Se creará automáticamente una cuenta de usuario para cada maestro", "El email será su usuario de acceso"]
    },
    COURSES: {
        type: "COURSES",
        label: "Cursos / Materias",
        icon: BookOpen,
        description: "Carga tu catálogo de materias, talleres o cursos ofertados.",
        gradient: "from-blue-600 to-cyan-400",
        accentColor: "#3b82f6",
        fields: [
            { key: "name", label: "Nombre del Curso", required: true },
            { key: "description", label: "Descripción", required: false },
            { key: "gradeLevel", label: "Nivel/Grado", required: false, description: "Ej: 1° Primaria, Avanzado" },
            { key: "schedule", label: "Horario", required: false, description: "Ej: Lunes y Miércoles 10:00-12:00" },
            { key: "room", label: "Aula/Salón", required: false },
        ],
        exampleData: "Nombre del Curso\tDescripción\tNivel/Grado\tHorario\tAula\nMatemáticas I\tÁlgebra básica\t1° Secundaria\tL-M-V 8:00\tAula 101\nInglés Avanzado\tConversación y gramática\tAdultos\tMartes 18:00\tAula 203",
        tips: ["Puedes asignar maestros después de importar", "El horario es solo informativo, no afecta el calendario"]
    },
    PRODUCTS: {
        type: "PRODUCTS",
        label: "Productos / Inventario",
        icon: Package,
        description: "Importa tu catálogo de productos para control de inventario y ventas.",
        gradient: "from-emerald-500 to-green-400",
        accentColor: "#10b981",
        fields: [
            { key: "name", label: "Nombre Producto", required: true },
            { key: "price", label: "Precio Venta", required: true, description: "Precio al público" },
            { key: "cost", label: "Costo", required: false, description: "Costo de compra/producción" },
            { key: "sku", label: "SKU/Código", required: false, description: "Código único del producto" },
            { key: "category", label: "Categoría", required: false },
            { key: "stock", label: "Stock Inicial", required: false, description: "Cantidad en inventario" },
        ],
        exampleData: "Nombre Producto\tPrecio Venta\tCosto\tSKU\tCategoría\tStock Inicial\nCamiseta Polo\t299.00\t120.00\tPOLO001\tRopa\t50\nPantalón Mezclilla\t599.00\t280.00\tPANT002\tRopa\t30",
        tips: ["El precio usa punto como decimal (299.00)", "El stock se actualizará en inventario automáticamente"]
    },
    CUSTOMERS: {
        type: "CUSTOMERS",
        label: "Clientes",
        icon: UserCircle,
        description: "Sube tu base de datos de clientes para facturación y CRM.",
        gradient: "from-pink-500 to-rose-400",
        accentColor: "#ec4899",
        fields: [
            { key: "name", label: "Nombre Cliente", required: true, description: "Nombre completo o razón social" },
            { key: "email", label: "Email", required: false },
            { key: "phone", label: "Teléfono", required: false },
            { key: "address", label: "Dirección", required: false },
        ],
        exampleData: "Nombre Cliente\tEmail\tTeléfono\tDirección\nEmpresa ABC S.A.\tcontacto@abc.com\t555-9999\tAv. Principal 123\nJosé Martínez\tjose@mail.com\t555-8888\tCalle Norte 456",
        tips: ["Incluye tanto personas físicas como empresas", "El email es útil para envío de facturas"]
    },
    MENU_ITEMS: {
        type: "MENU_ITEMS",
        label: "Menú / Platillos",
        icon: UtensilsCrossed,
        description: "Carga tu menú de platillos, bebidas y extras para tu restaurante.",
        gradient: "from-red-500 to-orange-400",
        accentColor: "#ef4444",
        fields: [
            { key: "name", label: "Nombre del Platillo", required: true },
            { key: "price", label: "Precio", required: true },
            { key: "category", label: "Categoría", required: false, description: "Ej: Entradas, Platos Fuertes, Bebidas" },
            { key: "description", label: "Descripción", required: false, description: "Ingredientes o detalles" },
        ],
        exampleData: "Nombre del Platillo\tPrecio\tCategoría\tDescripción\nTacos de Pastor\t85.00\tPlatos Fuertes\tCon cebolla, cilantro y piña\nAgua de Horchata\t35.00\tBebidas\t500ml",
        tips: ["Organiza por categorías para facilitar la navegación", "La descripción ayuda a tus meseros a explicar el platillo"]
    }
};

// --- Animations ---
const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const }
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

const staggerItem = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
};

export function DataImporter() {
    const { selectedBranch } = useBranch();
    const [importType, setImportType] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [step, setStep] = useState<"SELECT_TYPE" | "INPUT_METHOD" | "MAP" | "PREVIEW" | "IMPORTING" | "DONE">("SELECT_TYPE");
    const [importStats, setImportStats] = useState({ total: 0, success: 0, failed: 0 });
    const [pasteData, setPasteData] = useState("");
    const [inputMethod, setInputMethod] = useState<"FILE" | "PASTE">("PASTE");
    const [showHelp, setShowHelp] = useState(false);

    // Ref for manual file input fallback
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Function to detect and fix encoding issues (Latin-1 misread as UTF-8)
    const fixEncoding = (str: string): string => {
        if (!str) return str;
        // Common Latin-1 to UTF-8 character replacements
        return str
            .replace(/Ã¡/g, 'á')
            .replace(/Ã©/g, 'é')
            .replace(/Ã­/g, 'í')
            .replace(/Ã³/g, 'ó')
            .replace(/Ãº/g, 'ú')
            .replace(/Ã±/g, 'ñ')
            .replace(/Ã¼/g, 'ü')
            .replace(/Ã‰/g, 'É')
            .replace(/Ãš/g, 'Ú')
            .replace(/Ãœ/g, 'Ü')
            .replace(/Â¡/g, '¡')
            .replace(/Â¿/g, '¿');
    };

    // Manual file selection handler (fallback for when react-dropzone fails)
    const handleManualFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log("📂 Manual file select triggered");
        const files = event.target.files;
        if (!files || files.length === 0) {
            console.log("❌ No files selected");
            return;
        }

        const file = files[0];
        console.log("✅ File selected:", file.name, file.type, file.size);
        setFile(file);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: "binary", codepage: 65001 }); // Force UTF-8
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                console.log("📊 Excel parsed, rows:", jsonData.length);

                if (jsonData.length > 0) {
                    // Fix encoding for all string values
                    const fixedData = jsonData.map((row: any) => {
                        if (Array.isArray(row)) {
                            return row.map((cell: any) =>
                                typeof cell === 'string' ? fixEncoding(cell) : cell
                            );
                        }
                        return row;
                    });

                    const headers = fixedData[0] as string[];
                    setHeaders(headers);
                    setPreviewData(fixedData.slice(1));
                    autoMapColumns(headers);
                    setStep("PREVIEW");
                } else {
                    alert("El archivo parece estar vacío.");
                }
            } catch (err) {
                console.error("Error reading excel:", err);
                alert("Error al leer el archivo. Asegúrate de que sea un Excel válido.");
            }
        };
        reader.readAsBinaryString(file);

        // Reset input so the same file can be selected again
        event.target.value = '';
    };

    // Handler to trigger manual file input
    const triggerFileInput = () => {
        console.log("🖱️ Triggering file input");
        fileInputRef.current?.click();
    };

    // Determinar tipos disponibles según negocio
    const availableTypes = () => {
        // Mostrar siempre todos los tipos de importación para evitar confusión y permitir flexibilidad
        return ["STUDENTS", "TEACHERS", "COURSES", "PRODUCTS", "MENU_ITEMS", "CUSTOMERS"];
    };

    const getBusinessTypeLabel = () => {
        if (!selectedBranch?.business?.type) return "tu negocio";
        const labels: Record<string, string> = {
            "SCHOOL": "tu escuela",
            "RESTAURANT": "tu restaurante",
            "RETAIL": "tu tienda",
            "SERVICE": "tu negocio"
        };
        return labels[selectedBranch.business.type] || "tu negocio";
    };

    // Efecto para establecer el tipo inicial válido
    useEffect(() => {
        const types = availableTypes();
        if (types.length > 0 && !types.includes(importType)) {
            setImportType(types[0]);
        }
    }, [selectedBranch]);

    const handlePasteProcess = () => {
        if (!pasteData) return;
        const rows = pasteData.trim().split(/\r\n|\n|\r/);
        if (rows.length < 1) return;

        const headers = rows[0].split(/\t/);
        const data = rows.slice(1).map(row => {
            const values = row.split(/\t/);
            const obj: any = {};
            headers.forEach((header, index) => {
                obj[header.trim()] = values[index]?.trim();
            });
            return obj;
        });

        setHeaders(headers.map(h => h.trim()));
        setPreviewData(data);
        autoMapColumns(headers.map(h => h.trim()));
        // Saltar directamente a vista previa - el mapeo es automático
        setStep("PREVIEW");
    };

    const autoMapColumns = (fileHeaders: string[]) => {
        const newMapping: Record<string, string> = {};
        const config = IMPORT_CONFIGS[importType];
        if (!config) return;

        // Alias mappings for common variations
        const aliases: Record<string, string[]> = {
            firstName: ['nombre', 'nombres', 'nombre(s)', 'first name', 'firstname', 'primer nombre'],
            lastName: ['apellido', 'apellidos', 'last name', 'lastname', 'segundo nombre'],
            email: ['email', 'correo', 'e-mail', 'correo electrónico', 'mail'],
            phone: ['telefono', 'teléfono', 'tel', 'celular', 'móvil', 'movil', 'phone'],
            matricula: ['matricula', 'matrícula', 'id', 'código', 'codigo', 'clave'],
            name: ['nombre', 'nombre completo', 'full name'],
        };

        config.fields.forEach(field => {
            const fieldAliases = aliases[field.key] || [field.key.toLowerCase(), field.label.toLowerCase()];

            const match = fileHeaders.find(h => {
                const headerLower = h.toLowerCase().trim();
                return fieldAliases.some(alias =>
                    headerLower === alias ||
                    headerLower.includes(alias) ||
                    alias.includes(headerLower)
                );
            });

            if (match) newMapping[field.key] = match;
        });

        console.log("🗺️ Auto-mapped columns:", newMapping);
        setMapping(newMapping);
    };

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
        if (fileRejections.length > 0) {
            alert("El archivo no tiene el formato correcto. Por favor sube un archivo Excel (.xlsx o .xls).");
            return;
        }

        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];
        setFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: "binary" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                if (jsonData.length > 0) {
                    const headers = jsonData[0] as string[];
                    setHeaders(headers);
                    setPreviewData(jsonData.slice(1));
                    autoMapColumns(headers);
                    setStep("MAP");
                } else {
                    alert("El archivo parece estar vacío.");
                }
            } catch (err) {
                console.error("Error reading excel:", err);
                alert("Error al leer el archivo. Asegúrate de que sea un Excel válido.");
            }
        };
        reader.readAsBinaryString(file);
    }, [importType]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        noClick: false,
        noKeyboard: false,
        noDrag: false
    });

    const handleImport = async () => {
        console.log("🚀 handleImport called");
        console.log("📍 selectedBranch:", selectedBranch);

        if (!selectedBranch?.businessId) {
            console.error("❌ No businessId found!");
            alert("Error: No se encontró la sucursal seleccionada. Por favor recarga la página e intenta de nuevo.");
            return;
        }

        console.log("✅ Starting import for businessId:", selectedBranch.businessId);
        setStep("IMPORTING");
        let successCount = 0;
        let failedCount = 0;
        const config = IMPORT_CONFIGS[importType];

        // Map MENU_ITEMS to PRODUCTS for API compatibility
        const apiType = importType === "MENU_ITEMS" ? "PRODUCTS" : importType;

        const processedData = previewData.map((row: any) => {
            const item: any = {};
            // 1. Mapeo de columnas
            Object.entries(mapping).forEach(([targetField, sourceColumn]) => {
                if (Array.isArray(row)) {
                    const columnIndex = headers.indexOf(sourceColumn);
                    if (columnIndex !== -1) item[targetField] = row[columnIndex];
                } else {
                    item[targetField] = row[sourceColumn];
                }
            });

            // 2. Relleno de valores por defecto para campos requeridos vacíos
            config.fields.forEach(field => {
                const value = item[field.key];
                const isEmpty = value === undefined || value === null || String(value).trim() === "";

                if (field.required && isEmpty) {
                    // Aplicar valor por defecto según el campo
                    if (field.key === "email") {
                        // Generar email temporal único
                        item[field.key] = `no-email-${Date.now()}-${Math.floor(Math.random() * 1000)}@sistema.com`;
                    } else if (field.key === "price" || field.key === "cost" || field.key === "stock") {
                        item[field.key] = 0;
                    } else {
                        item[field.key] = `(Sin ${field.label})`;
                    }
                }
            });

            return item;
        }); // No filtramos nada, permitimos todo con rellenos

        console.log("📋 Current mapping:", mapping);
        console.log("📋 Headers:", headers);
        console.log("📋 Sample processed data (first 2):", processedData.slice(0, 2));

        try {
            const batchSize = 50;
            for (let i = 0; i < processedData.length; i += batchSize) {
                const batch = processedData.slice(i, i + batchSize);
                const response = await fetch("/api/import", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: apiType,
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
            setStep("PREVIEW");
        }
    };

    const handleDownloadTemplate = () => {
        try {
            const config = IMPORT_CONFIGS[importType];
            if (!config) {
                console.error("No config found for import type:", importType);
                return;
            }

            const wb = XLSX.utils.book_new();

            // Crear headers
            const headers = config.fields.map(f => f.label);

            // Intentar obtener fila de ejemplo de exampleData si existe
            let exampleRow: string[] = [];
            if (config.exampleData) {
                // Parsear primera línea de datos del ejemplo (asumiendo formato tab-separated del string de ejemplo)
                const rows = config.exampleData.trim().split('\n');
                if (rows.length > 1) { // 0 es headers, 1 es data
                    // Detectar si está separado por tabs o espacios múltiples
                    const dataLine = rows[1];
                    // Intento simple de separar por tabs primero
                    exampleRow = dataLine.includes('\t')
                        ? dataLine.split('\t')
                        : dataLine.split(/\s{2,}/); // Fallback a espacios múltiples si no hay tabs
                }
            }

            // Si no pudimos parsear, usamos strings vacíos
            if (exampleRow.length !== headers.length) {
                exampleRow = config.fields.map(f => "");
            }

            const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);

            // Ajustar anchos de columna automáticamente
            const colWidths = config.fields.map(f => ({ wch: Math.max(f.label.length + 5, 20) }));
            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, "Plantilla");

            // Sanitizar nombre de archivo
            const cleanLabel = config.label.replace(/[^a-zA-Z0-9]/g, '_');
            const fileName = `Plantilla_${cleanLabel}.xlsx`;

            console.log("Generating Excel template:", fileName);
            XLSX.writeFile(wb, fileName);
        } catch (error) {
            console.error("Error generating Excel template:", error);
            alert("Hubo un error al generar la plantilla. Por favor intenta de nuevo.");
        }
    };

    const handleCopyExample = () => {
        const config = IMPORT_CONFIGS[importType];
        if (config?.exampleData) {
            navigator.clipboard.writeText(config.exampleData);
            setPasteData(config.exampleData);
        }
    };

    const [isExporting, setIsExporting] = useState(false);

    const handleExportData = async (type: string) => {
        if (!selectedBranch?.businessId) {
            alert("No se encontró el negocio");
            return;
        }

        setIsExporting(true);

        try {
            let data: any[] = [];
            let fileName = "";
            let headers: string[] = [];

            if (type === "STUDENTS") {
                const res = await fetch(`/api/students?businessId=${selectedBranch.businessId}`);
                if (res.ok) {
                    const students = await res.json();
                    data = students.map((s: any) => ({
                        "Nombre": s.firstName,
                        "Apellido": s.lastName,
                        "Matrícula": s.matricula || "",
                        "Email": s.email || "",
                        "Teléfono": s.phone || "",
                        "Estado": s.status || "ACTIVE"
                    }));
                    headers = ["Nombre", "Apellido", "Matrícula", "Email", "Teléfono", "Estado"];
                    fileName = `alumnos_${new Date().toISOString().split('T')[0]}.xlsx`;
                }
            } else if (type === "COURSES") {
                const res = await fetch(`/api/courses?businessId=${selectedBranch.businessId}`);
                if (res.ok) {
                    const courses = await res.json();
                    data = courses.map((c: any) => ({
                        "Nombre": c.name,
                        "Descripción": c.description || "",
                        "Nivel": c.gradeLevel || "",
                        "Horario": c.schedule || "",
                        "Salón": c.room || "",
                        "Profesor": c.teacher?.name || ""
                    }));
                    headers = ["Nombre", "Descripción", "Nivel", "Horario", "Salón", "Profesor"];
                    fileName = `cursos_${new Date().toISOString().split('T')[0]}.xlsx`;
                }
            } else if (type === "PRODUCTS") {
                const res = await fetch(`/api/products?businessId=${selectedBranch.businessId}`);
                if (res.ok) {
                    const products = await res.json();
                    data = products.map((p: any) => ({
                        "Nombre": p.name,
                        "Descripción": p.description || "",
                        "SKU": p.sku || "",
                        "Código de barras": p.barcode || "",
                        "Precio": p.price,
                        "Costo": p.cost || "",
                        "Categoría": p.category || ""
                    }));
                    headers = ["Nombre", "Descripción", "SKU", "Código de barras", "Precio", "Costo", "Categoría"];
                    fileName = `productos_${new Date().toISOString().split('T')[0]}.xlsx`;
                }
            } else if (type === "TEACHERS") {
                const res = await fetch(`/api/employees?businessId=${selectedBranch.businessId}`);
                if (res.ok) {
                    const employees = await res.json();
                    const teachers = employees.filter((e: any) => e.role === "TEACHER");
                    data = teachers.map((t: any) => ({
                        "Nombre": t.firstName,
                        "Apellido": t.lastName,
                        "Email": t.email || "",
                        "Teléfono": t.phone || "",
                        "Rol": t.role
                    }));
                    headers = ["Nombre", "Apellido", "Email", "Teléfono", "Rol"];
                    fileName = `maestros_${new Date().toISOString().split('T')[0]}.xlsx`;
                }
            }

            if (data.length === 0) {
                alert("No hay datos para exportar");
                setIsExporting(false);
                return;
            }

            // Create workbook and worksheet
            const ws = XLSX.utils.json_to_sheet(data, { header: headers });

            // Set column widths
            ws['!cols'] = headers.map(() => ({ wch: 20 }));

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Datos");

            // Download
            XLSX.writeFile(wb, fileName);

        } catch (error) {
            console.error("Error exporting data:", error);
            alert("Error al exportar datos");
        } finally {
            setIsExporting(false);
        }
    };

    const reset = () => {
        setFile(null);
        setPasteData("");
        setPreviewData([]);
        setHeaders([]);
        setMapping({});
        setStep("SELECT_TYPE");
        setImportStats({ total: 0, success: 0, failed: 0 });
        setShowHelp(false);
    };

    // --- Sub-Components ---

    const StepIndicator = ({ currentStep }: { currentStep: string }) => {
        // Pasos simplificados con nombres súper claros
        const steps = [
            { id: "SELECT_TYPE", label: "1. Elige qué importar", icon: ClipboardList },
            { id: "INPUT_METHOD", label: "2. Pega tus datos", icon: Copy },
            { id: "DONE", label: "3. ¡Listo!", icon: Sparkles }
        ];

        const getStepIndex = (s: string) => {
            if (s === "INPUT_METHOD") return 1;
            if (s === "MAP" || s === "PREVIEW" || s === "IMPORTING") return 1; // Todos estos son parte del paso 2
            if (s === "DONE") return 2;
            return 0;
        };

        const currentIndex = getStepIndex(currentStep);
        const config = IMPORT_CONFIGS[importType];

        return (
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                {/* Progress Bar Container */}
                <div style={{ position: 'relative' }}>
                    {/* Background line */}
                    <div style={{
                        position: 'absolute',
                        top: '24px',
                        left: '60px',
                        right: '60px',
                        height: '4px',
                        background: 'var(--muted)',
                        borderRadius: 'var(--radius-full)'
                    }} />

                    {/* Active progress line */}
                    <motion.div
                        style={{
                            position: 'absolute',
                            top: '24px',
                            left: '60px',
                            height: '4px',
                            borderRadius: 'var(--radius-full)',
                            maxWidth: 'calc(100% - 120px)'
                        }}
                        className={config ? `gradient-${config.gradient.includes('purple') ? 'purple' : config.gradient.includes('blue') ? 'blue' : config.gradient.includes('orange') ? 'orange' : config.gradient.includes('green') ? 'green' : 'blue'}` : 'gradient-blue'}
                        initial={{ width: "0%" }}
                        animate={{ width: `${Math.min((currentIndex / (steps.length - 1)) * 100, 100)}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />

                    {/* Step circles */}
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
                        {steps.map((s, idx) => {
                            const StepIcon = s.icon;
                            const isActive = idx <= currentIndex;
                            const isCurrent = idx === currentIndex;

                            return (
                                <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <motion.div
                                        initial={false}
                                        animate={{
                                            scale: isCurrent ? 1.1 : 1,
                                            boxShadow: isCurrent
                                                ? '0 4px 20px rgba(59, 130, 246, 0.3)'
                                                : '0 2px 8px rgba(0, 0, 0, 0.05)'
                                        }}
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: 'var(--radius-full)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.3s ease',
                                            position: 'relative',
                                            zIndex: 10,
                                            background: isActive ? 'var(--primary-500)' : 'var(--bg)',
                                            color: isActive ? 'white' : 'var(--muted-text)',
                                            border: isActive ? 'none' : '2px solid var(--border)'
                                        }}
                                        className={isActive ? 'gradient-blue' : ''}
                                    >
                                        {idx < currentIndex ? (
                                            <Check className="w-5 h-5" />
                                        ) : (
                                            <StepIcon className="w-5 h-5" />
                                        )}
                                    </motion.div>
                                    <span style={{
                                        marginTop: 'var(--spacing-sm)',
                                        fontSize: 'var(--small)',
                                        fontWeight: 500,
                                        color: isActive ? 'var(--text)' : 'var(--muted-text)',
                                        transition: 'color 0.3s ease'
                                    }}>
                                        {s.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const Container = ({ children, title, subtitle, showBackButton, onBack }: {
        children: React.ReactNode,
        title?: string,
        subtitle?: string,
        showBackButton?: boolean,
        onBack?: () => void
    }) => {
        const config = IMPORT_CONFIGS[importType];

        return (
            <motion.div
                {...fadeIn}
                className="modern-card overflow-hidden"
            >
                {(title || subtitle) && (
                    <div className={cn(
                        "px-8 py-6 border-b border-slate-100/50",
                        config?.gradient ? `bg-gradient-to-r ${config.gradient}` : "gradient-blue"
                    )}>
                        <div className="flex items-center gap-4">
                            {showBackButton && onBack && (
                                <button
                                    onClick={onBack}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: 'var(--radius-lg)',
                                        background: 'rgba(255, 255, 255, 0.25)',
                                        border: '1px solid rgba(255, 255, 255, 0.4)',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '14px'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
                                >
                                    <ArrowLeft className="w-4 h-4 text-white" />
                                    Regresar
                                </button>
                            )}
                            <div>
                                {title && <h2 className="text-xl font-bold text-white">{title}</h2>}
                                {subtitle && <p className="text-sm text-white/80 mt-1">{subtitle}</p>}
                            </div>
                        </div>
                    </div>
                )}
                <div className="p-8">
                    {children}
                </div>
            </motion.div>
        );
    };

    const HelpPanel = () => {
        const config = IMPORT_CONFIGS[importType];
        if (!config) return null;

        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="fixed right-4 top-32 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-5 z-50"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className={cn("p-2 rounded-lg bg-gradient-to-br", config.gradient)}>
                            <Lightbulb className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-bold text-slate-800">Ayuda Rápida</h3>
                    </div>
                    <button
                        onClick={() => setShowHelp(false)}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="bg-slate-50 rounded-xl p-4">
                        <h4 className="font-semibold text-slate-700 text-sm mb-2">Cómo copiar desde Excel:</h4>
                        <ol className="text-xs text-slate-600 space-y-2">
                            <li className="flex gap-2">
                                <span className="font-bold text-slate-800">1.</span>
                                <span>Abre tu archivo en Excel o Google Sheets</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold text-slate-800">2.</span>
                                <span>Selecciona las celdas incluyendo encabezados</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold text-slate-800">3.</span>
                                <span>Presiona Ctrl+C (o Cmd+C en Mac)</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold text-slate-800">4.</span>
                                <span>Pega aquí con Ctrl+V (o Cmd+V)</span>
                            </li>
                        </ol>
                    </div>

                    {config.tips && config.tips.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-slate-700 text-sm mb-2">Tips:</h4>
                            <ul className="text-xs text-slate-600 space-y-1">
                                {config.tips.map((tip, i) => (
                                    <li key={i} className="flex gap-2">
                                        <span className="text-green-500">✓</span>
                                        <span>{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </motion.div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <h1 className="text-3xl font-bold text-slate-800 mb-2">
                    Importador de Datos
                </h1>
                <p className="text-slate-500">
                    Carga información masivamente a {getBusinessTypeLabel()} en pocos pasos
                </p>
            </motion.div>

            <StepIndicator currentStep={step} />

            {/* Help Button */}
            {step !== "SELECT_TYPE" && step !== "DONE" && step !== "IMPORTING" && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setShowHelp(!showHelp)}
                    className="fixed right-4 top-20 p-3 bg-white rounded-full shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors z-40"
                >
                    <HelpCircle className="w-5 h-5 text-slate-600" />
                </motion.button>
            )}

            <AnimatePresence>
                {showHelp && <HelpPanel />}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {step === "SELECT_TYPE" && (
                    <Container key="select" title="¿Qué deseas importar?" subtitle="Selecciona el tipo de información para comenzar">
                        <motion.div
                            variants={staggerContainer}
                            initial="initial"
                            animate="animate"
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                            {availableTypes().map(type => {
                                const config = IMPORT_CONFIGS[type];
                                if (!config) return null;
                                const Icon = config.icon;

                                return (
                                    <motion.button
                                        key={type}
                                        variants={staggerItem}
                                        onClick={() => {
                                            setImportType(type);
                                            setStep("INPUT_METHOD");
                                        }}
                                        className="modern-card card-hover-glow flex items-start p-5 text-left group relative overflow-hidden"
                                        whileHover={{ scale: 1.02, y: -4 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {/* Gradient overlay on hover */}
                                        <div
                                            className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                                            style={{ background: config.accentColor }}
                                        />

                                        <div style={{
                                            position: 'relative',
                                            zIndex: 10,
                                            padding: '12px',
                                            borderRadius: 'var(--radius-xl)',
                                            color: 'white',
                                            boxShadow: 'var(--shadow-lg)',
                                            background: config.gradient === "from-purple-600 to-violet-400" ? 'var(--gradient-purple)' :
                                                config.gradient === "from-orange-500 to-amber-400" ? 'var(--gradient-orange)' :
                                                    config.gradient === "from-blue-600 to-cyan-400" ? 'var(--gradient-blue)' :
                                                        config.gradient === "from-emerald-500 to-green-400" ? 'var(--gradient-green)' :
                                                            config.gradient === "from-pink-500 to-rose-400" ? 'var(--gradient-pink)' :
                                                                config.gradient === "from-red-500 to-orange-400" ? 'var(--gradient-red)' :
                                                                    'var(--gradient-blue)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div className="relative z-10 ml-4 flex-1">
                                            <h3 className="font-bold text-slate-800 group-hover:text-slate-900 text-lg">{config.label}</h3>
                                            <p className="text-sm text-slate-500 group-hover:text-slate-600 mt-1 leading-relaxed">{config.description}</p>
                                            <div className="mt-3 flex items-center text-xs font-medium text-slate-400 group-hover:text-slate-500">
                                                <span>{config.fields.length} campos</span>
                                                <span className="mx-2">•</span>
                                                <span>{config.fields.filter(f => f.required).length} requeridos</span>
                                            </div>
                                        </div>
                                        <ArrowRight className="relative z-10 w-5 h-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all self-center" />
                                    </motion.button>
                                );
                            })}
                        </motion.div>

                        {availableTypes().length === 0 && (
                            <div className="text-center py-12">
                                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">No hay tipos de importación disponibles para tu negocio.</p>
                            </div>
                        )}

                        {/* Export Section */}
                        <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '2px solid #E2E8F0' }}>
                            <h3 style={{
                                fontSize: '18px',
                                fontWeight: 'bold',
                                color: '#1E293B',
                                marginBottom: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <Download size={20} />
                                Exportar Datos
                            </h3>
                            <p style={{ color: '#64748B', marginBottom: '16px', fontSize: '14px' }}>
                                Descarga toda tu información en formato Excel
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                {availableTypes().map(type => {
                                    const config = IMPORT_CONFIGS[type];
                                    if (!config) return null;
                                    const Icon = config.icon;

                                    return (
                                        <button
                                            key={`export-${type}`}
                                            onClick={() => handleExportData(type)}
                                            disabled={isExporting}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '10px 16px',
                                                borderRadius: '10px',
                                                border: '1px solid #E2E8F0',
                                                backgroundColor: 'white',
                                                color: '#475569',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                cursor: isExporting ? 'wait' : 'pointer',
                                                transition: 'all 0.2s',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#F1F5F9';
                                                e.currentTarget.style.borderColor = '#CBD5E1';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'white';
                                                e.currentTarget.style.borderColor = '#E2E8F0';
                                            }}
                                        >
                                            <Icon size={16} />
                                            Exportar {config.label}
                                            <Download size={14} style={{ marginLeft: '4px', opacity: 0.5 }} />
                                        </button>
                                    );
                                })}
                            </div>
                            {isExporting && (
                                <div style={{ marginTop: '12px', color: '#3B82F6', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Loader2 className="animate-spin" size={16} />
                                    Exportando datos...
                                </div>
                            )}
                        </div>
                    </Container>
                )}

                {step === "INPUT_METHOD" && (
                    <Container
                        key="input"
                        title={`Pega tus ${IMPORT_CONFIGS[importType]?.label.toLowerCase() || 'datos'}`}
                        subtitle="Copia desde Excel o Google Sheets y pega aquí"
                        showBackButton
                        onBack={() => setStep("SELECT_TYPE")}
                    >
                        {/* Botón de regresar explícito */}
                        <button
                            onClick={() => setStep("SELECT_TYPE")}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 20px',
                                marginBottom: '20px',
                                background: 'var(--muted)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '14px',
                                color: 'var(--text)'
                            }}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            ← Regresar a selección
                        </button>

                        <div className="flex flex-col gap-6">
                            {/* Method Tabs */}
                            <div style={{
                                display: 'inline-flex',
                                padding: '6px',
                                background: 'var(--muted)',
                                borderRadius: 'var(--radius-xl)',
                                gap: 'var(--spacing-xs)'
                            }}>
                                <button
                                    onClick={() => setInputMethod("PASTE")}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: 'var(--radius-lg)',
                                        background: inputMethod === "PASTE" ? 'white' : 'transparent',
                                        color: inputMethod === "PASTE" ? 'var(--primary-600)' : 'var(--muted-text)',
                                        boxShadow: inputMethod === "PASTE" ? 'var(--shadow-sm)' : 'none',
                                        fontWeight: 600,
                                        fontSize: 'var(--small)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s ease',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Copy className="w-4 h-4" />
                                    Copiar y Pegar
                                    <span style={{
                                        fontSize: '10px',
                                        background: inputMethod === "PASTE" ? 'var(--primary-50)' : 'rgba(0,0,0,0.05)',
                                        color: inputMethod === "PASTE" ? 'var(--primary-600)' : 'var(--muted-text)',
                                        padding: '2px 8px',
                                        borderRadius: 'var(--radius-full)',
                                        marginLeft: '4px'
                                    }}>Recomendado</span>
                                </button>
                                <button
                                    onClick={() => setInputMethod("FILE")}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: 'var(--radius-lg)',
                                        background: inputMethod === "FILE" ? 'white' : 'transparent',
                                        color: inputMethod === "FILE" ? 'var(--primary-600)' : 'var(--muted-text)',
                                        boxShadow: inputMethod === "FILE" ? 'var(--shadow-sm)' : 'none',
                                        fontWeight: 600,
                                        fontSize: 'var(--small)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s ease',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <FileSpreadsheet className="w-4 h-4" />
                                    Subir Archivo Excel
                                </button>
                            </div>

                            {inputMethod === "PASTE" ? (
                                <motion.div {...fadeIn} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
                                    {/* Sección de ejemplo */}
                                    {IMPORT_CONFIGS[importType]?.exampleData && (
                                        <div className="modern-card" style={{ padding: 'var(--spacing-lg)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                                    <div className="p-3 rounded-xl gradient-orange">
                                                        <Lightbulb className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <h4 style={{ fontWeight: 700, fontSize: 'var(--body)', color: 'var(--text)', marginBottom: '4px' }}>Ejemplo de formato correcto</h4>
                                                        <p style={{ fontSize: 'var(--small)', color: 'var(--muted-text)' }}>Así deben verse tus datos al copiarlos desde Excel</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={handleCopyExample}
                                                    className="button-modern gradient-blue"
                                                    style={{ padding: '10px 20px', fontSize: 'var(--small)', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                >
                                                    <Copy className="w-4 h-4" />
                                                    Usar este ejemplo
                                                </button>
                                            </div>
                                            <pre style={{
                                                fontSize: 'var(--small)',
                                                color: 'var(--text)',
                                                background: 'var(--surface)',
                                                borderRadius: 'var(--radius-lg)',
                                                padding: 'var(--spacing-lg)',
                                                overflowX: 'auto',
                                                fontFamily: 'monospace',
                                                border: '1px solid var(--border)',
                                                lineHeight: 1.6
                                            }}>
                                                {IMPORT_CONFIGS[importType]?.exampleData}
                                            </pre>
                                        </div>
                                    )}

                                    {/* Editor de datos */}
                                    <div className="modern-card" style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: 'var(--spacing-md) var(--spacing-lg)',
                                            background: 'var(--surface)',
                                            borderBottom: '1px solid var(--border)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
                                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }} />
                                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }} />
                                                </div>
                                                <span style={{ fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <FileSpreadsheet className="w-5 h-5" style={{ color: 'var(--muted-text)' }} />
                                                    Editor de Datos
                                                </span>
                                            </div>
                                            <span style={{
                                                fontSize: 'var(--tiny)',
                                                fontWeight: 600,
                                                color: 'var(--success)',
                                                background: '#ecfdf5',
                                                padding: '6px 12px',
                                                borderRadius: 'var(--radius-full)',
                                                border: '1px solid #a7f3d0'
                                            }}>
                                                ✓ Tab-separated
                                            </span>
                                        </div>
                                        <Textarea
                                            placeholder={`Pega aquí tus datos desde Excel o Google Sheets...

La primera fila debe contener los encabezados de las columnas.
Las columnas deben estar separadas por tabulaciones (Tab).

Ejemplo:
Nombre(s)    Apellidos    Email    Teléfono    Matrícula
Juan Carlos    Gómez López    juan@email.com    555-1234    ALU001
María    Rodríguez    maria@email.com    555-5678    ALU002`}
                                            style={{
                                                minHeight: '400px',
                                                padding: 'var(--spacing-lg)',
                                                fontSize: 'var(--body)',
                                                fontFamily: 'monospace',
                                                lineHeight: 1.8,
                                                border: 'none',
                                                resize: 'none',
                                                background: 'var(--bg)'
                                            }}
                                            className="focus-visible:ring-0"
                                            value={pasteData}
                                            onChange={(e) => setPasteData(e.target.value)}
                                        />
                                    </div>

                                    {/* Footer */}
                                    <div className="modern-card" style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: 'var(--spacing-lg)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                            {pasteData.split('\n').filter(l => l.trim()).length > 1 ? (
                                                <>
                                                    <div className="p-2 rounded-lg gradient-green">
                                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                                    </div>
                                                    <span style={{ fontWeight: 600, fontSize: 'var(--body)', color: 'var(--success)' }}>
                                                        {pasteData.split('\n').filter(l => l.trim()).length - 1} registros detectados
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', background: 'var(--muted)' }}>
                                                        <AlertCircle className="w-5 h-5" style={{ color: 'var(--muted-text)' }} />
                                                    </div>
                                                    <span style={{ color: 'var(--muted-text)', fontWeight: 500 }}>Pega tus datos arriba para continuar</span>
                                                </>
                                            )}
                                        </div>
                                        <button
                                            onClick={handlePasteProcess}
                                            disabled={!pasteData.trim() || pasteData.split('\n').filter(l => l.trim()).length < 2}
                                            className={cn(
                                                "button-modern disabled:opacity-50 disabled:cursor-not-allowed",
                                                IMPORT_CONFIGS[importType]
                                                    ? (IMPORT_CONFIGS[importType].gradient === "from-purple-600 to-violet-400" ? "gradient-purple" :
                                                        IMPORT_CONFIGS[importType].gradient === "from-orange-500 to-amber-400" ? "gradient-orange" :
                                                            IMPORT_CONFIGS[importType].gradient === "from-blue-600 to-cyan-400" ? "gradient-blue" :
                                                                IMPORT_CONFIGS[importType].gradient === "from-emerald-500 to-green-400" ? "gradient-green" :
                                                                    IMPORT_CONFIGS[importType].gradient === "from-pink-500 to-rose-400" ? "gradient-pink" :
                                                                        IMPORT_CONFIGS[importType].gradient === "from-red-500 to-orange-400" ? "gradient-red" :
                                                                            "gradient-blue")
                                                    : "gradient-blue"
                                            )}
                                            style={{ padding: '12px 24px', fontSize: 'var(--body)', display: 'flex', alignItems: 'center', gap: '12px' }}
                                        >
                                            <span>Procesar Datos</span>
                                            <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div {...fadeIn} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
                                    {/* Hidden file input for manual selection */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleManualFileSelect}
                                        style={{ display: 'none' }}
                                    />

                                    {/* Clickable dropzone area */}
                                    <div
                                        onClick={triggerFileInput}
                                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log("🎯 File dropped via native handler");
                                            const files = e.dataTransfer.files;
                                            if (files && files.length > 0) {
                                                const file = files[0];
                                                console.log("✅ Dropped file:", file.name);
                                                setFile(file);
                                                const reader = new FileReader();
                                                reader.onload = (ev) => {
                                                    try {
                                                        const data = ev.target?.result;
                                                        const workbook = XLSX.read(data, { type: "binary", codepage: 65001 });
                                                        const sheetName = workbook.SheetNames[0];
                                                        const sheet = workbook.Sheets[sheetName];
                                                        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                                                        if (jsonData.length > 0) {
                                                            // Fix encoding for all string values
                                                            const fixedData = jsonData.map((row: any) => {
                                                                if (Array.isArray(row)) {
                                                                    return row.map((cell: any) =>
                                                                        typeof cell === 'string' ? fixEncoding(cell) : cell
                                                                    );
                                                                }
                                                                return row;
                                                            });
                                                            const headers = fixedData[0] as string[];
                                                            setHeaders(headers);
                                                            setPreviewData(fixedData.slice(1));
                                                            autoMapColumns(headers);
                                                            setStep("PREVIEW");
                                                        } else {
                                                            alert("El archivo parece estar vacío.");
                                                        }
                                                    } catch (err) {
                                                        console.error("Error reading excel:", err);
                                                        alert("Error al leer el archivo.");
                                                    }
                                                };
                                                reader.readAsBinaryString(file);
                                            }
                                        }}
                                        style={{
                                            border: '2px dashed var(--border)',
                                            borderRadius: 'var(--radius-xl)',
                                            padding: 'var(--spacing-2xl)',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            background: 'var(--surface)',
                                            transition: 'all 0.3s ease',
                                            position: 'relative'
                                        }}
                                        className="hover-dropzone"
                                    >
                                        <div
                                            style={{
                                                pointerEvents: 'none',
                                                width: '80px',
                                                height: '80px',
                                                borderRadius: 'var(--radius-xl)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                margin: '0 auto var(--spacing-lg)',
                                                boxShadow: 'var(--shadow-lg)'
                                            }}
                                            className={IMPORT_CONFIGS[importType]
                                                ? (IMPORT_CONFIGS[importType].gradient === "from-purple-600 to-violet-400" ? "gradient-purple" :
                                                    IMPORT_CONFIGS[importType].gradient === "from-orange-500 to-amber-400" ? "gradient-orange" :
                                                        IMPORT_CONFIGS[importType].gradient === "from-blue-600 to-cyan-400" ? "gradient-blue" :
                                                            IMPORT_CONFIGS[importType].gradient === "from-emerald-500 to-green-400" ? "gradient-green" :
                                                                IMPORT_CONFIGS[importType].gradient === "from-pink-500 to-rose-400" ? "gradient-pink" :
                                                                    IMPORT_CONFIGS[importType].gradient === "from-red-500 to-orange-400" ? "gradient-red" :
                                                                        "gradient-blue")
                                                : "gradient-blue"}
                                        >
                                            <Upload className="w-10 h-10 text-white" style={{ pointerEvents: 'none' }} />
                                        </div>
                                        <h3 style={{ fontSize: 'var(--h3)', fontWeight: 700, color: 'var(--text)', marginBottom: 'var(--spacing-sm)', pointerEvents: 'none' }}>
                                            Arrastra tu archivo de Excel
                                        </h3>
                                        <p style={{ color: 'var(--muted-text)', marginBottom: 'var(--spacing-lg)', pointerEvents: 'none' }}>o haz clic para seleccionar</p>
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '6px 12px',
                                            background: 'var(--bg)',
                                            borderRadius: 'var(--radius-full)',
                                            fontSize: 'var(--tiny)',
                                            color: 'var(--muted-text)',
                                            border: '1px solid var(--border)',
                                            pointerEvents: 'none'
                                        }}>
                                            <FileSpreadsheet className="w-4 h-4" style={{ pointerEvents: 'none' }} />
                                            <span style={{ pointerEvents: 'none' }}>Formatos soportados: .xlsx, .xls</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={handleDownloadTemplate}
                                            style={{
                                                padding: '12px 24px',
                                                borderRadius: 'var(--radius-lg)',
                                                border: '1px solid var(--border)',
                                                background: 'white',
                                                color: 'var(--text)',
                                                fontWeight: 600,
                                                fontSize: 'var(--small)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                cursor: 'pointer',
                                                boxShadow: 'var(--shadow-sm)',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'var(--bg)';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'white';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            <Download className="w-5 h-5 text-slate-500" />
                                            Descargar Plantilla de Excel
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </Container>
                )}


                {
                    step === "MAP" && (
                        <Container
                            key="map"
                            title="Mapeo de Columnas"
                            subtitle="Verifica que las columnas de tu archivo coincidan con nuestros campos"
                            showBackButton
                            onBack={() => setStep("INPUT_METHOD")}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                {IMPORT_CONFIGS[importType]?.fields.map((field) => {
                                    const isMapped = !!mapping[field.key];
                                    return (
                                        <motion.div
                                            key={field.key}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn(
                                                "p-4 rounded-xl border-2 transition-all",
                                                isMapped
                                                    ? "bg-green-50 border-green-200"
                                                    : field.required
                                                        ? "bg-red-50 border-red-200"
                                                        : "bg-slate-50 border-slate-200"
                                            )}
                                        >
                                            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                                                {isMapped && <Check className="w-3 h-3 text-green-600" />}
                                                {field.label}
                                                {field.required && <span className="text-red-500 font-normal">*</span>}
                                            </label>
                                            {field.description && (
                                                <p className="text-xs text-slate-500 mb-2">{field.description}</p>
                                            )}
                                            <Select
                                                value={mapping[field.key] || ""}
                                                onValueChange={(value) => setMapping({ ...mapping, [field.key]: value })}
                                            >
                                                <SelectTrigger className={cn(
                                                    "bg-white border-slate-200",
                                                    isMapped && "border-green-300"
                                                )}>
                                                    <SelectValue placeholder="Seleccionar columna..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {headers.map((header) => (
                                                        <SelectItem key={header} value={header}>{header}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-between items-center border-t border-slate-100 pt-6">
                                <div className="text-sm text-slate-500">
                                    {Object.keys(mapping).length} de {IMPORT_CONFIGS[importType]?.fields.length} campos mapeados
                                </div>
                                <Button
                                    onClick={() => setStep("PREVIEW")}
                                    disabled={!IMPORT_CONFIGS[importType]?.fields.every(f => !f.required || mapping[f.key])}
                                    className={cn(
                                        "px-6 py-3 font-semibold shadow-lg",
                                        IMPORT_CONFIGS[importType]
                                            ? `bg-gradient-to-r ${IMPORT_CONFIGS[importType].gradient} hover:opacity-90`
                                            : "bg-blue-600 hover:bg-blue-700"
                                    )}
                                >
                                    Continuar <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </Container>
                    )
                }

                {
                    step === "PREVIEW" && (
                        <Container
                            key="preview"
                            title="¡Todo listo para importar!"
                            subtitle={`Encontramos ${previewData.length} ${IMPORT_CONFIGS[importType]?.label.toLowerCase() || 'registros'} para agregar`}
                            showBackButton
                            onBack={() => setStep("INPUT_METHOD")}
                        >
                            {/* Botón de regresar explícito - PREVIEW */}
                            <button
                                onClick={() => {
                                    console.log("🔙 Back button clicked");
                                    setStep("INPUT_METHOD");
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 24px',
                                    marginBottom: '20px',
                                    background: '#f1f5f9',
                                    border: '2px solid #cbd5e1',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: '15px',
                                    color: '#334155'
                                }}
                            >
                                <ArrowLeft className="w-5 h-5" />
                                ← Regresar a método de entrada
                            </button>

                            <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
                                <div className="max-h-[400px] overflow-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50 sticky top-0">
                                            <TableRow>
                                                <TableHead className="w-12 text-center font-bold text-slate-600">#</TableHead>
                                                {IMPORT_CONFIGS[importType]?.fields.map(f => (
                                                    <TableHead key={f.key} className="whitespace-nowrap font-bold text-slate-700">
                                                        {f.label}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {previewData.slice(0, 10).map((row, i) => (
                                                <TableRow key={i} className="hover:bg-slate-50">
                                                    <TableCell className="text-center text-slate-400 text-sm">{i + 1}</TableCell>
                                                    {IMPORT_CONFIGS[importType]?.fields.map(f => {
                                                        const sourceCol = mapping[f.key];
                                                        let val = "-";
                                                        if (inputMethod === "FILE") {
                                                            const colIndex = headers.indexOf(sourceCol);
                                                            if (colIndex !== -1) val = row[colIndex];
                                                        } else {
                                                            val = row[sourceCol];
                                                        }
                                                        return (
                                                            <TableCell key={f.key} className="text-slate-600">
                                                                {val || <span className="text-slate-300">—</span>}
                                                            </TableCell>
                                                        );
                                                    })}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                {previewData.length > 10 && (
                                    <div className="p-4 text-center text-sm text-slate-500 bg-slate-50/50 border-t">
                                        <span className="font-medium">... y {previewData.length - 10} registros más</span>
                                    </div>
                                )}
                            </div>

                            <div style={{
                                marginTop: '24px',
                                padding: '16px 0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                width: '100%',
                                flexWrap: 'wrap',
                                gap: '16px'
                            }}>
                                <button
                                    onClick={() => setStep("MAP")}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '14px 24px',
                                        background: 'white',
                                        border: '2px solid var(--border)',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        color: 'var(--text)'
                                    }}
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Corregir Mapeo
                                </button>
                                <button
                                    onClick={() => {
                                        console.log("🟢 Confirm button clicked!");
                                        handleImport();
                                    }}
                                    style={{
                                        background: 'linear-gradient(to right, #22c55e, #34d399)',
                                        color: 'white',
                                        fontWeight: 600,
                                        padding: '16px 32px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '16px',
                                        boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)',
                                        minWidth: '200px'
                                    }}
                                >
                                    <Check className="w-5 h-5" />
                                    Confirmar Importación
                                </button>
                            </div>
                        </Container>
                    )
                }

                {
                    step === "IMPORTING" && (
                        <motion.div
                            key="importing"
                            {...fadeIn}
                            className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl shadow-xl"
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                className={cn(
                                    "w-24 h-24 rounded-full flex items-center justify-center mb-8",
                                    "bg-gradient-to-r",
                                    IMPORT_CONFIGS[importType]?.gradient || "from-blue-500 to-blue-600"
                                )}
                            >
                                <Loader2 className="w-12 h-12 text-white" />
                            </motion.div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Importando tus datos...</h3>
                            <p className="text-slate-500">Esto puede tomar unos segundos</p>
                            <div className="mt-8 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" style={{ animationDelay: "0ms" }} />
                                <div className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" style={{ animationDelay: "150ms" }} />
                                <div className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" style={{ animationDelay: "300ms" }} />
                            </div>
                        </motion.div>
                    )
                }

                {
                    step === "DONE" && (
                        <Container key="done">
                            <div className="text-center py-12">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                    className="w-28 h-28 bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-200"
                                >
                                    <Check className="w-14 h-14" />
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <h2 className="text-3xl font-bold text-slate-800 mb-3">¡Importación Exitosa!</h2>
                                    <p className="text-slate-500 mb-10">Tus {IMPORT_CONFIGS[importType]?.label.toLowerCase()} han sido importados correctamente.</p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="grid grid-cols-2 gap-6 max-w-md mx-auto mb-12"
                                >
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100">
                                        <Sparkles className="w-6 h-6 text-green-500 mx-auto mb-2" />
                                        <p className="text-4xl font-bold text-green-600">{importStats.success}</p>
                                        <p className="text-sm font-semibold text-green-600/70 uppercase tracking-wider mt-1">Importados</p>
                                    </div>
                                    {importStats.failed > 0 && (
                                        <div className="bg-gradient-to-br from-red-50 to-rose-50 p-6 rounded-2xl border border-red-100">
                                            <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                                            <p className="text-4xl font-bold text-red-600">{importStats.failed}</p>
                                            <p className="text-sm font-semibold text-red-600/70 uppercase tracking-wider mt-1">Con errores</p>
                                        </div>
                                    )}
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}
                                >
                                    <button
                                        onClick={reset}
                                        style={{
                                            background: 'linear-gradient(to right, #3b82f6, #6366f1)',
                                            color: 'white',
                                            fontWeight: 700,
                                            padding: '16px 40px',
                                            borderRadius: '12px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            fontSize: '16px',
                                            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)'
                                        }}
                                    >
                                        <Sparkles className="w-5 h-5" />
                                        Importar más datos
                                    </button>
                                </motion.div>
                            </div>
                        </Container>
                    )
                }
            </AnimatePresence >
        </div >
    );
}
