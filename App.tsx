import "./global.css";
import "./src/polyfills";

import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Text, Pressable, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Timer, History, Wallet, Copy, LogOut } from "lucide-react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { ConnectionProvider } from "./src/utils/ConnectionProvider";
import { ClusterProvider } from "./src/components/cluster/cluster-data-access";
import { useAuthorization } from "./src/utils/useAuthorization";
import { SunriseBackground } from "./src/components/SunriseBackground";
import { DisclaimerModal } from "./src/components/DisclaimerModal";
import { WalletConnect } from "./src/components/WalletConnect";
import { FastingTracker } from "./src/components/FastingTracker";
import { FastingHistory } from "./src/components/FastingHistory";
import { ellipsify } from "./src/utils/ellipsify";
import { useMobileWallet } from "./src/utils/useMobileWallet";

const queryClient = new QueryClient();
const DISCLAIMER_KEY = "disclaimer_accepted";

type Tab = "track" | "history" | "account";

const TABS: { id: Tab; label: string; Icon: any }[] = [
  { id: "track",   label: "Track",   Icon: Timer   },
  { id: "history", label: "History", Icon: History  },
  { id: "account", label: "Account", Icon: Wallet   },
];

function AccountTab({
  address,
  onDisconnect,
}: {
  address: string;
  onDisconnect: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View className="flex-1 justify-center px-2 gap-4">
      <View className="bg-white/95 rounded-3xl p-6 border border-primary/[0.08] gap-6">
        {/* Address */}
        <View className="gap-2">
          <Text className="text-muted-fg text-xs uppercase tracking-widest text-center">
            Connected Wallet
          </Text>
          <Text className="text-primary text-base font-medium text-center">
            {ellipsify(address, 8)}
          </Text>
        </View>

        {/* Copy address */}
        <Pressable
          onPress={handleCopy}
          className="flex-row items-center justify-center gap-2 bg-secondary py-3 rounded-2xl active:opacity-70 border border-primary/10"
        >
          <Copy size={15} color="#6e5fa7" />
          <Text className="text-accent-purple text-sm font-medium">
            {copied ? "Copied!" : "Copy Address"}
          </Text>
        </Pressable>

        {/* Divider */}
        <View className="h-px bg-primary/[0.06]" />

        {/* Disconnect */}
        <Pressable
          onPress={onDisconnect}
          className="flex-row items-center justify-center gap-2 py-3 rounded-2xl active:opacity-70 border border-primary/[0.12]"
        >
          <LogOut size={15} color="#340247" />
          <Text className="text-primary text-sm font-medium">Disconnect Wallet</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AppContent() {
  const { selectedAccount, isLoading } = useAuthorization();
  const { disconnect } = useMobileWallet();
  const insets = useSafeAreaInsets();
  const [disclaimerAccepted, setDisclaimerAccepted] = useState<boolean | null>(null);
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

  if (disclaimerAccepted === null || isLoading) {
    return (
      <SunriseBackground>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#340247" />
        </View>
      </SunriseBackground>
    );
  }

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

  if (!selectedAccount) {
    return (
      <SunriseBackground>
        <WalletConnect />
      </SunriseBackground>
    );
  }

  const address = selectedAccount.publicKey.toBase58();

  return (
    <View style={styles.root}>
      {/* Gradient background + header + tab content */}
      <SunriseBackground>
        <View style={styles.header}>
          <Text style={styles.headerText}>Fasting made simple.</Text>
        </View>
        <View style={styles.content}>
          {activeTab === "track"   && <FastingTracker />}
          {activeTab === "history" && <FastingHistory />}
          {activeTab === "account" && (
            <AccountTab address={address} onDisconnect={handleDisconnect} />
          )}
        </View>
      </SunriseBackground>

      {/* Bottom tab bar — outside SunriseBackground so flex chain is unambiguous */}
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 4) }]}>
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <Pressable
              key={id}
              onPress={() => setActiveTab(id)}
              style={styles.tabItem}
            >
              <Icon
                size={22}
                color={active ? "#340247" : "#a89fc9"}
                strokeWidth={active ? 2.2 : 1.6}
              />
              <Text style={[styles.tabLabel, { color: active ? "#340247" : "#a89fc9" }]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: {
    color: "#340247",
    fontSize: 30,
    textAlign: "center",
    letterSpacing: -0.5,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    paddingTop: 8,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(52, 2, 71, 0.12)",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ClusterProvider>
          <ConnectionProvider config={{ commitment: "processed" }}>
            <StatusBar style="dark" />
            <AppContent />
          </ConnectionProvider>
        </ClusterProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
