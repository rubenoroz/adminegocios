"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-white pt-24 pb-32 lg:pt-36 lg:pb-40">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 right-0 h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-white opacity-70" />
            <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-purple-200 rounded-full blur-[100px] opacity-30 mix-blend-multiply" />
            <div className="absolute top-[100px] left-[-100px] w-[400px] h-[400px] bg-blue-200 rounded-full blur-[100px] opacity-30 mix-blend-multiply" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-indigo-100 text-indigo-700 font-medium text-sm mb-8 shadow-sm">
                        <Sparkles size={14} className="text-indigo-500" />
                        <span>La plataforma todo-en-uno definitiva</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                        Gestiona tu negocio <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient-x">
                            sin límites.
                        </span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-xl text-slate-600 mb-10 leading-relaxed">
                        Desde escuelas y tiendas hasta restaurantes y consultorías. Centraliza operaciones, inventario, clientes y ventas en una interfaz que te enamorará.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link href="/signup?plan=starter" className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-indigo-600 rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:translate-y-[-2px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600">
                            Comenzar prueba gratis - 14 días
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>

                        <Link href="#planes" className="inline-flex items-center justify-center px-8 py-4 font-semibold text-slate-700 transition-all duration-200 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200">
                            Ver planes y precios
                        </Link>
                    </div>

                    <div className="mt-12 flex justify-center gap-8 text-slate-400 grayscale opacity-70">
                        {/* Placeholder logos for social proof style */}
                        <div className="h-8 font-bold text-lg">🏫 EscuelaDemo</div>
                        <div className="h-8 font-bold text-lg">🍕 RestoBar</div>
                        <div className="h-8 font-bold text-lg">🛒 SuperMart</div>
                        <div className="h-8 font-bold text-lg">🦷 ClínicaPlus</div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
