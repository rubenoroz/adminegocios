"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect mobile devices based on screen width.
 * Returns true if window width is less than 768px.
 * SSR-safe: returns false during server-side rendering.
 */
export function useIsMobile(breakpoint: number = 768): boolean {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        // Initial check
        checkMobile();

        // Listen for resize events
        window.addEventListener("resize", checkMobile);

        return () => {
            window.removeEventListener("resize", checkMobile);
        };
    }, [breakpoint]);

    return isMobile;
}
