import * as React from "react";

export function PageTitle({ className = "", children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1 className={`text-3xl font-semibold tracking-tight text-foreground ${className}`} {...props}>
      {children}
    </h1>
  );
}

export function SectionTitle({ className = "", children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={`text-xl font-medium tracking-tight text-foreground ${className}`} {...props}>
      {children}
    </h2>
  );
}

export function CardTitle({ className = "", children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-base font-medium leading-snug text-foreground ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function Body({ className = "", children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm leading-relaxed text-muted-foreground ${className}`} {...props}>
      {children}
    </p>
  );
}

export function Caption({ className = "", children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-xs text-muted-foreground uppercase tracking-wider ${className}`} {...props}>
      {children}
    </p>
  );
}
