"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Search, Printer, Download } from "lucide-react";

export function ReportCardGenerator() {
    const [searchTerm, setSearchTerm] = useState("");
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [reportData, setReportData] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        const res = await fetch("/api/students");
        const data = await res.json();
        setStudents(data);
    };

    const generateReport = async (studentId: string) => {
        const res = await fetch(`/api/reports/student?studentId=${studentId}`);
        const data = await res.json();
        setReportData(data);
        setSelectedStudent(students.find(s => s.id === studentId));
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        const input = document.getElementById('report-card');
        if (!input) return;

        setIsGenerating(true);
        try {
            const canvas = await html2canvas(input, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff"
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`${reportData.student.name.replace(/\s+/g, '_')}_Boleta.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.matricula && s.matricula.includes(searchTerm))
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4 print:hidden">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar alumno..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1 border rounded-md p-4 h-[600px] overflow-y-auto print:hidden">
                    <h3 className="font-medium mb-4">Alumnos</h3>
                    <div className="space-y-2">
                        {filteredStudents.map(student => (
                            <div
                                key={student.id}
                                className={`p-2 rounded cursor-pointer hover:bg-accent ${selectedStudent?.id === student.id ? 'bg-accent' : ''}`}
                                onClick={() => generateReport(student.id)}
                            >
                                <div className="font-medium">{student.firstName} {student.lastName}</div>
                                <div className="text-xs text-muted-foreground">{student.matricula}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="md:col-span-3">
                    {reportData ? (
                        <div className="space-y-4">
                            <div className="flex justify-end gap-2 print:hidden">
                                <Button variant="outline" onClick={handlePrint}>
                                    <Printer className="mr-2 h-4 w-4" /> Imprimir
                                </Button>
                                <Button onClick={handleDownloadPDF} disabled={isGenerating}>
                                    <Download className="mr-2 h-4 w-4" />
                                    {isGenerating ? "Generando..." : "Descargar PDF"}
                                </Button>
                            </div>

                            <div className="border p-8 bg-white text-black print:border-0 print:p-0" id="report-card">
                                <div className="text-center mb-8 border-b pb-4">
                                    <h1 className="text-2xl font-bold uppercase">{reportData.school.name}</h1>
                                    <p className="text-sm text-gray-500">Boleta de Calificaciones</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div>
                                        <p className="text-sm text-gray-500">Alumno:</p>
                                        <p className="font-bold">{reportData.student.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Matrícula:</p>
                                        <p className="font-bold">{reportData.student.matricula || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Grupo/Grado:</p>
                                        <p className="font-bold">{reportData.student.group}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Fecha:</p>
                                        <p className="font-bold">{new Date().toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <table className="w-full border-collapse mb-8">
                                    <thead>
                                        <tr className="border-b-2 border-black">
                                            <th className="text-left py-2">Materia / Curso</th>
                                            <th className="text-center py-2">Faltas</th>
                                            <th className="text-right py-2">Promedio Final</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.courses.map((course: any, index: number) => (
                                            <tr key={index} className="border-b border-gray-200">
                                                <td className="py-3">
                                                    <div className="font-bold">{course.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {course.grades.map((g: any) => `${g.name}: ${g.score}/${g.max}`).join(', ')}
                                                    </div>
                                                </td>
                                                <td className="text-center py-3">{course.absences}</td>
                                                <td className="text-right py-3 font-bold text-lg">{course.average}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="mt-16 flex justify-between text-center">
                                    <div className="border-t border-black w-1/3 pt-2">
                                        <p className="text-sm">Firma del Director</p>
                                    </div>
                                    <div className="border-t border-black w-1/3 pt-2">
                                        <p className="text-sm">Firma del Tutor</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Selecciona un alumno para ver su boleta
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
