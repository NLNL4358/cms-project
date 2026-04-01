"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn("switchRoot", className)}
      {...props}>
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="switchThumb" />
    </SwitchPrimitive.Root>
  );
}

export { Switch }
