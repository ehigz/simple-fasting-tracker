import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { colors } from "../ui";

interface Props {
  onBack: () => void;
}

export function TermsScreen({ onBack }: Props) {
  return (
    <View style={styles.container}>
      {/* Back header */}
      <Pressable onPress={onBack} style={styles.backRow}>
        <ArrowLeft size={20} color={colors.primary} />
        <Text style={styles.backLabel}>About</Text>
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Terms of Use</Text>
        <Text style={styles.meta}>Contact: hello@simplefasting.io</Text>
        <Text style={styles.body}>
          By using this app you agree to these terms. If you do not agree, do not use the app.
        </Text>

        <Text style={styles.heading}>1. What This App Is</Text>
        <Text style={styles.body}>
          This app is a personal fasting timer and log. It tracks when you start and end a fast, displays milestone information, and records your fasting history on your device.{"\n\n"}
          This app is not a medical device, health service, clinical tool, or dietary program of any kind. It is a personal tracking utility only.
        </Text>

        <Text style={styles.heading}>2. Medical Disclaimer</Text>
        <Text style={styles.disclaimerHeading}>This app does not provide medical advice.</Text>
        <Text style={styles.body}>
          All milestone information shown in this app is general and informational only. It is not tailored to your individual health circumstances and is not a substitute for professional medical advice, diagnosis, or treatment.{"\n\n"}
          Fasting is not appropriate for everyone. If you have any medical condition, are pregnant or breastfeeding, take prescription medication, or have any concern about your health, consult a qualified doctor before beginning or modifying a fasting practice.{"\n\n"}
          The developer is not responsible for any health outcomes, adverse events, or injuries that result from use of this app or reliance on any information it displays.
        </Text>

        <Text style={styles.heading}>3. Eligibility</Text>
        <Text style={styles.body}>
          This app is intended for users 18 years of age and older. By using this app you confirm that you are at least 18 years old.
        </Text>

        <Text style={styles.heading}>4. No Warranties</Text>
        <Text style={styles.body}>
          This app is provided as-is and without warranties of any kind. The developer makes no guarantees regarding the accuracy of timer data, the correctness of milestone information, the availability of the app, or the fitness of the app for any particular purpose.
        </Text>

        <Text style={styles.heading}>5. Limitation of Liability</Text>
        <Text style={styles.body}>
          To the maximum extent permitted by law, the developer's total liability to you for any claim arising from your use of this app is zero dollars ($0). This app is provided free of charge.{"\n\n"}
          The developer is not liable for any health outcomes, data loss resulting from device failure or app uninstallation, errors in timing or milestone display, or any indirect, incidental, or consequential damages of any kind.
        </Text>

        <Text style={styles.heading}>6. Governing Law</Text>
        <Text style={styles.body}>
          These terms are governed by the laws of the Province of Ontario, Canada, without regard to conflict of law principles.
        </Text>

        <Text style={styles.heading}>Changes to These Terms</Text>
        <Text style={styles.body}>
          If these terms change materially, the effective date at the top of this page will be updated. Continued use of the app after changes are posted constitutes acceptance of the updated terms.
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
  disclaimerHeading: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  body: {
    color: colors.mutedFg,
    fontSize: 14,
    lineHeight: 22,
  },
});
