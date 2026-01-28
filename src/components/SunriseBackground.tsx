import { ReactNode, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";

interface SunriseBackgroundProps {
  children: ReactNode;
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export function SunriseBackground({ children }: SunriseBackgroundProps) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 15000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [1, 0.85]),
  }));

  return (
    <View style={styles.container}>
      {/* Base gradient layer */}
      <LinearGradient
        colors={[
          "#bcc9f2",
          "#c8bee8",
          "#d4b3e8",
          "#e8a8d4",
          "#ff9d7a",
          "#ffb088",
          "#ffc299",
          "#ffd4b3",
          "#ffe8cc",
          "#fff9e6",
          "#fffdf7",
          "#ffffff",
          "#ffffff",
        ]}
        locations={[0, 0.15, 0.22, 0.31, 0.42, 0.44, 0.46, 0.49, 0.53, 0.58, 0.65, 0.8, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Pulsing overlay for breathing effect */}
      <AnimatedLinearGradient
        colors={[
          "#bcc9f2",
          "#c8bee8",
          "#d4b3e8",
          "#e8a8d4",
          "#ff9d7a",
          "#ffb088",
          "#ffc299",
          "#ffd4b3",
          "#ffe8cc",
          "#fff9e6",
          "#ffffff",
          "#ffffff",
        ]}
        locations={[0, 0.13, 0.2, 0.27, 0.35, 0.4, 0.45, 0.52, 0.57, 0.62, 0.82, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, animatedStyle]}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 32,
  },
});
