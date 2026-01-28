import { View, Text, Pressable } from "react-native";
import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { FastingZoneData, formatCountdown, formatTargetTime } from "../utils/fasting";

interface FastingZoneProps {
  zone: FastingZoneData;
  startTime: Date;
  currentTime: Date;
}

export function FastingZone({ zone, startTime, currentTime }: FastingZoneProps) {
  const [showBreakingInfo, setShowBreakingInfo] = useState(false);
  const targetTime = new Date(startTime.getTime() + zone.hours * 60 * 60 * 1000);
  const timeElapsed = currentTime.getTime() - startTime.getTime();
  const timeToTarget = targetTime.getTime() - currentTime.getTime();
  const isCompleted = timeToTarget <= 0;
  const progress = Math.min(
    (timeElapsed / (zone.hours * 60 * 60 * 1000)) * 100,
    100,
  );

  const progressWidth = useSharedValue(0);
  progressWidth.value = withTiming(progress, { duration: 1000 });

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      layout={Layout.springify()}
      className={`p-5 rounded-2xl border ${
        isCompleted
          ? "border-accent-light bg-secondary"
          : "border-primary/[0.08] bg-white/50"
      }`}
    >
      {/* Header */}
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-1 mr-4">
          <View className="flex-row items-center gap-3 mb-2">
            {isCompleted ? (
              <Animated.View entering={FadeIn.duration(500)}>
                <CheckCircle2 size={22} color="#6e5fa7" />
              </Animated.View>
            ) : (
              <Circle size={22} color="#d4cfe6" />
            )}
            <Text className="text-primary tracking-tight">
              {zone.name}{" "}
              <Text className="text-muted-fg">({zone.hours}h)</Text>
            </Text>
          </View>
          <Text className="text-muted-fg text-sm ml-9 leading-relaxed">
            {zone.benefits}
          </Text>
        </View>

        <View className="items-end">
          {isCompleted ? (
            <Animated.View entering={FadeIn.duration(300)}>
              <Text className="text-accent-purple text-xs px-3 py-1.5 bg-surface rounded-full">
                Completed
              </Text>
            </Animated.View>
          ) : (
            <View>
              <Text className="text-primary text-sm text-right">
                {formatCountdown(timeToTarget)}
              </Text>
              <Text className="text-muted-fg text-xs text-right">
                {formatTargetTime(targetTime)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Progress bar */}
      {!isCompleted && (
        <View className="h-1.5 bg-surface rounded-full overflow-hidden mb-4">
          <Animated.View
            style={[
              progressStyle,
              { backgroundColor: zone.color, borderRadius: 9999, height: "100%" },
            ]}
          />
        </View>
      )}

      {/* Breaking fast toggle */}
      <View className="mt-4 pt-4 border-t border-primary/[0.06]">
        <Pressable
          onPress={() => setShowBreakingInfo(!showBreakingInfo)}
          className="flex-row items-center gap-2"
        >
          <Text className="text-accent-light text-sm">
            {showBreakingInfo ? "\u2212" : "+"}
          </Text>
          <Text className="text-muted-fg text-sm">
            {showBreakingInfo ? "Hide" : "Show"} breaking fast guidance
          </Text>
        </Pressable>

        {showBreakingInfo && (
          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            className="mt-4 gap-4"
          >
            {/* Notes */}
            <Animated.View
              entering={SlideInDown.duration(300).delay(100)}
              className={`p-4 rounded-xl border ${
                zone.hours >= 24
                  ? "bg-primary/[0.04] border-warn-border"
                  : "bg-primary/[0.04] border-accent/30"
              }`}
            >
              <Text className="text-primary text-sm leading-relaxed">
                {zone.breakingFast.notes}
              </Text>
            </Animated.View>

            {/* Recommended foods */}
            <Animated.View
              entering={SlideInDown.duration(300).delay(200)}
              className="bg-primary/[0.04] p-4 rounded-xl border border-accent/30"
            >
              <View className="flex-row items-center gap-2 mb-3">
                <Text className="text-accent-purple">{"\u2713"}</Text>
                <Text className="text-primary text-sm">Recommended foods</Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {zone.breakingFast.foods.map((food, index) => (
                  <View
                    key={index}
                    className="bg-white px-3 py-1.5 rounded-full border border-primary/[0.08]"
                  >
                    <Text className="text-primary text-xs">{food}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Avoid */}
            <Animated.View
              entering={SlideInDown.duration(300).delay(300)}
              className="bg-warn p-4 rounded-xl border border-warn-border"
            >
              <View className="flex-row items-center gap-2 mb-3">
                <Text className="text-warn-icon">{"\u2717"}</Text>
                <Text className="text-primary text-sm">Avoid</Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {zone.breakingFast.avoid.map((item, index) => (
                  <View
                    key={index}
                    className="bg-white px-3 py-1.5 rounded-full border border-primary/[0.08]"
                  >
                    <Text className="text-primary text-xs">{item}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}
