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
import { Card, Button, FieldLabel, Divider, Overline, MutedText, colors } from "./src/ui";

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
      <Card className="gap-6">
        <View className="gap-2">
          <FieldLabel className="text-center">Connected Wallet</FieldLabel>
          <Text className="text-primary text-base font-medium text-center">
            {ellipsify(address, 8)}
          </Text>
        </View>

        <Button
          variant="secondary"
          label={copied ? "Copied!" : "Copy Address"}
          onPress={handleCopy}
          icon={<Copy size={15} color={colors.accentPurple} />}
        />

        <Divider />

        <Button
          variant="ghost"
          label="Disconnect Wallet"
          onPress={onDisconnect}
          icon={<LogOut size={15} color={colors.primary} />}
        />
      </Card>
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
          <ActivityIndicator size="large" color={colors.primary} />
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
      <SunriseBackground>
        <View style={styles.header}>
          <Overline>&#10022; Track Your Journey &#10022;</Overline>
          <Text style={styles.headerText}>Fasting made simple.</Text>
          <MutedText className="text-center" style={{ paddingHorizontal: 8 }}>
            Discover when you'll reach each beneficial milestone and make informed decisions about your health.
          </MutedText>
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
                color={active ? colors.primary : colors.accentLight}
                strokeWidth={active ? 2.2 : 1.6}
              />
              <Text style={[styles.tabLabel, { color: active ? colors.primary : colors.accentLight }]}>
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
    gap: 6,
  },
  headerText: {
    color: colors.primary,
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
    backgroundColor: colors.tabBarBg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.tabBarBorder,
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
