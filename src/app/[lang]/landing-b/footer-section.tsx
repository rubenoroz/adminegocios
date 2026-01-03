"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function FooterSection() {
    return (
        <section className="bg-gray-800 text-white py-12 px-4 md:px-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="max-w-5xl mx-auto text-center"
            >
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                    ¿Listo para transformar tu negocio?
                </h3>
                <p className="mb-6 text-gray-300">
                    Contáctanos y obtén una demo personalizada en menos de 24 horas.
                </p>
                <form
                    action="https://formspree.io/f/your-form-id"
                    method="POST"
                    className="flex flex-col sm:flex-row justify-center gap-4"
                >
                    <input
                        type="email"
                        name="email"
                        placeholder="Tu email"
                        required
                        className="px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2 rounded transition-colors"
                    >
                        Solicitar demo
                    </button>
                </form>
                <div className="mt-8 flex justify-center space-x-6">
                    <Link href="/privacy" className="text-gray-400 hover:text-white">Política de privacidad</Link>
                    <Link href="/terms" className="text-gray-400 hover:text-white">Términos de servicio</Link>
                </div>
                <p className="mt-6 text-xs text-gray-500">© 2026 TuEmpresa. Todos los derechos reservados.</p>
            </motion.div>
        </section>
    );
}
