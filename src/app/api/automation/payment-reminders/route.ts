import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emailService } from "@/lib/email";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { businessId } = await req.json();

        if (!businessId) {
            return new NextResponse("Business ID required", { status: 400 });
        }

        // 1. Find all PENDING or OVERDUE fees
        const overdueFees = await prisma.studentFee.findMany({
            where: {
                student: { businessId },
                status: { in: ["PENDING", "OVERDUE"] },
                // Optional: Filter by due date? e.g. dueDate < now + 5 days
            },
            include: {
                student: {
                    include: {
                        parents: {
                            include: { parent: true }
                        }
                    }
                }
            }
        });

        // 2. Group by Parent Email
        const emailGroups: Record<string, { parentName: string, fees: any[] }> = {};

        overdueFees.forEach((fee: any) => {
            fee.student.parents.forEach((sp: any) => {
                if (sp.parent.email) {
                    if (!emailGroups[sp.parent.email]) {
                        emailGroups[sp.parent.email] = {
                            parentName: "Padre de Familia", // We might want to fetch parent name if available
                            fees: []
                        };
                    }
                    emailGroups[sp.parent.email].fees.push({
                        studentName: `${fee.student.firstName} ${fee.student.lastName}`,
                        title: fee.title,
                        amount: fee.amount,
                        dueDate: fee.dueDate
                    });
                }
            });
        });

        // 3. Send Emails
        let sentCount = 0;
        const results = [];

        for (const [email, data] of Object.entries(emailGroups)) {
            const totalDue = data.fees.reduce((sum, f) => sum + f.amount, 0);

            const feesHtml = data.fees.map(f => `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${f.studentName}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${f.title}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">$${f.amount.toFixed(2)}</td>
                </tr>
            `).join("");

            const html = `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #1a73e8;">Recordatorio de Pago</h2>
                    <p>Estimado padre de familia,</p>
                    <p>Le recordamos que tiene los siguientes pagos pendientes:</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <thead>
                            <tr style="background: #f5f5f5; text-align: left;">
                                <th style="padding: 8px;">Alumno</th>
                                <th style="padding: 8px;">Concepto</th>
                                <th style="padding: 8px;">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${feesHtml}
                        </tbody>
                        <tfoot>
                            <tr style="font-weight: bold;">
                                <td colspan="2" style="padding: 8px; text-align: right;">Total a Pagar:</td>
                                <td style="padding: 8px;">$${totalDue.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <p>Puede realizar su pago directamente en el <a href="${process.env.NEXTAUTH_URL}/parent/login">Portal de Padres</a>.</p>
                    <p>Si ya realizó su pago, favor de hacer caso omiso a este mensaje.</p>
                </div>
            `;

            try {
                await emailService.sendEmail({
                    to: email,
                    subject: "Recordatorio de Pago - Escuela",
                    html
                });
                sentCount++;
                results.push({ email, status: "sent" });
            } catch (error) {
                console.error(`Failed to send reminder to ${email}`, error);
                results.push({ email, status: "failed" });
            }
        }

        return NextResponse.json({
            message: `Processed ${Object.keys(emailGroups).length} parents. Sent ${sentCount} emails.`,
            details: results
        });

    } catch (error) {
        console.error("[PAYMENT_REMINDERS]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
