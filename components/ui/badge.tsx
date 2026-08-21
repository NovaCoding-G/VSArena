"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
  {
    variants: {
      variant: {
        cyan: "border-arena-cyan/30 bg-arena-cyan/10 text-arena-cyan",
        orange: "border-arena-orange/30 bg-arena-orange/10 text-arena-orange",
        muted: "border-white/10 text-arena-muted",
      },
    },
    defaultVariants: {
      variant: "cyan",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
