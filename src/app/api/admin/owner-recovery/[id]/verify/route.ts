import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST /api/admin/owner-recovery/[id]/verify - Verify and complete the request
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user || session.user.role !== "SUPERADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { verificationMethod, notes, newPassword, newOwnerEmail, newOwnerName } = body;

        if (!verificationMethod) {
            return NextResponse.json(
                { error: "verificationMethod is required" },
                { status: 400 }
            );
        }

        // Find the request
        const request = await prisma.ownerRecoveryRequest.findUnique({
            where: { id },
            include: {
                business: {
                    include: {
                        users: {
                            where: { role: "OWNER" }
                        }
                    }
                }
            }
        });

        if (!request) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        if (request.status !== "PENDING") {
            return NextResponse.json(
                { error: "Esta solicitud ya fue procesada" },
                { status: 400 }
            );
        }

        // Mark as verified
        await prisma.ownerRecoveryRequest.update({
            where: { id },
            data: {
                status: "VERIFIED",
                verificationMethod,
                verifiedBy: session.user.email || session.user.id,
                verifiedAt: new Date(),
                notes
            }
        });

        // Process based on request type
        if (request.type === "RECOVERY") {
            // Reset owner's password
            if (!newPassword) {
                return NextResponse.json(
                    { error: "newPassword is required for recovery" },
                    { status: 400 }
                );
            }

            const owner = request.business.users[0];
            if (!owner) {
                return NextResponse.json(
                    { error: "No owner found for this business" },
                    { status: 400 }
                );
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await prisma.user.update({
                where: { id: owner.id },
                data: { password: hashedPassword }
            });

            // Complete the request
            await prisma.ownerRecoveryRequest.update({
                where: { id },
                data: {
                    status: "COMPLETED",
                    completedAt: new Date()
                }
            });

            return NextResponse.json({
                success: true,
                message: "Contraseña del dueño actualizada exitosamente",
                ownerEmail: owner.email
            });

        } else if (request.type === "TRANSFER") {
            // Transfer ownership
            let newOwnerId = request.newOwnerId;

            // If no existing user, create new one
            if (!newOwnerId && newOwnerEmail) {
                if (!newPassword) {
                    return NextResponse.json(
                        { error: "newPassword is required when creating new owner" },
                        { status: 400 }
                    );
                }

                const hashedPassword = await bcrypt.hash(newPassword, 10);

                const newUser = await prisma.user.create({
                    data: {
                        email: newOwnerEmail,
                        name: newOwnerName || newOwnerEmail.split("@")[0],
                        password: hashedPassword,
                        role: "OWNER",
                        businessId: request.businessId
                    }
                });

                newOwnerId = newUser.id;
            }

            if (!newOwnerId) {
                return NextResponse.json(
                    { error: "No new owner specified" },
                    { status: 400 }
                );
            }

            // Demote current owner to ADMIN
            const currentOwner = request.business.users[0];
            if (currentOwner) {
                await prisma.user.update({
                    where: { id: currentOwner.id },
                    data: { role: "ADMIN" }
                });
            }

            // Promote new owner
            await prisma.user.update({
                where: { id: newOwnerId },
                data: {
                    role: "OWNER",
                    businessId: request.businessId
                }
            });

            // Complete the request
            await prisma.ownerRecoveryRequest.update({
                where: { id },
                data: {
                    status: "COMPLETED",
                    completedAt: new Date(),
                    newOwnerId
                }
            });

            return NextResponse.json({
                success: true,
                message: "Propiedad transferida exitosamente",
                newOwnerId
            });
        }

        return NextResponse.json({ error: "Invalid request type" }, { status: 400 });

    } catch (error) {
        console.error("Error verifying recovery request:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/admin/owner-recovery/[id]/verify - Cancel/Reject the request
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user || session.user.role !== "SUPERADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const request = await prisma.ownerRecoveryRequest.findUnique({
            where: { id }
        });

        if (!request) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        if (request.status !== "PENDING") {
            return NextResponse.json(
                { error: "Solo se pueden cancelar solicitudes pendientes" },
                { status: 400 }
            );
        }

        await prisma.ownerRecoveryRequest.update({
            where: { id },
            data: {
                status: "REJECTED",
                completedAt: new Date()
            }
        });

        return NextResponse.json({ success: true, message: "Solicitud cancelada" });

    } catch (error) {
        console.error("Error canceling recovery request:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
