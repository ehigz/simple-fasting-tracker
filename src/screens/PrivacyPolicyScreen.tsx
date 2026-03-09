import { ScrollView, View, Text, Pressable } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { colors } from "../ui";

interface Props {
  onBack: () => void;
}

export function PrivacyPolicyScreen({ onBack }: Props) {
  return (
    <View className="flex-1">
      {/* Back header */}
      <Pressable onPress={onBack} className="flex-row items-center gap-1.5 px-1 pb-4">
        <ArrowLeft size={20} color={colors.primary} />
        <Text className="text-primary text-base">About</Text>
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-12 gap-3">
        <Text className="text-primary text-2xl font-bold mb-1">Privacy Policy</Text>
        <Text className="text-muted-fg text-xs mb-2">Contact: hello@simplefasting.io</Text>

        <Text className="text-muted-fg text-sm leading-relaxed">
          This app does not collect, transmit, or store any personal data on external servers. Everything you enter stays on your device and is never accessible to the developer or anyone else.
        </Text>

        <Text className="text-primary text-base font-semibold mt-2">What Is Stored and Where</Text>
        <Text className="text-muted-fg text-sm leading-relaxed">
          • Fasting start and end times — Your device only{"\n"}
          • Fasting history and logs — Your device only{"\n"}
          • App preferences and settings — Your device only{"\n"}
          • Crash or error data — Your device only
        </Text>

        <Text className="text-primary text-base font-semibold mt-2">What We Do Not Do</Text>
        <Text className="text-muted-fg text-sm leading-relaxed">
          • We do not collect any personal information{"\n"}
          • We do not use analytics tools or usage tracking{"\n"}
          • We do not include advertising SDKs or show ads{"\n"}
          • We do not use crash reporting services{"\n"}
          • We do not have a backend server or database{"\n"}
          • We do not share any data with third parties because we have no data to share
        </Text>

        <Text className="text-primary text-base font-semibold mt-2">Global Privacy Laws</Text>
        <Text className="text-muted-fg text-sm leading-relaxed">
          This app is designed to collect nothing. This approach satisfies the core requirements of:{"\n\n"}
          PIPEDA (Canada) — no personal information is collected or transmitted{"\n"}
          GDPR (EU/UK) — no data processing occurs outside your device{"\n"}
          CCPA (California) — no data is sold, shared, or collected
        </Text>

        <Text className="text-primary text-base font-semibold mt-2">Your Data</Text>
        <Text className="text-muted-fg text-sm leading-relaxed">
          Because all data is stored locally on your device, you can delete it at any time by uninstalling the app. We have no copy of it and cannot retrieve, restore, or delete it on your behalf.
        </Text>

        <Text className="text-primary text-base font-semibold mt-2">Age Requirement</Text>
        <Text className="text-muted-fg text-sm leading-relaxed">
          This app is intended for users 18 and older. We do not knowingly collect information from anyone under 18. Because we collect no information at all, this is satisfied by design.
        </Text>

        <Text className="text-primary text-base font-semibold mt-2">Changes to This Policy</Text>
        <Text className="text-muted-fg text-sm leading-relaxed">
          If a future update changes how data is handled, this policy will be updated before that update is released. The effective date at the top of this page will reflect the most recent version.
        </Text>
      </ScrollView>
    </View>
  );
}
