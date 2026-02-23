import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format, isToday, isYesterday } from "date-fns";
import Animated, { FadeIn } from "react-native-reanimated";
import { useAuthorization } from "../utils/useAuthorization";
import { FastingSession, FASTING_ZONES } from "../utils/fasting";

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
    <Animated.View
      entering={FadeIn.duration(400)}
      className="bg-white/95 rounded-2xl p-5 border border-primary/[0.08] gap-3"
    >
      {/* Date + duration row */}
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-primary font-medium">
            {formatSessionDate(session.startTime)}
          </Text>
          <Text className="text-muted-fg text-xs mt-0.5">
            Started at {timeStr}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-primary text-xl font-semibold">
            {formatDuration(session.durationHours)}
          </Text>
          {topZone ? (
            <Text className="text-xs mt-0.5" style={{ color: ZONE_COLOR[topZone] ?? "#6e5fa7" }}>
              {topZone}
            </Text>
          ) : (
            <Text className="text-muted-fg text-xs mt-0.5">No zone</Text>
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
              <Text className="text-xs" style={{ color: ZONE_COLOR[name] ?? "#340247" }}>
                {name}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

export function FastingHistory() {
  const { selectedAccount } = useAuthorization();
  const [sessions, setSessions] = useState<FastingSession[]>([]);
  const [loading, setLoading] = useState(true);

  const historyKey = selectedAccount
    ? `fasting_history_${selectedAccount.publicKey.toBase58()}`
    : null;

  const load = useCallback(async () => {
    if (!historyKey) return;
    const raw = await AsyncStorage.getItem(historyKey);
    setSessions(raw ? JSON.parse(raw) : []);
    setLoading(false);
  }, [historyKey]);

  useEffect(() => {
    load();
  }, [load]);

  const handleClearHistory = async () => {
    if (!historyKey) return;
    await AsyncStorage.removeItem(historyKey);
    setSessions([]);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-muted-fg text-sm">Loading...</Text>
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
          <Pressable onPress={handleClearHistory} className="active:opacity-60">
            <Text className="text-muted-fg text-xs">Clear all</Text>
          </Pressable>
        )}
      </View>

      {sessions.length === 0 ? (
        <View className="bg-white/95 rounded-3xl p-10 items-center border border-primary/[0.08]">
          <Text className="text-4xl mb-4">🕐</Text>
          <Text className="text-primary font-semibold text-lg text-center mb-2">
            No sessions yet
          </Text>
          <Text className="text-muted-fg text-sm text-center leading-relaxed">
            Start a fast and tap "Stop Fasting" when you're done — sessions over
            1 hour are saved here.
          </Text>
        </View>
      ) : (
        sessions.map((s) => <SessionCard key={s.id} session={s} />)
      )}
    </ScrollView>
  );
}
