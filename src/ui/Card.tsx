import { View } from "react-native";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  /**
   * default — rounded-3xl p-6  (main content cards)
   * sm      — rounded-2xl p-5  (list item cards, e.g. SessionCard)
   */
  variant?: "default" | "sm";
  className?: string;
}

export function Card({ children, variant = "default", className = "" }: CardProps) {
  const base =
    variant === "sm"
      ? "bg-white/95 rounded-2xl p-5 border border-primary/[0.08]"
      : "bg-white/95 rounded-3xl p-6 border border-primary/[0.08]";

  return <View className={`${base} ${className}`}>{children}</View>;
}
