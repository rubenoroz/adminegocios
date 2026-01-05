"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FAQItem {
    question: string;
    answer: string;
}

const faqs: FAQItem[] = [
    {
        question: "¿Realmente funciona sin internet?",
        answer: "Sí, absolutamente. Nuestra tecnología 'Offline-First' permite que tu operación continúe normalmente (ventas, asistencias, inventario) incluso si se cae la red. Los datos se guardan localmente y se sincronizan automáticamente con la nube en cuanto recuperas la conexión."
    },
    {
        question: "¿Puedo cambiar de plan en cualquier momento?",
        answer: "Claro que sí. Puedes empezar con el plan GRATIS o STARTER y actualizar a GROWTH o ENTERPRISE conforme tu negocio crezca. El cambio es inmediato y tus datos se mantienen intactos."
    },
    {
        question: "¿Qué pasa con mis datos si cancelo?",
        answer: "Tus datos son tuyos. Si decides cancelar, te damos un periodo de gracia para descargar toda tu información (reportes, listas de alumnos, historial de ventas) en formatos estándar (Excel/CSV)."
    },
    {
        question: "¿Necesito instalar algún software?",
        answer: "No en computadoras. ADMNegocios es una plataforma web progresiva (PWA) que funciona en cualquier navegador moderno. Para móviles y tabletas, ofrecemos una App optimizada para el uso offline."
    },
    {
        question: "¿Es seguro guardar mi información en la nube?",
        answer: "La seguridad es nuestra prioridad. Usamos encriptación de grado bancario para la transmisión y almacenamiento de datos, copias de seguridad automáticas y aislamiento estricto entre negocios para garantizar tu privacidad."
    },
    {
        question: "¿Cómo manejo mi contabilidad y facturas?",
        answer: "El sistema mantiene un registro impecable de todas tus ventas y gastos. Puedes exportar reportes detallados en Excel listos para tu contador, facilitando enormemente el cumplimiento fiscal sin complicaciones técnicas."
    }
];

export function FaqSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, #0a0f0d, #0f1612)' }}>
            <div className="w-full max-w-4xl mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center p-3 rounded-full bg-emerald-500/10 text-emerald-500 mb-6">
                        <HelpCircle size={24} />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        Preguntas Frecuentes
                    </h2>
                    <p className="text-lg text-slate-400">
                        Resolvemos tus dudas para que tomes la mejor decisión.
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            style={{
                                backgroundColor: '#111815 !important',
                                border: '1px solid #2d3748 !important',
                                borderRadius: '16px',
                                overflow: 'hidden'
                            }}
                            className="hover:border-emerald-500/30 transition-colors"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                                style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', outline: 'none' }}
                            >
                                <span style={{ fontSize: '18px', fontWeight: 500, color: '#f8fafc' }}>
                                    {faq.question}
                                </span>
                                <motion.div
                                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-emerald-500 flex-shrink-0"
                                >
                                    <ChevronDown size={24} />
                                </motion.div>
                            </button>

                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div style={{ padding: '0 24px 24px 24px', color: '#94a3b8', lineHeight: '1.6' }}>
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
