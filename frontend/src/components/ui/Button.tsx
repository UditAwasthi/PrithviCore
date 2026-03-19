import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
          {
            "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:brightness-110 border-0": variant === "default",
            "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 hover:brightness-110": variant === "destructive",
            "border border-border/60 bg-background/80 backdrop-blur-sm hover:bg-accent/50 hover:text-accent-foreground hover:border-primary/30 hover:shadow-md": variant === "outline",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm": variant === "secondary",
            "hover:bg-accent/50 hover:text-accent-foreground": variant === "ghost",
            "text-primary underline-offset-4 hover:underline": variant === "link",
            "h-11 px-6 py-2": size === "default",
            "h-9 rounded-lg px-4 text-xs": size === "sm",
            "h-12 rounded-xl px-8 text-base": size === "lg",
            "h-10 w-10 rounded-full p-0": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
