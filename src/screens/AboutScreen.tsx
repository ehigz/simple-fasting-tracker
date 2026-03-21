import { useState } from "react";
import { View, Text, Pressable, ScrollView, Linking } from "react-native";
import { ChevronRight, ExternalLink, Mail } from "lucide-react-native";
import { Card, CardTitle, BodyText, MutedText, Divider, colors } from "../ui";
import { PrivacyPolicyScreen } from "./PrivacyPolicyScreen";
import { TermsScreen } from "./TermsScreen";

type View_ = "about" | "privacy" | "terms";

function NavRow({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between py-3 active:opacity-60"
    >
      <Text className="text-primary text-base">{label}</Text>
      <ChevronRight size={18} color={colors.accentLight} />
    </Pressable>
  );
}

function ExternalNavRow({ label, url }: { label: string; url: string }) {
  return (
    <Pressable
      onPress={() => Linking.openURL(url)}
      className="flex-row items-center justify-between py-3 active:opacity-60"
    >
      <Text className="text-primary text-base">{label}</Text>
      <ExternalLink size={18} color={colors.accentLight} />
    </Pressable>
  );
}

function AboutRoot({ onNavigate }: { onNavigate: (v: View_) => void }) {
  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="pb-12"
      showsVerticalScrollIndicator={false}
    >
      <Card className="gap-6">
        {/* App identity */}
        <View className="items-center gap-2">
          <CardTitle className="text-center">Simple Fasting</CardTitle>
          <BodyText className="text-center">
            A local-only fasting tracker. No accounts, no data collection, no network.
          </BodyText>
        </View>

        <Divider />

        {/* Legal links */}
        <View>
          <NavRow label="Privacy Policy" onPress={() => onNavigate("privacy")} />
          <Divider />
          <NavRow label="Terms of Use" onPress={() => onNavigate("terms")} />
          <Divider />
          <ExternalNavRow label="License" url="https://simplefasting.io/license" />
          <Divider />
          <ExternalNavRow label="Copyright" url="https://simplefasting.io/copyright" />
        </View>

        <Divider />

        {/* Contact */}
        <Pressable
          onPress={() => Linking.openURL("mailto:hello@simplefasting.io")}
          className="flex-row items-center gap-3 active:opacity-60"
        >
          <Mail size={18} color={colors.accentPurple} />
          <MutedText>hello@simplefasting.io</MutedText>
        </Pressable>
      </Card>
    </ScrollView>
  );
}

export function AboutScreen() {
  const [view, setView] = useState<View_>("about");

  if (view === "privacy") {
    return <PrivacyPolicyScreen onBack={() => setView("about")} />;
  }
  if (view === "terms") {
    return <TermsScreen onBack={() => setView("about")} />;
  }
  return <AboutRoot onNavigate={setView} />;
}
