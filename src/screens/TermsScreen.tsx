import { ScrollView, View, Text, Pressable } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { colors } from "../ui";

interface Props {
  onBack: () => void;
}

export function TermsScreen({ onBack }: Props) {
  return (
    <View className="flex-1">
      {/* Back header */}
      <Pressable onPress={onBack} className="flex-row items-center gap-1.5 px-1 pb-4">
        <ArrowLeft size={20} color={colors.primary} />
        <Text className="text-primary text-base">About</Text>
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-12 gap-3">
        <Text className="text-primary text-2xl font-bold mb-1">Terms of Use</Text>
        <Text className="text-muted-fg text-xs mb-2">Contact: hello@simplefasting.io</Text>
        <Text className="text-muted-fg text-sm leading-relaxed">
          By using this app you agree to these terms. If you do not agree, do not use the app.
        </Text>

        <Text className="text-primary text-base font-semibold mt-2">1. What This App Is</Text>
        <Text className="text-muted-fg text-sm leading-relaxed">
          This app is a personal fasting timer and log. It tracks when you start and end a fast, displays milestone information, and records your fasting history on your device.{"\n\n"}
          This app is not a medical device, health service, clinical tool, or dietary program of any kind. It is a personal tracking utility only.
        </Text>

        <Text className="text-primary text-base font-semibold mt-2">2. Medical Disclaimer</Text>
        <Text className="text-primary text-sm font-semibold mb-1.5">This app does not provide medical advice.</Text>
        <Text className="text-muted-fg text-sm leading-relaxed">
          All milestone information shown in this app is general and informational only. It is not tailored to your individual health circumstances and is not a substitute for professional medical advice, diagnosis, or treatment.{"\n\n"}
          Fasting is not appropriate for everyone. If you have any medical condition, are pregnant or breastfeeding, take prescription medication, or have any concern about your health, consult a qualified doctor before beginning or modifying a fasting practice.{"\n\n"}
          The developer is not responsible for any health outcomes, adverse events, or injuries that result from use of this app or reliance on any information it displays.
        </Text>

        <Text className="text-primary text-base font-semibold mt-2">3. Eligibility</Text>
        <Text className="text-muted-fg text-sm leading-relaxed">
          This app is intended for users 18 years of age and older. By using this app you confirm that you are at least 18 years old.
        </Text>

        <Text className="text-primary text-base font-semibold mt-2">4. No Warranties</Text>
        <Text className="text-muted-fg text-sm leading-relaxed">
          This app is provided as-is and without warranties of any kind. The developer makes no guarantees regarding the accuracy of timer data, the correctness of milestone information, the availability of the app, or the fitness of the app for any particular purpose.
        </Text>

        <Text className="text-primary text-base font-semibold mt-2">5. Limitation of Liability</Text>
        <Text className="text-muted-fg text-sm leading-relaxed">
          To the maximum extent permitted by law, the developer's total liability to you for any claim arising from your use of this app is zero dollars ($0). This app is provided free of charge.{"\n\n"}
          The developer is not liable for any health outcomes, data loss resulting from device failure or app uninstallation, errors in timing or milestone display, or any indirect, incidental, or consequential damages of any kind.
        </Text>

        <Text className="text-primary text-base font-semibold mt-2">6. Governing Law</Text>
        <Text className="text-muted-fg text-sm leading-relaxed">
          These terms are governed by the laws of the Province of Ontario, Canada, without regard to conflict of law principles.
        </Text>

        <Text className="text-primary text-base font-semibold mt-2">Changes to These Terms</Text>
        <Text className="text-muted-fg text-sm leading-relaxed">
          If these terms change materially, the effective date at the top of this page will be updated. Continued use of the app after changes are posted constitutes acceptance of the updated terms.
        </Text>
      </ScrollView>
    </View>
  );
}
