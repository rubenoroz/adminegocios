import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BranchProvider } from "@/context/branch-context";

// Clean layout for the entire Courses section (no sidebar)
export default async function CoursesLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}) {
    const session = await getServerSession(authOptions);
    const { lang } = await params;

    if (!session?.user) {
        return redirect(`/${lang}/login`);
    }

    return (
        <BranchProvider>
            <div className="min-h-screen" style={{ backgroundColor: '#f0fdf4' }}>
                {children}
            </div>
        </BranchProvider>
    );
}
