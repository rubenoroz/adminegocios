"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

const Switch = React.forwardRef<
    React.ElementRef<typeof SwitchPrimitives.Root>,
    React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ ...props }, ref) => (
    <SwitchPrimitives.Root
        {...props}
        ref={ref}
        style={{
            width: '52px',
            height: '28px',
            borderRadius: '9999px',
            position: 'relative',
            cursor: 'pointer',
            border: 'none',
            outline: 'none',
            padding: 0,
            WebkitTapHighlightColor: 'transparent',
        }}
        className="switch-root"
    >
        <style>{`
      .switch-root {
        background-color: #CBD5E1;
        transition: background-color 0.2s ease, box-shadow 0.2s ease;
      }
      .switch-root[data-state="checked"] {
        background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
        box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.25);
      }
      .switch-root[data-state="unchecked"] {
        background-color: #CBD5E1;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .switch-thumb {
        display: block;
        width: 22px;
        height: 22px;
        background-color: #FFFFFF;
        border-radius: 9999px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: transform 0.2s ease;
        transform: translateX(3px);
      }
      .switch-root[data-state="checked"] .switch-thumb {
        transform: translateX(27px);
      }
    `}</style>
        <SwitchPrimitives.Thumb className="switch-thumb" />
    </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
