import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { type, data, businessId, branchId } = await req.json();

        if (!data || !Array.isArray(data)) {
            return new NextResponse("Invalid data format", { status: 400 });
        }

        let success = 0;
        let failed = 0;

        if (type === "STUDENTS") {
            for (const item of data) {
                try {
                    // Check if student exists by email or matricula
                    // Build duplicate search criteria
                    const uniqueChecks: any[] = [];
                    if (item.email) uniqueChecks.push({ email: item.email });
                    if (item.matricula) uniqueChecks.push({ matricula: item.matricula });

                    let existing = null;

                    // 1. Check by unique fields if present
                    if (uniqueChecks.length > 0) {
                        existing = await prisma.student.findFirst({
                            where: {
                                businessId,
                                OR: uniqueChecks
                            }
                        });
                    }

                    // 2. If no unique matches field (or no unique fields provided), check by Name + LastName
                    if (!existing) {
                        existing = await prisma.student.findFirst({
                            where: {
                                businessId,
                                firstName: item.firstName,
                                lastName: item.lastName
                            }
                        });
                    }

                    if (!existing) {
                        await prisma.student.create({
                            data: {
                                firstName: item.firstName,
                                lastName: item.lastName,
                                email: item.email || null,
                                phone: item.phone || null,
                                matricula: item.matricula || null,
                                status: "ACTIVE",
                                businessId,
                                branchId: branchId || null
                            }
                        });
                        success++;
                    } else {
                        // Optional: Update existing? For now, skip to avoid overwriting valid data
                        console.log(`Skipping duplicate student: ${item.firstName} ${item.lastName}`);
                        failed++;
                    }
                } catch (e) {
                    console.error("Error importing student:", e);
                    failed++;
                }
            }
        } else if (type === "TEACHERS") {
            // Logic for teachers (creating User accounts with TEACHER role)
            for (const item of data) {
                try {
                    const existing = await prisma.user.findUnique({
                        where: { email: item.email }
                    });

                    if (!existing) {
                        // Create user with default password
                        // Note: In a real app, we'd generate a random password and email it
                        // Here we'll just create the record
                        await prisma.user.create({
                            data: {
                                name: item.name,
                                email: item.email,
                                password: "$2a$10$abcdef...", // Placeholder hash
                                role: "TEACHER",
                                hourlyRate: item.hourlyRate ? parseFloat(item.hourlyRate) : 0,
                                businessId,
                                branchId: branchId || null
                            }
                        });
                        success++;
                    } else {
                        failed++;
                    }
                } catch (e) {
                    console.error("Error importing teacher:", e);
                    failed++;
                }
            }
        } else if (type === "COURSES") {
            for (const item of data) {
                try {
                    // Create course
                    await prisma.course.create({
                        data: {
                            name: item.name,
                            description: item.description || null,
                            gradeLevel: item.gradeLevel || null,
                            schedule: item.schedule || null,
                            room: item.room || null,
                            businessId,
                            branchId: branchId || null
                        }
                    });
                    success++;
                } catch (e) {
                    console.error("Error importing course:", e);
                    failed++;
                }
            }
        } else if (type === "PRODUCTS") {
            for (const item of data) {
                try {
                    // Create product
                    const product = await prisma.product.create({
                        data: {
                            name: item.name,
                            price: parseFloat(item.price),
                            cost: item.cost ? parseFloat(item.cost) : null,
                            sku: item.sku || null,
                            category: item.category || null,
                            businessId
                        }
                    });

                    // If stock is provided and we have a branch, create inventory entry
                    if (item.stock && branchId) {
                        await prisma.inventoryItem.create({
                            data: {
                                productId: product.id,
                                branchId: branchId,
                                quantity: parseInt(item.stock),
                                minStock: 5 // Default
                            }
                        });
                    }

                    success++;
                } catch (e) {
                    console.error("Error importing product:", e);
                    failed++;
                }
            }
        } else if (type === "CUSTOMERS") {
            for (const item of data) {
                try {
                    await prisma.customer.create({
                        data: {
                            name: item.name,
                            email: item.email || null,
                            phone: item.phone || null,
                            businessId
                        }
                    });
                    success++;
                } catch (e) {
                    console.error("Error importing customer:", e);
                    failed++;
                }
            }
        }

        return NextResponse.json({ success, failed });
    } catch (error) {
        console.error("[IMPORT_API]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
