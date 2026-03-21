import { Modal, View, Text, Pressable, ScrollView, Linking } from "react-native";

interface DisclaimerModalProps {
  visible: boolean;
  onAccept: () => void;
}

export function DisclaimerModal({ visible, onAccept }: DisclaimerModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <View className="flex-1 justify-center items-center bg-black/50 px-6">
        <View className="bg-white rounded-3xl p-8 max-w-md w-full">
          <View className="items-center mb-6">
            <View className="w-16 h-16 bg-secondary rounded-2xl items-center justify-center mb-4">
              <Text className="text-2xl">&#9432;</Text>
            </View>
            <Text className="text-primary text-xl font-semibold text-center tracking-tight">
              Important Notice
            </Text>
          </View>

          <ScrollView className="max-h-64 mb-6">
            <Text className="text-primary text-sm leading-6 font-semibold mb-3">
              This app does not provide medical advice.
            </Text>

            <Text className="text-muted-fg text-sm leading-6 mb-4">
              All milestone information shown in this app is general and informational only. It is not tailored to your individual health circumstances and is not a substitute for professional medical advice, diagnosis, or treatment.
            </Text>

            <Text className="text-muted-fg text-sm leading-6 mb-4">
              Fasting is not appropriate for everyone. If you have any medical condition, are pregnant or breastfeeding, take prescription medication, or have any concern about your health, consult a qualified doctor before beginning or modifying a fasting practice.
            </Text>

            <Text className="text-muted-fg text-sm leading-6">
              The developer is not responsible for any health outcomes, adverse events, or injuries that result from use of this app or reliance on any information it displays.
            </Text>
          </ScrollView>

          <Text className="text-muted-fg text-xs text-center mb-4">
            By accepting you agree to our{" "}
            <Text
              className="text-primary underline"
              onPress={() => Linking.openURL("https://simplefasting.io/terms")}
            >
              Terms of Use
            </Text>
            {" and "}
            <Text
              className="text-primary underline"
              onPress={() => Linking.openURL("https://simplefasting.io/privacy")}
            >
              Privacy Policy
            </Text>
            .
          </Text>

          <Pressable
            onPress={onAccept}
            className="bg-primary py-4 rounded-2xl items-center active:bg-primary-hover"
          >
            <Text className="text-white font-medium text-base">
              I Understand &amp; Accept
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
