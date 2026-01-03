"use client";

import { HeroSection } from "./hero-section";
import { BenefitsSection } from "./benefits-section";
import { FooterSection } from "./footer-section";
import { PlanCard } from "./plan-card";

const plans = [
    {
        name: "Starter",
        price: "$29",
        description: "Ideal para negocios que están comenzando.",
        features: [
            "Gestión básica de productos/servicios",
            "Agenda vista día",
            "CRM simple",
            "Reportes básicos",
        ],
        ctaLink: "/signup?plan=starter",
    },
    {
        name: "Growth",
        price: "$79",
        description: "Para empresas en expansión.",
        features: [
            "Agenda vista semana + drag & drop",
            "Inventario avanzado",
            "Reportes detallados",
            "Exportación CSV",
        ],
        ctaLink: "/signup?plan=growth",
    },
    {
        name: "Enterprise",
        price: "$199",
        description: "Solución completa para grandes organizaciones.",
        features: [
            "Multi‑sucursal",
            "API pública y webhooks",
            "KPIs en tiempo real",
            "Asesoría personalizada",
        ],
        ctaLink: "/signup?plan=enterprise",
    },
];

export default function LandingBPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <HeroSection />
            <section className="py-12 px-4 md:px-12 bg-white">
                <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-3">
                    {plans.map((p) => (
                        <PlanCard key={p.name} {...p} />
                    ))}
                </div>
            </section>
            <BenefitsSection />
            <FooterSection />
        </div>
    );
}
