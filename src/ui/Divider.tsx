import { View } from "react-native";

/** Hairline horizontal separator matching card border opacity */
export function Divider({ className = "" }: { className?: string }) {
  return <View className={`h-px bg-primary/[0.06] ${className}`} />;
}
