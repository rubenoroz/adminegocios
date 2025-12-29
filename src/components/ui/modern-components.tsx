"use client";

import { motion } from "framer-motion";
import { ReactNode, useState, useEffect } from "react";

interface ModernCardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

export function ModernCard({ children, className = "", onClick }: ModernCardProps) {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    return (
        <motion.div
            className={`modern-card ${className}`}
            onMouseMove={handleMouseMove}
            onClick={onClick}
            style={{
                // @ts-expect-error - Custom CSS properties are not in CSSProperties type
                '--mouse-x': `${mousePosition.x}px`,
                '--mouse-y': `${mousePosition.y}px`,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 30
            }}
        >
            {children}
        </motion.div>
    );
}

interface ModernInputProps {
    label: string;
    type?: string;
    value: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
}

export function ModernInput({
    label,
    type = "text",
    value,
    onChange,
    placeholder = "",
    required = false,
    disabled = false
}: ModernInputProps) {
    return (
        <div className="modern-input-wrapper">
            <input
                type={type}
                className="modern-input"
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
            />
            <label className="modern-input-label">
                {label}{required && " *"}
            </label>
        </div>
    );
}

interface BadgeProps {
    children: ReactNode;
    variant?: "success" | "warning" | "error" | "info";
    animated?: boolean;
}

export function ModernBadge({ children, variant = "info", animated = true }: BadgeProps) {
    return (
        <span className={`badge-animated ${variant} ${animated ? '' : 'no-animation'}`}>
            {children}
        </span>
    );
}

interface ModernButtonProps {
    children: ReactNode;
    onClick?: () => void;
    variant?: "primary" | "secondary" | "ghost";
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
}

export function ModernButton({
    children,
    onClick,
    variant = "primary",
    size = "md",
    disabled = false,
    type = "button"
}: ModernButtonProps) {
    const sizeClasses = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-5 py-2.5 text-base",
        lg: "px-6 py-3 text-lg"
    };

    const variantClasses = {
        primary: "button-modern bg-primary-600 text-white shadow-lg shadow-primary-500/30 hover:bg-primary-700",
        secondary: "button-modern bg-surface border border-border text-text hover:bg-muted/10",
        ghost: "button-modern bg-transparent text-muted-text hover:bg-muted/5 hover:text-text shadow-none"
    };

    return (
        <motion.button
            type={type}
            className={`${variantClasses[variant]} ${sizeClasses[size]}`}
            onClick={onClick}
            disabled={disabled}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 17
            }}
        >
            {children}
        </motion.button>
    );
}

interface ProgressBarProps {
    value: number;
    max?: number;
    showLabel?: boolean;
}

export function ModernProgressBar({ value, max = 100, showLabel = false }: ProgressBarProps) {
    const percentage = Math.min((value / max) * 100, 100);

    return (
        <div className="space-y-2">
            {showLabel && (
                <div className="flex justify-between text-sm text-muted-text">
                    <span>Progreso</span>
                    <span>{Math.round(percentage)}%</span>
                </div>
            )}
            <div className="progress-modern">
                <motion.div
                    className="progress-modern-bar"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                />
            </div>
        </div>
    );
}

interface ToastProps {
    message: string;
    variant?: "success" | "error" | "info" | "warning";
    onClose: () => void;
}

export function ModernToast({ message, variant = "info", onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const icons = {
        success: "✓",
        error: "✕",
        info: "ℹ",
        warning: "⚠"
    };

    const colors = {
        success: "var(--success)",
        error: "var(--error)",
        info: "var(--info)",
        warning: "var(--warning)"
    };

    return (
        <motion.div
            className="toast-modern"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <div className="flex items-center gap-3">
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: colors[variant], color: "white" }}
                >
                    {icons[variant]}
                </div>
                <p className="flex-1 text-sm font-medium">{message}</p>
                <button
                    onClick={onClose}
                    className="text-muted-text hover:text-text transition-colors"
                >
                    ✕
                </button>
            </div>
        </motion.div>
    );
}
