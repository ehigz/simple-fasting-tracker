import { View, Text, Pressable, ScrollView, Linking } from "react-native";
import { ExternalLink, Mail } from "lucide-react-native";
import { Card, CardTitle, BodyText, MutedText, Divider, colors } from "../ui";

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

export function AboutScreen() {
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
          <ExternalNavRow label="Privacy Policy" url="https://simplefasting.io/privacy" />
          <Divider />
          <ExternalNavRow label="Terms of Use" url="https://simplefasting.io/terms" />
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
