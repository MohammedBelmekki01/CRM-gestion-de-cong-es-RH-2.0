import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline";
}

export function Button({ size = "md", variant = "default", className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        variant === "default" && "bg-blue-600 hover:bg-blue-700 text-white",
        variant === "outline" && "bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-50",
        size === "sm" && "px-2 py-1 text-sm",
        size === "md" && "px-4 py-2 text-base",
        size === "lg" && "px-6 py-3 text-lg",
        "font-semibold rounded-lg",
        className
      )}
      {...props}
    />
  );
}
