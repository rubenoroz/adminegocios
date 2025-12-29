import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar({ dict }: { dict: any }) {
    return (
        <header className="px-4 lg:px-6 h-14 flex items-center border-b w-full">
            <Link className="flex items-center justify-center" href="/">
                <span className="font-bold text-xl">Adminegocios</span>
            </Link>
            <nav className="ml-auto flex gap-4 sm:gap-6">
                <Link href="/login">
                    <Button variant="ghost">{dict.login}</Button>
                </Link>
                <Link href="/register">
                    <Button>{dict.register}</Button>
                </Link>
            </nav>
        </header>
    );
}
