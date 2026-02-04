import { View, Text, TouchableOpacity, ScrollView, FlatList } from "react-native";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { ReplayTimeline } from "./replay-timeline";

interface ReplayEvent {
  id: number;
  participantName: string;
  eventType: string;
  timestamp: Date;
  eventData?: string;
  targetParticipantName?: string;
}

interface ReplayPlayerProps {
  events: ReplayEvent[];
  sessionDuration: number; // in seconds
  onClose: () => void;
}

const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2];

export function ReplayPlayer({
  events,
  sessionDuration,
  onClose,
}: ReplayPlayerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [displayedEvents, setDisplayedEvents] = useState<ReplayEvent[]>([]);

  // Simulate playback
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + (0.1 * playbackSpeed);
        if (next >= sessionDuration) {
          setIsPlaying(false);
          return sessionDuration;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, sessionDuration]);

  // Update displayed events based on current time
  useEffect(() => {
    const currentTimeMs = currentTime * 1000;
    const firstEventTime = events[0]?.timestamp.getTime() || 0;
    
    const shown = events.filter((event) => {
      const eventTimeMs = event.timestamp.getTime();
      return eventTimeMs - firstEventTime <= currentTimeMs;
    });
    
    setDisplayedEvents(shown);
  }, [currentTime, events]);

  const handlePlayPause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (timeInSeconds: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentTime(timeInSeconds);
    setIsPlaying(false);
  };

  const handleSpeedChange = () => {
    const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    const nextSpeed = PLAYBACK_SPEEDS[(currentIndex + 1) % PLAYBACK_SPEEDS.length];
    setPlaybackSpeed(nextSpeed);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getEventSummary = (event: ReplayEvent) => {
    switch (event.eventType) {
      case "swap":
        return `${event.participantName} swapped to ${event.targetParticipantName}'s screen`;
      case "message":
        return `${event.participantName} sent a message`;
      case "platform_change":
        return `${event.participantName} changed platform to ${event.eventData}`;
      case "video_toggle":
        return `${event.participantName} toggled video`;
      case "tap":
        return `${event.participantName} tapped on screen`;
      case "swipe":
        return `${event.participantName} swiped`;
      default:
        return `${event.participantName} performed an action`;
    }
  };

  return (
    <View className="flex-1 bg-background rounded-t-3xl gap-4 p-4">
      {/* Header */}
      <View className="flex-row justify-between items-center">
        <Text className="text-2xl font-bold text-foreground">Session Replay</Text>
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.7}
          className="bg-surface rounded-full p-2"
        >
          <Text className="text-lg">✕</Text>
        </TouchableOpacity>
      </View>

      {/* Preview Area */}
      <View className="bg-surface rounded-2xl p-6 items-center justify-center gap-4">
        <View className="w-20 h-20 rounded-full bg-primary items-center justify-center">
          <Text className="text-4xl">🎬</Text>
        </View>
        <View className="items-center gap-2">
          <Text className="text-lg font-bold text-foreground">
            {formatTime(currentTime)} / {formatTime(sessionDuration)}
          </Text>
          <Text className="text-sm text-muted">
            {displayedEvents.length} events recorded
          </Text>
        </View>
      </View>

      {/* Playback Controls */}
      <View className="flex-row gap-3 justify-center items-center">
        <TouchableOpacity
          onPress={handleReset}
          activeOpacity={0.7}
          className="bg-surface rounded-full p-3"
        >
          <Text className="text-xl">⏮️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePlayPause}
          activeOpacity={0.8}
          className="bg-primary rounded-full p-4"
        >
          <Text className="text-2xl">{isPlaying ? "⏸️" : "▶️"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSpeedChange}
          activeOpacity={0.7}
          className="bg-surface rounded-full px-4 py-3"
        >
          <Text className="text-sm font-bold text-foreground">{playbackSpeed}x</Text>
        </TouchableOpacity>
      </View>

      {/* Timeline */}
      <ReplayTimeline
        events={events}
        totalDuration={sessionDuration}
        currentTime={currentTime}
        onSeek={handleSeek}
        isPlaying={isPlaying}
      />

      {/* Event Log */}
      <View className="flex-1 gap-2">
        <Text className="text-sm font-semibold text-muted">Recent Activity</Text>
        <FlatList
          data={displayedEvents.slice(-5)}
          renderItem={({ item }) => (
            <View className="bg-surface rounded-lg p-3 mb-2 border border-border">
              <Text className="text-sm font-semibold text-foreground">
                {getEventSummary(item)}
              </Text>
              <Text className="text-xs text-muted mt-1">
                {formatTime(item.timestamp.getSeconds())}
              </Text>
            </View>
          )}
          keyExtractor={(item) => `${item.id}`}
          scrollEnabled
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}
