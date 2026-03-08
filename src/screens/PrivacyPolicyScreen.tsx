import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { colors } from "../ui";

interface Props {
  onBack: () => void;
}

export function PrivacyPolicyScreen({ onBack }: Props) {
  return (
    <View style={styles.container}>
      {/* Back header */}
      <Pressable onPress={onBack} style={styles.backRow}>
        <ArrowLeft size={20} color={colors.primary} />
        <Text style={styles.backLabel}>About</Text>
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.meta}>Contact: hello@simplefasting.io</Text>

        <Text style={styles.body}>
          This app does not collect, transmit, or store any personal data on external servers. Everything you enter stays on your device and is never accessible to the developer or anyone else.
        </Text>

        <Text style={styles.heading}>What Is Stored and Where</Text>
        <Text style={styles.body}>
          • Fasting start and end times — Your device only{"\n"}
          • Fasting history and logs — Your device only{"\n"}
          • App preferences and settings — Your device only{"\n"}
          • Crash or error data — Your device only
        </Text>

        <Text style={styles.heading}>What We Do Not Do</Text>
        <Text style={styles.body}>
          • We do not collect any personal information{"\n"}
          • We do not use analytics tools or usage tracking{"\n"}
          • We do not include advertising SDKs or show ads{"\n"}
          • We do not use crash reporting services{"\n"}
          • We do not have a backend server or database{"\n"}
          • We do not share any data with third parties because we have no data to share
        </Text>

        <Text style={styles.heading}>Global Privacy Laws</Text>
        <Text style={styles.body}>
          This app is designed to collect nothing. This approach satisfies the core requirements of:{"\n\n"}
          PIPEDA (Canada) — no personal information is collected or transmitted{"\n"}
          GDPR (EU/UK) — no data processing occurs outside your device{"\n"}
          CCPA (California) — no data is sold, shared, or collected
        </Text>

        <Text style={styles.heading}>Your Data</Text>
        <Text style={styles.body}>
          Because all data is stored locally on your device, you can delete it at any time by uninstalling the app. We have no copy of it and cannot retrieve, restore, or delete it on your behalf.
        </Text>

        <Text style={styles.heading}>Age Requirement</Text>
        <Text style={styles.body}>
          This app is intended for users 18 and older. We do not knowingly collect information from anyone under 18. Because we collect no information at all, this is satisfied by design.
        </Text>

        <Text style={styles.heading}>Changes to This Policy</Text>
        <Text style={styles.body}>
          If a future update changes how data is handled, this policy will be updated before that update is released. The effective date at the top of this page will reflect the most recent version.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
    paddingBottom: 16,
  },
  backLabel: {
    color: colors.primary,
    fontSize: 16,
  },
  content: {
    paddingBottom: 48,
    gap: 12,
  },
  title: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  meta: {
    color: colors.mutedFg,
    fontSize: 13,
    marginBottom: 8,
  },
  heading: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  body: {
    color: colors.mutedFg,
    fontSize: 14,
    lineHeight: 22,
  },
});
