import { Text } from "react-native";
import { ReactNode } from "react";

interface TypographyProps {
  children: ReactNode;
  className?: string;
}

/**
 * Small all-caps label, often with ✦ star decorators.
 * Used for section overlines ("✦ Track Your Journey ✦", "✦ Connect to Begin ✦").
 */
export function Overline({ children, className = "" }: TypographyProps) {
  return (
    <Text className={`text-primary text-xs uppercase tracking-widest opacity-60 ${className}`}>
      {children}
    </Text>
  );
}

/**
 * All-caps field/stat label above inputs or data pairs.
 * e.g. "Start Date", "Fasting Since", "Connected Wallet"
 */
export function FieldLabel({ children, className = "" }: TypographyProps) {
  return (
    <Text className={`text-muted-fg text-xs uppercase tracking-widest ${className}`}>
      {children}
    </Text>
  );
}

/**
 * Primary card heading. e.g. "When did you start fasting?", "Simple Fasting Tracker"
 */
export function CardTitle({ children, className = "" }: TypographyProps) {
  return (
    <Text className={`text-primary text-2xl tracking-tight font-semibold ${className}`}>
      {children}
    </Text>
  );
}

/**
 * Standard body/description text. Muted, relaxed line-height.
 */
export function BodyText({ children, className = "" }: TypographyProps) {
  return (
    <Text className={`text-muted-fg text-base leading-relaxed ${className}`}>
      {children}
    </Text>
  );
}

/**
 * Small muted text. e.g. subtitles, helper copy, timestamps.
 */
export function MutedText({ children, className = "" }: TypographyProps) {
  return (
    <Text className={`text-muted-fg text-sm ${className}`}>
      {children}
    </Text>
  );
}

/**
 * Numeric or data value displayed alongside a FieldLabel.
 * e.g. "16h 30m", "Today, 8:00 PM", session duration.
 * Use className="text-xl" to scale up for hero metrics.
 */
export function StatValue({ children, className = "" }: TypographyProps) {
  return (
    <Text className={`text-primary text-lg font-semibold ${className}`}>
      {children}
    </Text>
  );
}
