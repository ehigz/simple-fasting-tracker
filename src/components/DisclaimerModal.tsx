import { Modal, View, Text, Pressable, ScrollView } from "react-native";

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
            <Text className="text-muted-fg text-sm leading-6 mb-4">
              This application is designed for{" "}
              <Text className="font-semibold text-primary">
                informational purposes only
              </Text>{" "}
              and does not constitute medical advice, diagnosis, or treatment.
            </Text>

            <Text className="text-muted-fg text-sm leading-6 mb-4">
              The fasting phases, timelines, and dietary suggestions presented
              are based on general wellness information and may not be
              appropriate for your individual health situation.
            </Text>

            <Text className="text-muted-fg text-sm leading-6 mb-4">
              Always consult with a qualified healthcare provider before
              starting any fasting regimen, especially if you have existing
              medical conditions, are pregnant or nursing, or are taking
              medication.
            </Text>

            <Text className="text-primary text-sm leading-6 font-semibold">
              By continuing, you acknowledge that you understand this
              information is not a substitute for professional medical advice
              and that you use this app at your own discretion.
            </Text>
          </ScrollView>

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
