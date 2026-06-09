import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CardProps {
  children: ReactNode;
  className?: string;
  pad?: string;
  onClick?: () => void;
}

export function Card({ children, className, pad = "p-6", onClick }: CardProps) {
  return (
    <div className={cn("card", pad, onClick && "tap cursor-pointer", className)} onClick={onClick}>
      {children}
    </div>
  );
}
