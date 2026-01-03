"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { POSInterface } from "@/components/sales/pos-interface";
import { ProductList } from "@/components/inventory/product-list";
import { CustomerList } from "@/components/store/customer-list";
import { SupplierList } from "@/components/store/supplier-list";
import { SalesHistory } from "@/components/store/sales-history";
import { CashRegister } from "@/components/store/cash-register";
import { StoreStaff } from "@/components/store/store-staff";
import { CartProvider } from "@/context/cart-context";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Package, Users, Truck, History, Calculator, Briefcase } from "lucide-react";

type TabType = "pos" | "inventory" | "customers" | "suppliers" | "history" | "cash" | "staff";

export default function StorePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Get tab from URL or default to "pos"
    const tabFromUrl = searchParams.get("tab") as TabType | null;
    const validTabs: TabType[] = ["pos", "inventory", "customers", "suppliers", "history", "cash", "staff"];
    const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : "pos";

    const [activeTab, setActiveTab] = useState<TabType>(initialTab);

    // Update URL when tab changes
    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const tabs = [
        { id: "pos" as TabType, label: "POS", icon: ShoppingCart },
        { id: "inventory" as TabType, label: "Inventario", icon: Package },
        { id: "customers" as TabType, label: "Clientes", icon: Users },
        { id: "suppliers" as TabType, label: "Proveedores", icon: Truck },
        { id: "history" as TabType, label: "Historial", icon: History },
        { id: "cash" as TabType, label: "Caja", icon: Calculator },
        { id: "staff" as TabType, label: "Staff", icon: Briefcase },
    ];

    return (
        <CartProvider>
            <div className="space-y-6">
                {/* Tab Navigation */}
                <div className="course-tabs-container" style={{ marginBottom: '24px' }}>
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
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
                        {activeTab === "pos" && <POSInterface />}
                        {activeTab === "inventory" && <ProductList />}
                        {activeTab === "customers" && <CustomerList />}
                        {activeTab === "suppliers" && <SupplierList />}
                        {activeTab === "history" && <SalesHistory />}
                        {activeTab === "cash" && <CashRegister />}
                        {activeTab === "staff" && <StoreStaff />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </CartProvider>
    );
}
