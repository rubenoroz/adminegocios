import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PayrollReceiptData {
    // Business Info
    businessName: string;
    businessAddress?: string;
    businessRfc?: string;
    logoUrl?: string;

    // Employee Info
    employeeName: string;
    employeeRole: string;
    employeeId: string;
    employeeRfc?: string;

    // Payment Details
    period: string;
    paymentDate: string;
    baseSalary: number;

    // Deductions
    deductions: {
        label: string;
        amount: number;
    }[];

    // Perceptions/Bonuses (now includes commissions)
    perceptions: {
        label: string;
        amount: number;
    }[];
}

// Default deduction percentages
const DEFAULT_DEDUCTIONS = {
    IMSS: 0.03,  // 3%
    ISR: 0.10,   // 10% simplified
};

/**
 * Calculate payroll details including commissions
 * @param baseSalary - Fixed salary amount
 * @param commissions - Pending commissions amount (optional)
 */
export function calculatePayrollDetails(baseSalary: number, commissions: number = 0, reservePercentage: number = 0) {
    const totalGross = baseSalary + commissions;

    // Reserve calculation (applied to commissions or total? usually commissions based on context)
    // "Example: Total * (1 - Reserve%)" implied it applies to the commission part in the UI context.
    // Let's assume it applies to commissions as per previous user request context ("retiene de la comisión").
    const reserveAmount = commissions * (reservePercentage / 100);

    const imss = totalGross * DEFAULT_DEDUCTIONS.IMSS;
    const isr = totalGross * DEFAULT_DEDUCTIONS.ISR;

    const totalDeductions = imss + isr + reserveAmount;
    const netSalary = totalGross - totalDeductions;

    // Build perceptions array
    const perceptions: { label: string; amount: number }[] = [];
    if (commissions > 0) {
        perceptions.push({ label: 'Comisiones por Clases', amount: commissions });
    }

    const deductions = [
        { label: 'IMSS (3%)', amount: imss },
        { label: 'ISR (10%)', amount: isr },
    ];

    if (reserveAmount > 0) {
        deductions.push({ label: `Fondo de Reserva (${reservePercentage}%)`, amount: reserveAmount });
    }

    return {
        baseSalary,
        perceptions,
        deductions,
        totalGross,
        totalDeductions,
        netSalary,
    };
}

export async function generatePayrollReceiptPDF(data: PayrollReceiptData): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Colors
    const primaryColor: [number, number, number] = [15, 23, 42];
    const accentColor: [number, number, number] = [99, 102, 241];
    const mutedColor: [number, number, number] = [100, 116, 139];

    let yPos = 20;

    // Header with gradient-like effect
    doc.setFillColor(...accentColor);
    doc.rect(0, 0, pageWidth, 45, 'F');

    // Business Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(data.businessName, 20, yPos + 5);

    // Receipt title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('RECIBO DE NÓMINA', pageWidth - 20, yPos + 5, { align: 'right' });

    yPos = 35;
    if (data.businessAddress) {
        doc.setFontSize(10);
        doc.text(data.businessAddress, 20, yPos);
    }
    if (data.businessRfc) {
        doc.text(`RFC: ${data.businessRfc}`, pageWidth - 20, yPos, { align: 'right' });
    }

    yPos = 60;

    // Employee Info Section
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL EMPLEADO', 20, yPos);

    yPos += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    // Employee details in two columns
    doc.setTextColor(...mutedColor);
    doc.text('Nombre:', 20, yPos);
    doc.text('Puesto:', 110, yPos);

    yPos += 6;
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(data.employeeName, 20, yPos);
    doc.text(data.employeeRole, 110, yPos);

    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    doc.text('ID Empleado:', 20, yPos);
    doc.text('Periodo:', 110, yPos);

    yPos += 6;
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(data.employeeId.slice(-8).toUpperCase(), 20, yPos);
    doc.text(data.period, 110, yPos);

    if (data.employeeRfc) {
        yPos += 10;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...mutedColor);
        doc.text('RFC:', 20, yPos);
        yPos += 6;
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text(data.employeeRfc, 20, yPos);
    }

    yPos += 20;

    // Separator line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, pageWidth - 20, yPos);

    yPos += 15;

    // Payment Details Table
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DEL PAGO', 20, yPos);

    yPos += 10;

    // Build table data
    const tableData: (string | number)[][] = [];

    // Base salary
    tableData.push(['Salario Base', '', formatCurrency(data.baseSalary)]);

    // Perceptions (including commissions)
    if (data.perceptions.length > 0) {
        tableData.push(['PERCEPCIONES', '', '']);
        data.perceptions.forEach(p => {
            tableData.push(['  ' + p.label, '', '+' + formatCurrency(p.amount)]);
        });
    }

    // Deductions
    if (data.deductions.length > 0) {
        tableData.push(['DEDUCCIONES', '', '']);
        data.deductions.forEach(d => {
            tableData.push(['  ' + d.label, '', '-' + formatCurrency(d.amount)]);
        });
    }

    // Calculate totals
    const totalPerceptions = data.perceptions.reduce((sum, p) => sum + p.amount, 0);
    const totalDeductions = data.deductions.reduce((sum, d) => sum + d.amount, 0);
    const netSalary = data.baseSalary + totalPerceptions - totalDeductions;

    autoTable(doc, {
        startY: yPos,
        head: [['Concepto', '', 'Monto']],
        body: tableData,
        theme: 'plain',
        headStyles: {
            fillColor: [241, 245, 249],
            textColor: primaryColor,
            fontStyle: 'bold',
            fontSize: 11,
        },
        bodyStyles: {
            textColor: primaryColor,
            fontSize: 10,
        },
        columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 30 },
            2: { cellWidth: 40, halign: 'right' },
        },
        margin: { left: 20, right: 20 },
        didParseCell: (data: any) => {
            if (data.row.raw[0] === 'PERCEPCIONES') {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [236, 253, 245]; // emerald-50
                data.cell.styles.textColor = [5, 150, 105]; // emerald-600
            }
            if (data.row.raw[0] === 'DEDUCCIONES') {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [254, 242, 242]; // red-50
                data.cell.styles.textColor = [220, 38, 38]; // red-600
            }
        },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Net Salary Box
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(20, yPos, pageWidth - 40, 30, 3, 3, 'F');

    doc.setTextColor(5, 150, 105);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('NETO A PAGAR', 30, yPos + 12);

    doc.setFontSize(20);
    doc.text(formatCurrency(netSalary), pageWidth - 30, yPos + 18, { align: 'right' });

    yPos += 45;

    // Payment Date
    doc.setTextColor(...mutedColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de pago: ${data.paymentDate}`, 20, yPos);

    yPos += 30;

    // Signatures section
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);

    // Employee signature
    doc.line(20, yPos, 90, yPos);
    doc.setTextColor(...mutedColor);
    doc.setFontSize(9);
    doc.text('Firma del Empleado', 35, yPos + 8);

    // Company signature
    doc.line(120, yPos, pageWidth - 20, yPos);
    doc.text('Firma del Empleador', pageWidth - 55, yPos + 8);

    // Footer
    yPos = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(8);
    doc.setTextColor(...mutedColor);
    doc.text('Este documento es un comprobante de pago. Consérvelo para sus registros.', pageWidth / 2, yPos, { align: 'center' });

    return doc.output('blob');
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
    }).format(amount);
}

export function downloadPayrollReceipt(blob: Blob, employeeName: string, period: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recibo_nomina_${employeeName.replace(/\s+/g, '_')}_${period.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
