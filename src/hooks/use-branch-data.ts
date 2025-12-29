"use client";

import { useBranch } from "@/context/branch-context";
import { useEffect, useState, useCallback } from "react";

/**
 * Hook helper para hacer fetch de datos filtrados por sucursal
 * 
 * @example
 * const { data: students, loading, refetch } = useBranchData<Student[]>('/api/students');
 */
export function useBranchData<T>(endpoint: string, options?: RequestInit) {
    const { selectedBranch } = useBranch();
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        if (!selectedBranch) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const url = new URL(endpoint, window.location.origin);
            url.searchParams.set("branchId", selectedBranch.id);

            const response = await fetch(url.toString(), options);
            if (!response.ok) {
                // Log error but don't throw - just set empty data
                console.error(`API error for ${endpoint}:`, response.status, response.statusText);
                setData(null);
                setError(new Error(`HTTP error! status: ${response.status}`));
                return;
            }
            const result = await response.json();

            // Validate that result is the expected type (array for most cases)
            setData(result);
            setError(null);
        } catch (err) {
            setError(err as Error);
            setData(null);
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    }, [endpoint, selectedBranch, options]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}

/**
 * Hook helper para crear datos con branchId automático
 * 
 * @example
 * const createStudent = useBranchCreate('/api/students');
 * await createStudent({ firstName: 'Juan', lastName: 'Pérez' });
 */
export function useBranchCreate(endpoint: string) {
    const { selectedBranch } = useBranch();

    return useCallback(async (data: Record<string, any>) => {
        if (!selectedBranch) {
            const error = new Error("No branch selected");
            console.error(error);
            throw error;
        }

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    branchId: selectedBranch.id
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API error for ${endpoint}:`, response.status, errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error(`Error creating data at ${endpoint}:`, error);
            throw error;
        }
    }, [endpoint, selectedBranch]);
}
