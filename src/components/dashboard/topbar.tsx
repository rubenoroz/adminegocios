"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";
import { LanguageSelector } from "@/components/language-selector";
import { BranchSelector } from "@/components/branch-selector";

export function Topbar({ dict }: { dict: any }) {
    return (
        <div className="topbar">
            {/* Left side - Search */}
            <div className="flex items-center gap-4">
                <div className="topbar-search relative hidden sm:block">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar..."
                        className="pl-8 bg-muted/50 w-[200px] lg:w-[300px]"
                    />
                </div>
            </div>

            {/* Right side - Branch and Language Selectors */}
            <div className="flex items-center gap-3">
                {/* Branch Selector - MISMO COMPONENTE QUE IDIOMAS */}
                <BranchSelector />

                {/* Language Selector */}
                <LanguageSelector />
            </div>
        </div>
    );
}
