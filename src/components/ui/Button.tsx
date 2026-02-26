import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "ghost" | "danger";
}

const variantStyles = {
  default:
    "bg-primary text-white hover:bg-primary-hover focus:ring-primary/30",
  outline:
    "bg-transparent border border-slate-300 text-foreground hover:bg-slate-50 focus:ring-slate-300/30",
  ghost:
    "bg-transparent text-foreground hover:bg-slate-100 focus:ring-slate-300/30",
  danger:
    "bg-danger text-white hover:bg-red-700 focus:ring-danger/30",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-2.5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ size = "md", variant = "default", className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150",
        "focus:outline-none focus:ring-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
