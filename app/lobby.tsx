import { Text, View, TouchableOpacity, ScrollView, Share, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { Participant } from "@/drizzle/schema";

export default function LobbyScreen() {
  const params = useLocalSearchParams<{
    roomId: string;
    participantId: string;
    code: string;
    isHost: string;
  }>();

  const roomId = parseInt(params.roomId);
  const participantId = parseInt(params.participantId);
  const code = params.code;
  const isHost = params.isHost === "true";

  const [isReady, setIsReady] = useState(false);

  const { data: roomData, refetch } = trpc.rooms.get.useQuery(
    { roomId },
    { refetchInterval: 2000 } // Poll every 2 seconds
  );

  const setReadyMutation = trpc.participants.setReady.useMutation();
  const leaveRoomMutation = trpc.rooms.leave.useMutation();
  const endRoomMutation = trpc.rooms.end.useMutation();

  const handleToggleReady = async () => {
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await setReadyMutation.mutateAsync({
        participantId,
        isReady: newReadyState,
      });
      refetch();
    } catch (error) {
      setIsReady(!newReadyState); // Revert on error
      Alert.alert("Error", "Failed to update ready status");
    }
  };

  const handleShareCode = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: `Join my Screen Swap room!\n\nRoom Code: ${code}\n\nEnter this code in the Screen Swap app to join.`,
        title: "Join Screen Swap Room",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoomMutation.mutateAsync({ participantId });
      await AsyncStorage.removeItem("currentRoomId");
      await AsyncStorage.removeItem("currentParticipantId");
      await AsyncStorage.removeItem("roomCode");
      router.replace("/");
    } catch (error) {
      Alert.alert("Error", "Failed to leave room");
    }
  };

  const handleStartSession = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({
      pathname: "/session" as any,
      params: {
        roomId,
        participantId,
        code,
      },
    });
  };

  const handleEndRoom = async () => {
    Alert.alert(
      "End Room",
      "Are you sure you want to end this room? All participants will be disconnected.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Room",
          style: "destructive",
          onPress: async () => {
            try {
              await endRoomMutation.mutateAsync({ roomId });
              await AsyncStorage.removeItem("currentRoomId");
              await AsyncStorage.removeItem("currentParticipantId");
              await AsyncStorage.removeItem("roomCode");
              router.replace("/");
            } catch (error) {
              Alert.alert("Error", "Failed to end room");
            }
          },
        },
      ]
    );
  };

  const allReady = roomData?.participants.every((p: Participant) => p.isReady) || false;
  const participantCount = roomData?.participants.length || 0;

  if (!roomData) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B6B" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-3xl font-bold text-foreground">{roomData.room.name}</Text>
            <View className="bg-surface px-6 py-3 rounded-full">
              <Text className="text-2xl font-mono font-bold text-primary tracking-widest">
                {code}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleShareCode}
              activeOpacity={0.7}
              className="mt-2"
            >
              <Text className="text-secondary font-semibold">Share Code</Text>
            </TouchableOpacity>
          </View>

          {/* Participants */}
          <View className="bg-surface rounded-2xl p-4 gap-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-bold text-foreground">Participants</Text>
              <Text className="text-sm text-muted">
                {participantCount}/{roomData.room.maxParticipants}
              </Text>
            </View>

            {roomData.participants.map((participant: Participant) => (
              <View
                key={participant.id}
                className="flex-row items-center justify-between bg-background rounded-xl p-3"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-full bg-primary items-center justify-center">
                    <Text className="text-white font-bold text-lg">
                      {(participant.guestName || "?").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-foreground font-semibold">
                      {participant.guestName || "Guest"}
                      {participant.isHost && " (Host)"}
                    </Text>
                  </View>
                </View>

                {participant.isReady ? (
                  <View className="bg-success px-3 py-1 rounded-full">
                    <Text className="text-white text-xs font-semibold">Ready</Text>
                  </View>
                ) : (
                  <View className="bg-muted px-3 py-1 rounded-full">
                    <Text className="text-white text-xs font-semibold">Not Ready</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Ready Button */}
          <TouchableOpacity
            onPress={handleToggleReady}
            activeOpacity={0.8}
            className={`px-8 py-4 rounded-2xl ${
              isReady ? "bg-success" : "bg-surface border border-border"
            }`}
          >
            <Text
              className={`text-lg font-semibold text-center ${
                isReady ? "text-white" : "text-foreground"
              }`}
            >
              {isReady ? "Ready ✓" : "Mark as Ready"}
            </Text>
          </TouchableOpacity>

          {/* Start Session (Host Only) */}
          {isHost && (
            <TouchableOpacity
              onPress={handleStartSession}
              disabled={!allReady || participantCount < 2}
              activeOpacity={0.8}
              className={`px-8 py-4 rounded-2xl ${
                allReady && participantCount >= 2
                  ? "bg-primary"
                  : "bg-muted opacity-50"
              }`}
            >
              <Text className="text-white text-lg font-bold text-center">
                {allReady && participantCount >= 2
                  ? "Start Session"
                  : participantCount < 2
                  ? "Waiting for participants..."
                  : "Waiting for all to be ready..."}
              </Text>
            </TouchableOpacity>
          )}

          {/* Action Buttons */}
          <View className="gap-3 mt-auto">
            {isHost && (
              <TouchableOpacity
                onPress={handleEndRoom}
                activeOpacity={0.7}
                className="bg-error px-8 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold text-center">End Room</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleLeaveRoom}
              activeOpacity={0.7}
              className="bg-surface border border-border px-8 py-3 rounded-xl"
            >
              <Text className="text-foreground font-semibold text-center">Leave Room</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
