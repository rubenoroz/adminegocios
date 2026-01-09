
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/students/[studentId]/billing-profiles
// Returns all billing profiles (Customers) linked to the student
export async function GET(
    req: Request,
    { params }: { params: Promise<{ studentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { studentId } = await params;

        const student = await prisma.student.findUnique({
            where: { id: studentId, businessId: session.user.businessId! },
            include: {
                billingProfiles: {
                    select: {
                        id: true,
                        name: true,
                        taxId: true,
                        legalName: true,
                        taxZipCode: true,
                        taxRegime: true,
                        address: true,
                        email: true
                    }
                }
            }
        });

        if (!student) {
            return new NextResponse("Student not found", { status: 404 });
        }

        return NextResponse.json(student.billingProfiles);
    } catch (error: any) {
        console.error("[BILLING_PROFILES_GET]", error);
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
    }
}

// POST /api/students/[studentId]/billing-profiles
// Creates a new billing profile OR links an existing one
export async function POST(
    req: Request,
    { params }: { params: Promise<{ studentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { studentId } = await params;
        const body = await req.json();

        // Mode 1: Link existing Customer Profile
        if (body.customerId) {
            const result = await prisma.student.update({
                where: { id: studentId },
                data: {
                    billingProfiles: {
                        connect: { id: body.customerId }
                    }
                }
            });
            return NextResponse.json(result);
        }

        // Mode 2: Create NEW Customer Profile and Link it
        // Check if customer already exists by RFC (TaxId)
        if (body.taxId) {
            const existingCustomer = await prisma.customer.findFirst({
                where: {
                    taxId: body.taxId,
                    businessId: session.user.businessId!
                }
            });

            if (existingCustomer) {
                // If exists, just link it
                const result = await prisma.student.update({
                    where: { id: studentId },
                    data: {
                        billingProfiles: {
                            connect: { id: existingCustomer.id }
                        }
                    }
                });
                return NextResponse.json(existingCustomer);
            }
        }

        // Create new customer
        const newCustomer = await prisma.customer.create({
            data: {
                businessId: session.user.businessId!,
                name: body.legalName || body.name || "Sin Nombre", // Fallback
                legalName: body.legalName,
                taxId: body.taxId,
                taxRegime: body.taxRegime,
                taxZipCode: body.taxZipCode,
                address: body.address,
                email: body.email,

                // Automatically link to student
                students: {
                    connect: { id: studentId }
                }
            }
        });

        return NextResponse.json(newCustomer);

    } catch (error) {
        console.error("[BILLING_PROFILES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
