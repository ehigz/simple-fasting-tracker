import "./global.css";

import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Text, Pressable, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Timer, History, Info } from "lucide-react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { SunriseBackground } from "./src/components/SunriseBackground";
import { DisclaimerModal } from "./src/components/DisclaimerModal";
import { FastingTracker } from "./src/screens/FastingTracker";
import { FastingHistory } from "./src/screens/FastingHistory";
import { AboutScreen } from "./src/screens/AboutScreen";
import { Overline, MutedText, colors } from "./src/ui";

const DISCLAIMER_KEY = "disclaimer_accepted";

type Tab = "track" | "history" | "about";

const TABS: { id: Tab; label: string; Icon: any }[] = [
  { id: "track",   label: "Track",   Icon: Timer   },
  { id: "history", label: "History", Icon: History  },
  { id: "about",   label: "About",   Icon: Info     },
];

function AppContent() {
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

  if (disclaimerAccepted === null) {
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

  return (
    <View style={styles.root}>
      <SunriseBackground>
        <View style={styles.header}>
          <Overline>&#10022; Track Your Journey &#10022;</Overline>
          <Text style={styles.headerText}>Fasting made simple.</Text>
          <MutedText className="text-center px-2">
            Discover when you'll reach each beneficial milestone and make informed decisions about your health.
          </MutedText>
        </View>
        <View style={styles.content}>
          {activeTab === "track"   && <FastingTracker />}
          {activeTab === "history" && <FastingHistory />}
          {activeTab === "about"   && <AboutScreen />}
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
      <StatusBar style="dark" />
      <AppContent />
    </SafeAreaProvider>
  );
}
