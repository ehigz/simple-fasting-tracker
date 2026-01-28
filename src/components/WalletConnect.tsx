import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useMobileWallet } from "../utils/useMobileWallet";
import { alertAndLog } from "../utils/alertAndLog";

interface WalletConnectProps {
  onConnected: () => void;
}

export function WalletConnect({ onConnected }: WalletConnectProps) {
  const { connect } = useMobileWallet();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      await connect();
      onConnected();
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
    <View className="flex-1 justify-center items-center px-8">
      <View className="items-center mb-10">
        <View className="flex-row items-center gap-2 mb-6 opacity-70">
          <Text className="text-primary text-xs uppercase tracking-widest">
            &#10022; Connect to Begin &#10022;
          </Text>
        </View>
        <Text className="text-primary text-3xl text-center tracking-tight mb-3 font-semibold">
          Simple Fasting Tracker
        </Text>
        <Text className="text-muted-fg text-base text-center leading-relaxed max-w-xs">
          Connect your Solana wallet to start tracking your fasting journey.
        </Text>
      </View>

      <View className="w-full max-w-xs">
        <Pressable
          onPress={handleConnect}
          disabled={connecting}
          className="bg-primary py-4 rounded-2xl items-center active:bg-primary-hover disabled:bg-muted"
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
