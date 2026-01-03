"use client";

import { motion } from "framer-motion";

export function BenefitsSection() {
    const benefits = [
        "Gestión integral para cualquier tipo de negocio",
        "Control de inventario, agenda y clientes en un solo lugar",
        "Reportes visuales y métricas en tiempo real",
        "Escalable: desde una sola sucursal hasta múltiples locales",
        "Soporte y actualizaciones automáticas",
    ];

    return (
        <section className="py-16 px-4 md:px-12 bg-gray-50">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="max-w-5xl mx-auto text-center"
            >
                <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-800">
                    ¿Por qué elegirnos?
                </h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    {benefits.map((b, i) => (
                        <li key={i} className="flex items-start">
                            <svg className="w-6 h-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-gray-700 text-lg">{b}</span>
                        </li>
                    ))}
                </ul>
            </motion.div>
        </section>
    );
}
