"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Branch {
    id: string;
    name: string;
    address: string | null;
    businessId: string;
}

interface BranchContextType {
    selectedBranch: Branch | null;
    branches: Branch[];
    setSelectedBranch: (branch: Branch) => void;
    loading: boolean;
    refreshBranches: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
    const [selectedBranch, setSelectedBranchState] = useState<Branch | null>(null);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBranches = async () => {
        try {
            const res = await fetch("/api/branches");
            if (res.ok) {
                const data = await res.json();

                // Ensure data is an array
                if (Array.isArray(data)) {
                    // If no branches exist, create a default one
                    if (data.length === 0) {
                        console.log("No branches found, creating default 'Principal' branch...");
                        const createRes = await fetch("/api/branches", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                name: "Principal",
                                address: ""
                            })
                        });

                        if (createRes.ok) {
                            const newBranch = await createRes.json();
                            setBranches([newBranch]);
                            setSelectedBranchState(newBranch);
                            localStorage.setItem("selectedBranchId", newBranch.id);
                            console.log("Default branch created successfully");
                        } else {
                            console.error("Failed to create default branch");
                            setBranches([]);
                        }
                    } else {
                        setBranches(data);

                        // If no branch is selected, select the first one or restore from localStorage
                        const savedBranchId = localStorage.getItem("selectedBranchId");
                        const savedBranch = data.find((b: Branch) => b.id === savedBranchId);

                        if (savedBranch) {
                            setSelectedBranchState(savedBranch);
                        } else {
                            setSelectedBranchState(data[0]);
                            localStorage.setItem("selectedBranchId", data[0].id);
                        }
                    }
                } else {
                    console.error("Branches API returned non-array data:", data);
                    setBranches([]);
                }
            } else {
                console.error("Failed to fetch branches:", res.status);
                setBranches([]);
            }
        } catch (error) {
            console.error("Error fetching branches:", error);
            setBranches([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const setSelectedBranch = (branch: Branch) => {
        setSelectedBranchState(branch);
        localStorage.setItem("selectedBranchId", branch.id);
    };

    const refreshBranches = async () => {
        await fetchBranches();
    };

    return (
        <BranchContext.Provider
            value={{
                selectedBranch,
                branches,
                setSelectedBranch,
                loading,
                refreshBranches,
            }}
        >
            {children}
        </BranchContext.Provider>
    );
}

export function useBranch() {
    const context = useContext(BranchContext);
    if (context === undefined) {
        throw new Error("useBranch must be used within a BranchProvider");
    }
    return context;
}
