import { getDictionary } from "@/lib/dictionaries";
import { BranchesList } from "@/components/settings/branches-list";

export default async function BranchesPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang as any);

    return <BranchesList dict={dict} />;
}
