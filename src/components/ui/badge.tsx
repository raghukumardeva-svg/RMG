import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-green text-white hover:bg-brand-green-dark transition-colors duration-200",
        secondary:
          "border-transparent bg-gray-100 dark:bg-gray-800 text-brand-slate dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200",
        destructive:
          "border-transparent bg-red-600 text-white hover:bg-red-700 transition-colors duration-200",
        outline: "text-brand-slate dark:text-gray-300 border-brand-light-gray dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200",
        success:
          "border-transparent bg-brand-green-light text-brand-green dark:bg-brand-green/20 dark:text-brand-green-light",
        custom:
          "border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
