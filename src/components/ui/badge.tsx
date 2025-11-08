import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const variantClasses = {
    default: "bg-blue-500 text-white",
    secondary: "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100",
    destructive: "bg-red-500 text-white",
    outline: "border border-gray-300 text-gray-900 dark:border-gray-600 dark:text-gray-100"
  };
  
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;
  
  return (
    <span className={classes}>
      {children}
    </span>
  );
}