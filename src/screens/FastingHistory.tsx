import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format, isToday, isYesterday } from "date-fns";
import Animated, { FadeIn } from "react-native-reanimated";
import { Clock } from "lucide-react-native";
import { FastingSession, FASTING_ZONES } from "../utils/fasting";
import { Card, CardTitle, BodyText, MutedText, StatValue, colors, motion } from "../ui";

const ZONE_COLOR: Record<string, string> = Object.fromEntries(
  FASTING_ZONES.map((z) => [z.name, z.color]),
);

function formatSessionDate(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d, yyyy");
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function SessionCard({ session }: { session: FastingSession }) {
  const startDate = new Date(session.startTime);
  const timeStr = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const topZone = session.zonesReached[session.zonesReached.length - 1];

  return (
    <Animated.View entering={FadeIn.duration(motion.duration.slow)}>
      <Card variant="sm" className="gap-3">
        {/* Date + duration row */}
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-primary font-semibold">
              {formatSessionDate(session.startTime)}
            </Text>
            <MutedText className="text-xs mt-0.5">Started at {timeStr}</MutedText>
          </View>
          <View className="items-end">
            <StatValue className="text-xl">{formatDuration(session.durationHours)}</StatValue>
            {topZone ? (
              <Text className="text-xs mt-0.5" style={{ color: ZONE_COLOR[topZone] ?? colors.accentPurple }}>
                {topZone}
              </Text>
            ) : (
              <MutedText className="text-xs mt-0.5">No zone</MutedText>
            )}
          </View>
        </View>

        {/* Zone badges */}
        {session.zonesReached.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5">
            {session.zonesReached.map((name) => (
              <View
                key={name}
                className="px-2.5 py-1 rounded-full border border-primary/[0.08] bg-secondary"
              >
                <Text className="text-xs" style={{ color: ZONE_COLOR[name] ?? colors.primary }}>
                  {name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </Animated.View>
  );
}

const HISTORY_KEY = "fasting_history";

export function FastingHistory() {
  const [sessions, setSessions] = useState<FastingSession[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    setSessions(raw ? JSON.parse(raw) : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleClearHistory = async () => {
    await AsyncStorage.removeItem(HISTORY_KEY);
    setSessions([]);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <MutedText>Loading...</MutedText>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="pb-12 gap-4"
      showsVerticalScrollIndicator={false}
    >
      {/* Header row */}
      <View className="flex-row items-center justify-between px-1">
        <Text className="text-primary font-semibold">
          {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
        </Text>
        {sessions.length > 0 && (
          <Pressable
            onPress={handleClearHistory}
            className="px-3 py-1 rounded-lg border border-primary/[0.10] active:opacity-60"
          >
            <MutedText className="text-xs">Clear all</MutedText>
          </Pressable>
        )}
      </View>

      {sessions.length === 0 ? (
        <Card className="items-center gap-4">
          <View className="w-16 h-16 bg-secondary rounded-2xl items-center justify-center">
            <Clock size={32} color={colors.primary} />
          </View>
          <View className="items-center gap-2">
            <CardTitle className="text-center">No sessions yet</CardTitle>
            <BodyText className="text-center">
              Start a fast and tap "Stop Fasting" when you're done — sessions over 1 hour are saved here.
            </BodyText>
          </View>
        </Card>
      ) : (
        sessions.map((s) => <SessionCard key={s.id} session={s} />)
      )}
    </ScrollView>
  );
}
