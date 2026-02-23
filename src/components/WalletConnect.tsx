import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useMobileWallet } from "../utils/useMobileWallet";
import { alertAndLog } from "../utils/alertAndLog";

export function WalletConnect() {
  const { connect } = useMobileWallet();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      await connect();
    } catch (err: any) {
      alertAndLog(
        "Connection failed",
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setConnecting(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-2">
      <View className="bg-white/95 rounded-3xl p-6 border border-primary/[0.08] gap-6">
        {/* Header */}
        <View className="items-center gap-3">
          <Text className="text-primary text-xs uppercase tracking-widest opacity-60">
            &#10022; Connect to Begin &#10022;
          </Text>
          <Text className="text-primary text-2xl text-center tracking-tight font-semibold">
            Simple Fasting Tracker
          </Text>
          <Text className="text-muted-fg text-base text-center leading-relaxed">
            Connect your Solana wallet to start tracking your fasting journey.
          </Text>
        </View>

        {/* Divider */}
        <View className="h-px bg-primary/[0.06]" />

        {/* Connect button */}
        <Pressable
          onPress={handleConnect}
          disabled={connecting}
          className="bg-primary py-4 rounded-2xl items-center active:opacity-80 disabled:bg-muted"
        >
          {connecting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-medium text-base">
              Connect Wallet
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
