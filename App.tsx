import "./global.css";
import "./src/polyfills";

import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectionProvider } from "./src/utils/ConnectionProvider";
import { ClusterProvider } from "./src/components/cluster/cluster-data-access";
import { useAuthorization } from "./src/utils/useAuthorization";
import { SunriseBackground } from "./src/components/SunriseBackground";
import { DisclaimerModal } from "./src/components/DisclaimerModal";
import { WalletConnect } from "./src/components/WalletConnect";
import { FastingTracker } from "./src/components/FastingTracker";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useMobileWallet } from "./src/utils/useMobileWallet";

const queryClient = new QueryClient();
const DISCLAIMER_KEY = "disclaimer_accepted";

function AppContent() {
  const { selectedAccount, isLoading } = useAuthorization();
  const { disconnect } = useMobileWallet();
  const [disclaimerAccepted, setDisclaimerAccepted] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    AsyncStorage.getItem(DISCLAIMER_KEY).then((value) => {
      setDisclaimerAccepted(value === "true");
    });
  }, []);

  const handleAcceptDisclaimer = async () => {
    await AsyncStorage.setItem(DISCLAIMER_KEY, "true");
    setDisclaimerAccepted(true);
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch {
      // Ignore disconnect errors
    }
  };

  // Loading state
  if (disclaimerAccepted === null || isLoading) {
    return (
      <SunriseBackground>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#340247" />
        </View>
      </SunriseBackground>
    );
  }

  // Disclaimer not yet accepted
  if (!disclaimerAccepted) {
    return (
      <SunriseBackground>
        <DisclaimerModal
          visible={!disclaimerAccepted}
          onAccept={handleAcceptDisclaimer}
        />
      </SunriseBackground>
    );
  }

  // Not connected
  if (!selectedAccount) {
    return (
      <SunriseBackground>
        <WalletConnect onConnected={() => {}} />
      </SunriseBackground>
    );
  }

  // Connected — show fasting tracker
  return (
    <SunriseBackground>
      <View className="flex-1 max-w-2xl mx-auto w-full">
        {/* Header */}
        <View className="items-center mb-6 gap-4">
          <View className="flex-row items-center gap-2 opacity-70">
            <Text className="text-primary text-xs uppercase tracking-widest">
              &#10022; Track Your Journey &#10022;
            </Text>
          </View>
          <Text className="text-primary text-3xl text-center tracking-tight font-bold">
            Fasting made simple.
          </Text>
          <Text className="text-primary/70 text-base text-center leading-relaxed px-4">
            Discover when you'll reach each beneficial milestone and make
            informed decisions about your health.
          </Text>
        </View>

        {/* Wallet info bar */}
        <View className="flex-row items-center justify-between mb-4 px-2">
          <Text className="text-muted-fg text-xs">
            {selectedAccount.publicKey.toBase58().slice(0, 4)}...
            {selectedAccount.publicKey.toBase58().slice(-4)}
          </Text>
          <Pressable
            onPress={handleDisconnect}
            className="active:opacity-70"
          >
            <Text className="text-accent-purple text-xs">Disconnect</Text>
          </Pressable>
        </View>

        <FastingTracker />
      </View>
    </SunriseBackground>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClusterProvider>
        <ConnectionProvider config={{ commitment: "processed" }}>
          <StatusBar style="dark" />
          <AppContent />
        </ConnectionProvider>
      </ClusterProvider>
    </QueryClientProvider>
  );
}
