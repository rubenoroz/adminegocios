"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export interface Plan {
    name: string;
    price: string;
    description: string;
    features: string[];
    ctaLink: string;
}

export function PlanCard({ name, price, description, features, ctaLink }: Plan) {
    return (
        <motion.div
            whileHover={{ scale: 1.03 }}
            className="bg-white rounded-xl shadow-lg p-6 flex flex-col"
        >
            <h3 className="text-2xl font-bold mb-2 text-indigo-700">{name}</h3>
            <p className="text-xl font-semibold text-gray-800 mb-4">{price}/mes</p>
            <p className="text-gray-600 mb-4">{description}</p>
            <ul className="flex-1 mb-6 space-y-2">
                {features.map((f, i) => (
                    <li key={i} className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">{f}</span>
                    </li>
                ))}
            </ul>
            <Link href={ctaLink} className="mt-auto inline-block bg-indigo-600 text-white font-medium py-2 px-4 rounded hover:bg-indigo-700 transition-colors text-center">
                Elegir {name}
            </Link>
        </motion.div>
    );
}
