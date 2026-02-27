import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "ghost" | "danger";
}

const variantStyles = {
  default:
    "bg-primary text-white shadow-sm hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary/40",
  outline:
    "bg-card border border-border text-foreground hover:bg-background focus-visible:ring-2 focus-visible:ring-primary/30",
  ghost:
    "bg-transparent text-muted hover:text-foreground hover:bg-background focus-visible:ring-2 focus-visible:ring-primary/30",
  danger:
    "bg-danger text-white shadow-sm hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-danger/40",
};

const sizeStyles = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-9 px-4 text-sm gap-2 rounded-lg",
  lg: "h-11 px-6 text-[15px] gap-2 rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { size = "md", variant = "default", className, disabled, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center justify-center font-medium transition-all duration-150",
        "focus:outline-none",
        "disabled:opacity-50 disabled:pointer-events-none",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
