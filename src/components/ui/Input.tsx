import { InputHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={clsx(
            "w-full h-10 px-3 bg-card border rounded-[10px] text-sm text-foreground placeholder:text-muted-foreground",
            "transition-all duration-150",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
            error
              ? "border-danger text-danger focus:ring-danger/20 focus:border-danger"
              : "border-border",
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-[13px] text-danger">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";
