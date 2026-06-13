import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "default" | "sm" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "default", ...props }, ref) => {
    let variantStyles = "";
    switch (variant) {
      case "primary":
        variantStyles = "bg-primary text-primary-foreground hover:opacity-90";
        break;
      case "secondary":
        variantStyles = "bg-secondary text-secondary-foreground hover:bg-secondary/80";
        break;
      case "ghost":
        variantStyles = "border border-border bg-transparent text-foreground hover:bg-muted";
        break;
      case "danger":
        variantStyles = "bg-destructive text-destructive-foreground hover:opacity-90";
        break;
    }

    let sizeStyles = "";
    switch (size) {
      case "default":
        sizeStyles = "h-11 px-6 py-2.5";
        break;
      case "sm":
        sizeStyles = "h-9 px-4";
        break;
      case "icon":
        sizeStyles = "h-11 w-11";
        break;
    }

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
