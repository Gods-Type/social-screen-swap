import { Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { Participant } from "@/drizzle/schema";

const SOCIAL_PLATFORMS = [
  { id: "tiktok", name: "TikTok", color: "#000000" },
  { id: "douyin", name: "Douyin", color: "#000000" },
  { id: "rednote", name: "RedNote", color: "#FF2442" },
  { id: "youtube", name: "YouTube", color: "#FF0000" },
  { id: "instagram", name: "Instagram", color: "#E4405F" },
  { id: "pinterest", name: "Pinterest", color: "#E60023" },
  { id: "twitter", name: "Twitter/X", color: "#1DA1F2" },
  { id: "facebook", name: "Facebook", color: "#1877F2" },
];

export default function SessionScreen() {
  const params = useLocalSearchParams<{
    roomId: string;
    participantId: string;
    code: string;
  }>();

  const roomId = parseInt(params.roomId);
  const participantId = parseInt(params.participantId);

  const [currentViewingId, setCurrentViewingId] = useState<number | null>(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("none");

  const { data: roomData, refetch } = trpc.rooms.get.useQuery(
    { roomId },
    { refetchInterval: 2000 }
  );

  const { data: swapHistory } = trpc.swaps.history.useQuery(
    { roomId, limit: 10 },
    { refetchInterval: 3000 }
  );

  const setPlatformMutation = trpc.participants.setPlatform.useMutation();
  const recordSwapMutation = trpc.swaps.record.useMutation();
  const leaveRoomMutation = trpc.rooms.leave.useMutation();

  // Initialize viewing to first other participant
  useEffect(() => {
    if (roomData && currentViewingId === null) {
      const otherParticipant = roomData.participants.find(
        (p: Participant) => p.id !== participantId
      );
      if (otherParticipant) {
        setCurrentViewingId(otherParticipant.id);
      }
    }
  }, [roomData, currentViewingId, participantId]);

  const handleSelectPlatform = async (platformId: string) => {
    setSelectedPlatform(platformId);
    setShowPlatformModal(false);
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await setPlatformMutation.mutateAsync({
        participantId,
        platform: platformId,
      });
      refetch();
    } catch (error) {
      Alert.alert("Error", "Failed to update platform");
    }
  };

  const handleSwapToParticipant = async (targetParticipantId: number) => {
    if (targetParticipantId === participantId) {
      Alert.alert("Cannot Swap", "You cannot view your own screen");
      return;
    }

    const previousViewingId = currentViewingId;
    setCurrentViewingId(targetParticipantId);
    setShowSwapModal(false);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      if (previousViewingId) {
        await recordSwapMutation.mutateAsync({
          roomId,
          fromParticipantId: previousViewingId,
          toParticipantId: targetParticipantId,
          swapType: "manual",
        });
      }
      
      refetch();
    } catch (error) {
      console.error("Failed to record swap:", error);
    }
  };

  const handleRandomSwap = async () => {
    const availableParticipants = roomData?.participants.filter(
      (p: Participant) => p.id !== participantId && p.id !== currentViewingId
    ) || [];

    if (availableParticipants.length === 0) {
      Alert.alert("No Swap Available", "No other participants to swap to");
      return;
    }

    const randomParticipant = availableParticipants[
      Math.floor(Math.random() * availableParticipants.length)
    ];

    const previousViewingId = currentViewingId;
    setCurrentViewingId(randomParticipant.id);
    setShowSwapModal(false);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      if (previousViewingId) {
        await recordSwapMutation.mutateAsync({
          roomId,
          fromParticipantId: previousViewingId,
          toParticipantId: randomParticipant.id,
          swapType: "random",
        });
      }
      
      refetch();
    } catch (error) {
      console.error("Failed to record swap:", error);
    }
  };

  const handleLeaveSession = async () => {
    Alert.alert(
      "Leave Session",
      "Are you sure you want to leave this session?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              await leaveRoomMutation.mutateAsync({ participantId });
              await AsyncStorage.removeItem("currentRoomId");
              await AsyncStorage.removeItem("currentParticipantId");
              await AsyncStorage.removeItem("roomCode");
              router.replace("/");
            } catch (error) {
              Alert.alert("Error", "Failed to leave session");
            }
          },
        },
      ]
    );
  };

  const currentlyViewing = roomData?.participants.find(
    (p: Participant) => p.id === currentViewingId
  );

  const currentUser = roomData?.participants.find(
    (p: Participant) => p.id === participantId
  );

  if (!roomData || !currentlyViewing) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B6B" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <View className="flex-1 gap-4">
        {/* Header */}
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-sm text-muted">Room: {params.code}</Text>
            <Text className="text-lg font-bold text-foreground">
              Viewing: {currentlyViewing.guestName || "Guest"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLeaveSession}
            activeOpacity={0.7}
            className="bg-error px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-semibold">Leave</Text>
          </TouchableOpacity>
        </View>

        {/* Screen Preview Area */}
        <View className="flex-1 bg-surface rounded-2xl p-6 items-center justify-center">
          <View className="items-center gap-4">
            <View className="w-24 h-24 rounded-full bg-primary items-center justify-center">
              <Text className="text-white font-bold text-4xl">
                {(currentlyViewing.guestName || "?").charAt(0).toUpperCase()}
              </Text>
            </View>
            
            <View className="items-center gap-2">
              <Text className="text-2xl font-bold text-foreground">
                {currentlyViewing.guestName || "Guest"}
              </Text>
              
              {currentlyViewing.currentPlatform && currentlyViewing.currentPlatform !== "none" ? (
                <View className="bg-secondary px-4 py-2 rounded-full">
                  <Text className="text-white font-semibold">
                    Currently on: {SOCIAL_PLATFORMS.find(p => p.id === currentlyViewing.currentPlatform)?.name || currentlyViewing.currentPlatform}
                  </Text>
                </View>
              ) : (
                <Text className="text-muted">No platform selected</Text>
              )}
            </View>

            <Text className="text-center text-muted px-8 mt-4">
              In a real implementation, you would see {currentlyViewing.guestName}'s screen here. 
              Tap the Swap button below to switch to another participant.
            </Text>
          </View>
        </View>

        {/* Your Platform Selector */}
        <TouchableOpacity
          onPress={() => setShowPlatformModal(true)}
          activeOpacity={0.7}
          className="bg-surface border border-border rounded-xl p-4"
        >
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-sm text-muted">Your Platform</Text>
              <Text className="text-lg font-semibold text-foreground">
                {selectedPlatform === "none" 
                  ? "Select a platform" 
                  : SOCIAL_PLATFORMS.find(p => p.id === selectedPlatform)?.name || "Unknown"}
              </Text>
            </View>
            <Text className="text-2xl">📱</Text>
          </View>
        </TouchableOpacity>

        {/* Participant Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-h-20">
          <View className="flex-row gap-3">
            {roomData.participants.map((participant: Participant) => (
              <TouchableOpacity
                key={participant.id}
                onPress={() => handleSwapToParticipant(participant.id)}
                activeOpacity={0.7}
                className={`items-center gap-1 ${
                  participant.id === currentViewingId ? "opacity-100" : "opacity-50"
                }`}
              >
                <View
                  className={`w-14 h-14 rounded-full items-center justify-center ${
                    participant.id === currentViewingId ? "bg-primary" : "bg-surface"
                  } ${participant.id === participantId ? "border-2 border-secondary" : ""}`}
                >
                  <Text className={`font-bold text-lg ${
                    participant.id === currentViewingId ? "text-white" : "text-foreground"
                  }`}>
                    {(participant.guestName || "?").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text className="text-xs text-muted max-w-[60px] text-center" numberOfLines={1}>
                  {participant.id === participantId ? "You" : participant.guestName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Swap Button */}
        <TouchableOpacity
          onPress={() => setShowSwapModal(true)}
          activeOpacity={0.8}
          className="bg-primary px-8 py-4 rounded-2xl"
        >
          <Text className="text-white text-lg font-bold text-center">🔄 SWAP</Text>
        </TouchableOpacity>

        {/* Swap Modal */}
        <Modal
          visible={showSwapModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSwapModal(false)}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-background rounded-t-3xl p-6 gap-4">
              <Text className="text-2xl font-bold text-foreground">Swap Screen</Text>

              <TouchableOpacity
                onPress={handleRandomSwap}
                activeOpacity={0.8}
                className="bg-secondary px-6 py-4 rounded-xl"
              >
                <Text className="text-white text-lg font-semibold text-center">
                  🎲 Random Swap
                </Text>
              </TouchableOpacity>

              <View className="gap-2">
                <Text className="text-sm text-muted font-semibold">Choose Participant</Text>
                {roomData.participants
                  .filter((p: Participant) => p.id !== participantId)
                  .map((participant: Participant) => (
                    <TouchableOpacity
                      key={participant.id}
                      onPress={() => handleSwapToParticipant(participant.id)}
                      activeOpacity={0.7}
                      className={`bg-surface p-4 rounded-xl ${
                        participant.id === currentViewingId ? "border-2 border-primary" : ""
                      }`}
                    >
                      <Text className="text-foreground font-semibold">
                        {participant.guestName || "Guest"}
                        {participant.id === currentViewingId && " (Current)"}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>

              <TouchableOpacity
                onPress={() => setShowSwapModal(false)}
                activeOpacity={0.7}
                className="bg-surface border border-border px-6 py-3 rounded-xl mt-2"
              >
                <Text className="text-foreground font-semibold text-center">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Platform Selector Modal */}
        <Modal
          visible={showPlatformModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPlatformModal(false)}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-background rounded-t-3xl p-6 gap-4">
              <Text className="text-2xl font-bold text-foreground">Select Platform</Text>

              <ScrollView className="max-h-96">
                <View className="gap-2">
                  {SOCIAL_PLATFORMS.map((platform) => (
                    <TouchableOpacity
                      key={platform.id}
                      onPress={() => handleSelectPlatform(platform.id)}
                      activeOpacity={0.7}
                      className={`bg-surface p-4 rounded-xl ${
                        selectedPlatform === platform.id ? "border-2 border-primary" : ""
                      }`}
                    >
                      <Text className="text-foreground font-semibold">
                        {platform.name}
                        {selectedPlatform === platform.id && " ✓"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                onPress={() => setShowPlatformModal(false)}
                activeOpacity={0.7}
                className="bg-surface border border-border px-6 py-3 rounded-xl"
              >
                <Text className="text-foreground font-semibold text-center">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenContainer>
  );
}
