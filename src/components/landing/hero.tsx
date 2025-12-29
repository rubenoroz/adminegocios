import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Hero({ dict }: { dict: any }) {
    return (
        <section className="hero w-full py-12 md:py-24 lg:py-32 xl:py-48">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center space-y-4 text-center">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                            {dict.title}
                        </h1>
                        <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                            {dict.subtitle}
                        </p>
                    </div>
                    <div className="space-x-4">
                        <Link href="/register">
                            <Button size="lg" className="h-12 px-8">{dict.cta}</Button>
                        </Link>
                        <Link href="#diagnostico">
                            <Button variant="outline" size="lg" className="h-12 px-8">
                                {dict.secondaryCta}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
