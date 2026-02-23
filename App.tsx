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
import { FastingHistory } from "./src/components/FastingHistory";
import { ellipsify } from "./src/utils/ellipsify";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useMobileWallet } from "./src/utils/useMobileWallet";

const queryClient = new QueryClient();
const DISCLAIMER_KEY = "disclaimer_accepted";

type Tab = "track" | "history";

function AppContent() {
  const { selectedAccount, isLoading } = useAuthorization();
  const { disconnect } = useMobileWallet();
  const [disclaimerAccepted, setDisclaimerAccepted] = useState<boolean | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<Tab>("track");

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
        <WalletConnect />
      </SunriseBackground>
    );
  }

  // Connected — show tracker + history tabs
  return (
    <SunriseBackground>
      <View className="flex-1 max-w-2xl mx-auto w-full">
        {/* Header */}
        <View className="items-center mb-5 gap-3">
          <View className="flex-row items-center gap-2 opacity-70">
            <Text className="text-primary text-xs uppercase tracking-widest">
              &#10022; Track Your Journey &#10022;
            </Text>
          </View>
          <Text className="text-primary text-3xl text-center tracking-tight font-bold">
            Fasting made simple.
          </Text>
        </View>

        {/* Wallet info bar */}
        <View className="flex-row items-center justify-between mb-4 px-2">
          <Text className="text-muted-fg text-xs">
            {ellipsify(selectedAccount.publicKey.toBase58())}
          </Text>
          <Pressable onPress={handleDisconnect} className="active:opacity-70">
            <Text className="text-accent-purple text-xs">Disconnect</Text>
          </Pressable>
        </View>

        {/* Tab bar */}
        <View className="flex-row bg-white/60 rounded-2xl p-1 mb-4 border border-primary/[0.06]">
          <Pressable
            onPress={() => setActiveTab("track")}
            className={`flex-1 py-2.5 rounded-xl items-center ${
              activeTab === "track" ? "bg-primary" : ""
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                activeTab === "track" ? "text-white" : "text-muted-fg"
              }`}
            >
              Track
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("history")}
            className={`flex-1 py-2.5 rounded-xl items-center ${
              activeTab === "history" ? "bg-primary" : ""
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                activeTab === "history" ? "text-white" : "text-muted-fg"
              }`}
            >
              History
            </Text>
          </Pressable>
        </View>

        {activeTab === "track" ? <FastingTracker /> : <FastingHistory />}
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
