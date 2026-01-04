"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
    <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
            "flex h-12 w-full items-center justify-between gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 ring-offset-background transition-all duration-200",
            "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400",
            "hover:border-slate-300 hover:bg-slate-50",
            "disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
            className
        )}
        {...props}
    >
        {children}
        <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-5 w-5 opacity-50 flex-shrink-0 transition-transform duration-200" />
        </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.ScrollUpButton
        ref={ref}
        className={cn(
            "flex cursor-default items-center justify-center py-1",
            className
        )}
        {...props}
    >
        <ChevronUp className="h-4 w-4" />
    </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.ScrollDownButton
        ref={ref}
        className={cn(
            "flex cursor-default items-center justify-center py-1",
            className
        )}
        {...props}
    >
        <ChevronDown className="h-4 w-4" />
    </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
    SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => {
    return (
        <SelectPrimitive.Portal>
            <SelectPrimitive.Content
                ref={ref}
                align="start"
                sideOffset={8}
                className={cn(
                    "relative max-h-96 min-w-[14rem] overflow-hidden text-slate-700",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                    "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                    position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
                    className
                )}
                position={position}
                style={{
                    zIndex: 99999,
                    backgroundColor: '#ffffff',
                    borderRadius: '20px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                    padding: '14px',
                    border: 'none',
                    minWidth: '220px'
                }}
                {...props}
            >
                <SelectScrollUpButton />
                <SelectPrimitive.Viewport
                    className={cn(
                        "p-0",
                        position === "popper" && "w-full min-w-[var(--radix-select-trigger-width)]"
                    )}
                >
                    {children}
                </SelectPrimitive.Viewport>
                <SelectScrollDownButton />
            </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
    );
})
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.Label
        ref={ref}
        className={cn("px-3 py-2 text-xs font-bold uppercase tracking-wider text-purple-400", className)}
        {...props}
    />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => {
    return (
        <SelectPrimitive.Item
            ref={ref}
            className={cn(
                "relative flex w-full cursor-pointer select-none items-center justify-between gap-3 outline-none transition-all duration-150",
                "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                className
            )}
            style={{
                padding: '12px 14px',
                borderRadius: '14px',
                marginBottom: '4px',
                fontSize: '14px',
                fontWeight: 500,
            }}
            onMouseEnter={(e) => {
                if (e.currentTarget.getAttribute('data-state') !== 'checked') {
                    e.currentTarget.style.background = '#f8fafc';
                }
            }}
            onMouseLeave={(e) => {
                if (e.currentTarget.getAttribute('data-state') !== 'checked') {
                    e.currentTarget.style.background = 'transparent';
                }
            }}
            data-radix-collection-item=""
            {...props}
        >
            <SelectPrimitive.ItemText style={{ flex: 1, color: 'inherit' }}>
                {children}
            </SelectPrimitive.ItemText>
            <SelectPrimitive.ItemIndicator>
                <Check className="h-5 w-5 text-purple-500" />
            </SelectPrimitive.ItemIndicator>
        </SelectPrimitive.Item>
    );
})
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.Separator
        ref={ref}
        className={cn("my-2 h-px bg-slate-100", className)}
        {...props}
    />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
    Select,
    SelectGroup,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectLabel,
    SelectItem,
    SelectSeparator,
    SelectScrollUpButton,
    SelectScrollDownButton,
}
