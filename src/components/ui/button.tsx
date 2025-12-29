import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "btn",
                    {
                        "btn-default": variant === "default",
                        "btn-destructive": variant === "destructive",
                        "btn-outline": variant === "outline",
                        "btn-secondary": variant === "secondary",
                        "btn-ghost": variant === "ghost",
                        "btn-link": variant === "link",
                        "btn-sm": size === "sm",
                        "btn-lg": size === "lg",
                        "btn-icon": size === "icon",
                    },
                    className
                )}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

const buttonVariants = ({ variant = "default", size = "default", className = "" }: ButtonProps) => {
    return cn(
        "btn",
        {
            "btn-default": variant === "default",
            "btn-destructive": variant === "destructive",
            "btn-outline": variant === "outline",
            "btn-secondary": variant === "secondary",
            "btn-ghost": variant === "ghost",
            "btn-link": variant === "link",
            "btn-sm": size === "sm",
            "btn-lg": size === "lg",
            "btn-icon": size === "icon",
        },
        className
    )
}

export { Button, buttonVariants }
