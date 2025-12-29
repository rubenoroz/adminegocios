"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";

export function LanguageSelector() {
    const pathname = usePathname();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!pathname) return null;

    const segments = pathname.split("/");
    const currentLang = segments[1];

    const handleLanguageChange = (newLang: string) => {
        segments[1] = newLang;
        const newPath = segments.join("/");
        router.push(newPath);
        router.refresh();
    };

    if (!mounted) {
        return <div className="w-[140px] h-10" />;
    }

    return (
        <Select value={currentLang} onValueChange={handleLanguageChange}>
            <SelectTrigger className="h-11 gap-3 px-4 rounded-xl border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
                <Globe className="h-4 w-4 text-slate-500" />
                <SelectValue placeholder="Idioma" />
            </SelectTrigger>
            <SelectContent className="bg-white w-[180px] p-3 rounded-xl shadow-lg border-slate-200">
                <SelectItem value="es" className="cursor-pointer py-2 px-3 rounded-md mb-1">Español</SelectItem>
                <SelectItem value="en" className="cursor-pointer py-2 px-3 rounded-md mb-1">English</SelectItem>
                <SelectItem value="fr" className="cursor-pointer py-2 px-3 rounded-md mb-1">Français</SelectItem>
                <SelectItem value="de" className="cursor-pointer py-2 px-3 rounded-md mb-1">Deutsch</SelectItem>
                <SelectItem value="it" className="cursor-pointer py-2 px-3 rounded-md mb-1">Italiano</SelectItem>
                <SelectItem value="pt" className="cursor-pointer py-2 px-3 rounded-md mb-1">Português</SelectItem>
                <SelectItem value="zh" className="cursor-pointer py-2 px-3 rounded-md mb-1">中文</SelectItem>
                <SelectItem value="ja" className="cursor-pointer py-2 px-3 rounded-md mb-1">日本語</SelectItem>
            </SelectContent>
        </Select>
    );
}
