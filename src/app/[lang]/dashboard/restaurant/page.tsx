"use client";

import { useState } from "react";
import { TableManager } from "@/components/restaurant/table-manager";
import { KitchenDisplay } from "@/components/restaurant/kitchen-display";
import { OrderHistory } from "@/components/restaurant/order-history";
import { Reservations } from "@/components/restaurant/reservations";
import { RestaurantStaff } from "@/components/restaurant/restaurant-staff";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, ChefHat, Calendar, ClipboardList, Users } from "lucide-react";

type TabType = "tables" | "kitchen" | "orders" | "reservations" | "staff";

export default function RestaurantPage() {
    const [activeTab, setActiveTab] = useState<TabType>("tables");

    const tabs = [
        { id: "tables" as TabType, label: "Mesas", icon: Utensils },
        { id: "kitchen" as TabType, label: "Cocina (KDS)", icon: ChefHat },
        { id: "orders" as TabType, label: "Órdenes", icon: ClipboardList },
        { id: "reservations" as TabType, label: "Reservaciones", icon: Calendar },
        { id: "staff" as TabType, label: "Staff", icon: Users },
    ];

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="course-tabs-container" style={{ marginBottom: '24px' }}>
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            data-state={isActive ? "active" : "inactive"}
                            className="course-tab"
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === "tables" && <TableManager />}
                    {activeTab === "kitchen" && <KitchenDisplay />}
                    {activeTab === "orders" && <OrderHistory />}
                    {activeTab === "reservations" && <Reservations />}
                    {activeTab === "staff" && <RestaurantStaff />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

