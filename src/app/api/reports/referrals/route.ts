import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user?.businessId) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        // Get referral source stats
        const students = await prisma.student.findMany({
            where: {
                businessId: user.businessId,
                status: "ACTIVE"
            },
            select: {
                referralSource: true
            }
        });

        // Count by source
        const counts: Record<string, number> = {};
        for (const student of students) {
            const source = student.referralSource || "UNKNOWN";
            counts[source] = (counts[source] || 0) + 1;
        }

        // Format for chart
        const sourceLabels: Record<string, string> = {
            TIKTOK: "TikTok",
            FACEBOOK: "Facebook",
            INSTAGRAM: "Instagram",
            GOOGLE: "Google",
            REFERRAL: "Recomendación",
            WALK_IN: "Visita al local",
            OTHER: "Otro",
            UNKNOWN: "Sin especificar"
        };

        const sourceColors: Record<string, string> = {
            TIKTOK: "#000000",
            FACEBOOK: "#1877F2",
            INSTAGRAM: "#E4405F",
            GOOGLE: "#4285F4",
            REFERRAL: "#10B981",
            WALK_IN: "#F59E0B",
            OTHER: "#6B7280",
            UNKNOWN: "#CBD5E1"
        };

        const data = Object.entries(counts).map(([source, count]) => ({
            source,
            label: sourceLabels[source] || source,
            count,
            color: sourceColors[source] || "#6B7280"
        }));

        // Sort by count descending
        data.sort((a, b) => b.count - a.count);

        return NextResponse.json({
            total: students.length,
            data
        });
    } catch (error) {
        console.error("[REFERRAL_STATS_GET]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
