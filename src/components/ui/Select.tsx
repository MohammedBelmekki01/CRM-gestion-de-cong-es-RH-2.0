import { SelectHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={clsx(
        "w-full h-10 px-3 border border-border rounded-[10px] bg-card text-sm text-foreground",
        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
        "transition-all duration-150",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";
