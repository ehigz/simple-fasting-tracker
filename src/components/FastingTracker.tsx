import { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, ScrollView, Platform } from "react-native";
import { Clock, Calendar as CalendarIcon } from "lucide-react-native";
import {
  format,
  subDays,
  isToday,
  isYesterday,
  intervalToDuration,
} from "date-fns";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthorization } from "../utils/useAuthorization";
import { FASTING_ZONES } from "../utils/fasting";
import { FastingZone } from "./FastingZone";

export function FastingTracker() {
  const { selectedAccount } = useAuthorization();
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pickerDate, setPickerDate] = useState<Date>(() => subDays(new Date(), 1));
  const [pickerTime, setPickerTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Storage key based on wallet public key
  const storageKey = selectedAccount
    ? `fasting_${selectedAccount.publicKey.toBase58()}`
    : null;

  // Load saved fasting session
  useEffect(() => {
    if (!storageKey) return;
    AsyncStorage.getItem(storageKey).then((saved) => {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.startTime) {
          setStartTime(new Date(parsed.startTime));
        }
      }
    });
  }, [storageKey]);

  // Save fasting session whenever startTime changes
  useEffect(() => {
    if (!storageKey) return;
    if (startTime) {
      AsyncStorage.setItem(
        storageKey,
        JSON.stringify({ startTime: startTime.toISOString() }),
      );
    } else {
      AsyncStorage.removeItem(storageKey);
    }
  }, [startTime, storageKey]);

  // Tick every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStartFasting = () => {
    if (!pickerTime) return;
    const fastStart = new Date(pickerDate);
    fastStart.setHours(
      pickerTime.getHours(),
      pickerTime.getMinutes(),
      0,
      0,
    );
    setStartTime(fastStart);
  };

  const handleReset = () => {
    setStartTime(null);
    setPickerTime(null);
    setPickerDate(subDays(new Date(), 1));
  };

  const formatDateTime = (date: Date) => {
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    if (isToday(date)) return `Today, ${timeStr}`;
    if (isYesterday(date)) return `Yesterday, ${timeStr}`;
    return `${format(date, "MMM d")}, ${timeStr}`;
  };

  const getElapsedTime = () => {
    if (!startTime) return null;
    const duration = intervalToDuration({ start: startTime, end: currentTime });
    const hours = (duration.days || 0) * 24 + (duration.hours || 0);
    const minutes = duration.minutes || 0;
    return { hours, minutes };
  };

  const elapsedTime = getElapsedTime();

  const onDateChange = useCallback(
    (_: DateTimePickerEvent, date?: Date) => {
      setShowDatePicker(false);
      if (date) setPickerDate(date);
    },
    [],
  );

  const onTimeChange = useCallback(
    (_: DateTimePickerEvent, date?: Date) => {
      setShowTimePicker(false);
      if (date) setPickerTime(date);
    },
    [],
  );

  const formatPickerDate = () => {
    if (isToday(pickerDate)) return "Today";
    if (isYesterday(pickerDate)) return "Yesterday";
    return format(pickerDate, "PPP");
  };

  const formatPickerTime = () => {
    if (!pickerTime) return "Select time";
    return pickerTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="pb-12"
      showsVerticalScrollIndicator={false}
    >
      <View className="bg-white/95 rounded-3xl p-6 border border-primary/[0.08]">
        {!startTime ? (
          <View className="gap-8">
            {/* Input state */}
            <View className="items-center gap-6">
              <View className="w-16 h-16 bg-secondary rounded-2xl items-center justify-center">
                <Clock size={32} color="#340247" />
              </View>
              <View className="items-center gap-3">
                <Text className="text-primary text-2xl text-center tracking-tight font-semibold">
                  When did you start fasting?
                </Text>
                <Text className="text-muted-fg text-base text-center">
                  Select the date and time you had your last meal
                </Text>
              </View>
            </View>

            <View className="gap-4">
              {/* Date picker button */}
              <View>
                <Text className="text-muted-fg text-xs uppercase tracking-widest mb-2">
                  Start Date
                </Text>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  className="flex-row items-center bg-secondary px-4 py-4 rounded-2xl border border-primary/10"
                >
                  <CalendarIcon size={16} color="#340247" opacity={0.5} />
                  <Text className="text-primary ml-2 text-base">
                    {formatPickerDate()}
                  </Text>
                </Pressable>
              </View>

              {/* Time picker button */}
              <View>
                <Text className="text-muted-fg text-xs uppercase tracking-widest mb-2">
                  Start Time
                </Text>
                <Pressable
                  onPress={() => setShowTimePicker(true)}
                  className="flex-row items-center bg-secondary px-4 py-4 rounded-2xl border border-primary/10"
                >
                  <Clock size={16} color="#340247" opacity={0.5} />
                  <Text
                    className={`ml-2 text-base ${
                      pickerTime ? "text-primary" : "text-muted-fg"
                    }`}
                  >
                    {formatPickerTime()}
                  </Text>
                </Pressable>
              </View>

              {/* Native date picker */}
              {showDatePicker && (
                <DateTimePicker
                  value={pickerDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}

              {/* Native time picker */}
              {showTimePicker && (
                <DateTimePicker
                  value={pickerTime || new Date()}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onTimeChange}
                />
              )}

              {/* Submit */}
              <Pressable
                onPress={handleStartFasting}
                disabled={!pickerTime}
                className={`py-4 rounded-2xl items-center mt-2 ${
                  pickerTime
                    ? "bg-primary active:bg-primary-hover"
                    : "bg-muted"
                }`}
              >
                <Text
                  className={`font-medium text-base ${
                    pickerTime ? "text-white" : "text-muted-fg"
                  }`}
                >
                  View Insights
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View className="gap-6">
            {/* Active fasting state */}
            <View className="items-center pb-6 border-b border-primary/[0.08]">
              <View className="flex-row items-center gap-8 mb-6">
                <View className="items-center flex-1">
                  <Text className="text-muted-fg text-xs uppercase tracking-widest mb-1">
                    Fasting Since
                  </Text>
                  <Text className="text-primary text-lg font-medium">
                    {formatDateTime(startTime)}
                  </Text>
                </View>

                <View className="w-px h-12 bg-primary/10" />

                <View className="items-center flex-1">
                  <Text className="text-muted-fg text-xs uppercase tracking-widest mb-1">
                    Time Elapsed
                  </Text>
                  <Text className="text-primary text-lg font-medium">
                    {elapsedTime?.hours}h {elapsedTime?.minutes}m
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={handleReset}
                className="border border-primary/[0.15] px-4 py-2 rounded-xl active:bg-secondary"
              >
                <Text className="text-primary text-sm">Reset Timer</Text>
              </Pressable>
            </View>

            {/* Fasting zones */}
            <View className="gap-4">
              {FASTING_ZONES.map((zone) => (
                <FastingZone
                  key={zone.hours}
                  zone={zone}
                  startTime={startTime}
                  currentTime={currentTime}
                />
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
