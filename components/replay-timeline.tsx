import { View, Text, ScrollView, TouchableOpacity, FlatList } from "react-native";
import { useState } from "react";

interface TimelineEvent {
  id: number;
  participantName: string;
  eventType: string;
  timestamp: Date;
  eventData?: string;
  targetParticipantName?: string;
}

interface ReplayTimelineProps {
  events: TimelineEvent[];
  totalDuration: number; // in seconds
  currentTime: number; // in seconds
  onSeek: (timeInSeconds: number) => void;
  isPlaying: boolean;
}

const EVENT_ICONS: Record<string, string> = {
  tap: "👆",
  swipe: "👈",
  message: "💬",
  platform_change: "📱",
  video_toggle: "📹",
  swap: "🔄",
};

const EVENT_COLORS: Record<string, string> = {
  tap: "#FF6B6B",
  swipe: "#4ECDC4",
  message: "#45B7D1",
  platform_change: "#FFA07A",
  video_toggle: "#98D8C8",
  swap: "#F7DC6F",
};

export function ReplayTimeline({
  events,
  totalDuration,
  currentTime,
  onSeek,
  isPlaying,
}: ReplayTimelineProps) {
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getEventPosition = (eventTime: Date) => {
    const eventSeconds = Math.floor(
      (eventTime.getTime() - events[0]?.timestamp.getTime()) / 1000
    );
    return (eventSeconds / totalDuration) * 100;
  };

  const handleTimelinePress = (e: any) => {
    const { width, x } = e.nativeEvent.layout;
    const pressX = e.nativeEvent.pageX - x;
    const percentage = pressX / width;
    const newTime = percentage * totalDuration;
    onSeek(Math.max(0, Math.min(newTime, totalDuration)));
  };

  const renderEventItem = ({ item }: { item: TimelineEvent }) => (
    <TouchableOpacity
      onPress={() =>
        setExpandedEventId(expandedEventId === item.id ? null : item.id)
      }
      activeOpacity={0.7}
      className="mb-2"
    >
      <View
        className="bg-surface rounded-xl p-3 border border-border"
        style={{
          borderLeftColor: EVENT_COLORS[item.eventType],
          borderLeftWidth: 4,
        }}
      >
        <View className="flex-row items-center gap-3">
          <Text className="text-2xl">{EVENT_ICONS[item.eventType] || "📌"}</Text>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">
              {item.participantName}
            </Text>
            <Text className="text-xs text-muted capitalize">
              {item.eventType.replace("_", " ")}
              {item.targetParticipantName && ` → ${item.targetParticipantName}`}
            </Text>
          </View>
          <Text className="text-xs text-muted">{formatTime(item.timestamp.getSeconds())}</Text>
        </View>

        {expandedEventId === item.id && item.eventData && (
          <View className="mt-3 pt-3 border-t border-border">
            <Text className="text-xs text-muted">{item.eventData}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="gap-4">
      {/* Timeline Bar */}
      <View className="gap-2">
        <View className="flex-row justify-between items-center px-2">
          <Text className="text-xs font-semibold text-muted">
            {formatTime(currentTime)}
          </Text>
          <Text className="text-xs font-semibold text-muted">
            {formatTime(totalDuration)}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleTimelinePress}
          activeOpacity={0.8}
          className="bg-surface rounded-full h-8 items-center justify-center relative"
        >
          {/* Background track */}
          <View className="absolute w-full h-1 bg-border rounded-full" />

          {/* Progress track */}
          <View
            className="absolute h-1 bg-primary rounded-full"
            style={{ width: `${(currentTime / totalDuration) * 100}%` }}
          />

          {/* Playhead */}
          <View
            className="absolute w-5 h-5 bg-primary rounded-full border-2 border-white"
            style={{
              left: `${(currentTime / totalDuration) * 100}%`,
              marginLeft: -10,
            }}
          />
        </TouchableOpacity>
      </View>

      {/* Event Markers */}
      <View className="gap-1">
        <Text className="text-xs font-semibold text-muted px-2">Events</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row gap-2 px-2"
        >
          {events.map((event) => (
            <TouchableOpacity
              key={event.id}
              onPress={() => onSeek(event.timestamp.getSeconds())}
              activeOpacity={0.7}
              className="items-center gap-1"
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center border-2"
                style={{
                  backgroundColor: EVENT_COLORS[event.eventType],
                  borderColor: EVENT_COLORS[event.eventType],
                  opacity:
                    currentTime >= event.timestamp.getSeconds() - 1 &&
                    currentTime <= event.timestamp.getSeconds() + 1
                      ? 1
                      : 0.6,
                }}
              >
                <Text className="text-lg">
                  {EVENT_ICONS[event.eventType] || "📌"}
                </Text>
              </View>
              <Text className="text-xs text-muted max-w-[40px] text-center">
                {formatTime(event.timestamp.getSeconds())}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Event List */}
      <View className="max-h-48">
        <Text className="text-xs font-semibold text-muted px-2 mb-2">
          Activity Log
        </Text>
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={(item) => `${item.id}`}
          scrollEnabled
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 8 }}
        />
      </View>
    </View>
  );
}
