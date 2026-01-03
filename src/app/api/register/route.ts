import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, name, businessName, businessType } = body;

        if (!email || !password || !businessName || !businessType) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const exist = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if (exist) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Transaction to create Business, Branch, and User
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Business
            const business = await tx.business.create({
                data: {
                    name: businessName,
                    type: businessType,
                    planId: null, // Avoid default "free" if it doesn't exist
                }
            });

            // 2. Create Default Branch
            const branch = await tx.branch.create({
                data: {
                    name: "Matriz", // Default branch name
                    businessId: business.id,
                }
            });

            // 3. Create User linked to Business and Branch
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    businessId: business.id,
                    branchId: branch.id,
                    role: "OWNER", // Default role for creator
                }
            });

            return user;
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("REGISTRATION_ERROR", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
