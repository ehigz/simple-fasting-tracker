import { Pressable, Text, ActivityIndicator } from "react-native";
import { ReactNode } from "react";
import { colors } from "./theme";

interface ButtonProps {
  onPress: () => void;
  label: string;
  /**
   * primary   — filled purple, full-width CTAs
   * secondary — light purple bg + border, secondary actions (e.g. Copy Address)
   * ghost     — border only, destructive-adjacent or low-emphasis actions (e.g. Disconnect)
   */
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  /** Optional icon rendered to the left of the label */
  icon?: ReactNode;
  className?: string;
}

export function Button({
  onPress,
  label,
  variant = "primary",
  disabled = false,
  loading = false,
  icon,
  className = "",
}: ButtonProps) {
  const isDisabled = disabled || loading;

  if (variant === "primary") {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        className={`py-4 rounded-2xl items-center ${
          isDisabled ? "bg-muted" : "bg-primary active:bg-primary-hover"
        } ${className}`}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text className={`font-medium text-base ${isDisabled ? "text-muted-fg" : "text-white"}`}>
            {label}
          </Text>
        )}
      </Pressable>
    );
  }

  if (variant === "secondary") {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        className={`flex-row items-center justify-center gap-2 bg-secondary py-3 rounded-2xl active:opacity-70 border border-primary/10 ${className}`}
      >
        {icon}
        <Text className="text-accent-purple text-sm font-medium">{label}</Text>
      </Pressable>
    );
  }

  // ghost
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`flex-row items-center justify-center gap-2 py-3 rounded-2xl active:opacity-70 border border-primary/[0.12] ${className}`}
    >
      {icon}
      <Text className="text-primary text-sm font-medium">{label}</Text>
    </Pressable>
  );
}
