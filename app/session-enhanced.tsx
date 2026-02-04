import { Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, Dimensions } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenContainer } from "@/components/screen-container";
import { VideoGrid } from "@/components/video-grid";
import { ChatPanel } from "@/components/chat-panel";
import { useVideo } from "@/lib/video-context";
import { useMessaging } from "@/lib/messaging-context";
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

export default function SessionEnhancedScreen() {
  const params = useLocalSearchParams<{
    roomId: string;
    participantId: string;
    code: string;
  }>();

  const roomId = parseInt(params.roomId);
  const participantId = parseInt(params.participantId);
  const [guestName, setGuestName] = useState<string>("");

  useEffect(() => {
    AsyncStorage.getItem("guestName").then((name) => {
      if (name) setGuestName(name);
    });
  }, []);

  const [currentViewingId, setCurrentViewingId] = useState<number | null>(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showSessionHistory, setShowSessionHistory] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("none");
  const [sessionStartTime] = useState(Date.now());
  const [unreadMessages, setUnreadMessages] = useState(0);

  const { setLocalParticipant, setRemoteParticipants, toggleLocalVideo } = useVideo();
  const { messages, addMessage, setMessages } = useMessaging();

  const { data: roomData, refetch } = trpc.rooms.get.useQuery(
    { roomId },
    { refetchInterval: 2000 }
  );

  const { data: swapHistory } = trpc.swaps.history.useQuery(
    { roomId, limit: 10 },
    { refetchInterval: 3000 }
  );

  const { data: chatMessages } = trpc.messages.list.useQuery(
    { roomId, limit: 50 },
    { refetchInterval: 1000 }
  );

  // Track unread messages
  useEffect(() => {
    if (!showChatPanel && chatMessages && messages.length < chatMessages.length) {
      setUnreadMessages((prev) => prev + 1);
    }
  }, [chatMessages, messages.length, showChatPanel]);

  const setPlatformMutation = trpc.participants.setPlatform.useMutation();
  const recordSwapMutation = trpc.swaps.record.useMutation();
  const sendMessageMutation = trpc.messages.send.useMutation();
  const createSessionHistoryMutation = trpc.sessionHistory.create.useMutation();
  const leaveRoomMutation = trpc.rooms.leave.useMutation();

  // Initialize video and messaging
  useEffect(() => {
    if (roomData && guestName) {
      const currentUser = roomData.participants.find(
        (p: Participant) => p.id === participantId
      );

      if (currentUser) {
        setLocalParticipant({
          id: participantId,
          name: guestName,
          isVideoOn: true,
          avatarColor: "#FF6B6B",
        });

        const remotes = roomData.participants
          .filter((p: Participant) => p.id !== participantId)
          .map((p: Participant) => ({
            id: p.id,
            name: p.guestName || "Guest",
            isVideoOn: true,
            avatarColor: "#4ECDC4",
          }));

        setRemoteParticipants(remotes);
      }
    }
  }, [roomData, participantId, guestName, setLocalParticipant, setRemoteParticipants]);

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

  // Update messages
  useEffect(() => {
    if (chatMessages) {
      const formattedMessages = chatMessages.map((msg: any) => ({
        id: msg.id,
        senderName: msg.senderName,
        content: msg.content,
        createdAt: new Date(msg.createdAt),
        isOwn: msg.participantId === participantId,
      }));
      setMessages(formattedMessages);
    }
  }, [chatMessages, participantId, setMessages]);

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

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessageMutation.mutateAsync({
        roomId,
        participantId,
        senderName: guestName,
        content,
      });
      refetch();
    } catch (error) {
      Alert.alert("Error", "Failed to send message");
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
              const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
              const platformsUsed = JSON.stringify(
                [...new Set(roomData?.participants.map((p: Participant) => p.currentPlatform).filter(Boolean))]
              );

              await createSessionHistoryMutation.mutateAsync({
                roomId,
                hostName: guestName,
                participantCount: roomData?.participants.length || 1,
                totalSwaps: swapHistory?.length || 0,
                totalMessages: messages.length,
                sessionDuration,
                platformsUsed,
              });

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

  if (!roomData || !currentlyViewing) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B6B" />
      </ScreenContainer>
    );
  }

  const screenHeight = Dimensions.get("window").height;

  return (
    <ScreenContainer className="p-0">
      <View className="flex-1 gap-0">
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-3 bg-surface border-b border-border">
          <View>
            <Text className="text-sm text-muted">Room: {params.code}</Text>
            <Text className="text-base font-bold text-foreground">
              Viewing: {currentlyViewing.guestName || "Guest"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLeaveSession}
            activeOpacity={0.7}
            className="bg-error px-3 py-2 rounded-lg"
          >
            <Text className="text-white font-semibold text-sm">Leave</Text>
          </TouchableOpacity>
        </View>

        {/* Video Grid */}
        <View className="flex-1">
          <VideoGrid onToggleVideo={toggleLocalVideo} />
        </View>

        {/* Control Panel */}
        <View className="bg-surface border-t border-border p-4 gap-3">
          {/* Platform and Chat Row */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setShowPlatformModal(true)}
              activeOpacity={0.7}
              className="flex-1 bg-background border border-border rounded-xl p-3"
            >
              <Text className="text-xs text-muted">Platform</Text>
              <Text className="text-sm font-semibold text-foreground">
                {selectedPlatform === "none" 
                  ? "Select" 
                  : SOCIAL_PLATFORMS.find(p => p.id === selectedPlatform)?.name || "Unknown"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowChatPanel(true);
                setUnreadMessages(0);
              }}
              activeOpacity={0.7}
              className="flex-1 bg-background border border-border rounded-xl p-3 relative"
            >
              <Text className="text-xs text-muted">Messages</Text>
              <Text className="text-sm font-semibold text-foreground">
                {messages.length} {unreadMessages > 0 && `(+${unreadMessages})`}
              </Text>
              {unreadMessages > 0 && (
                <View className="absolute top-2 right-2 bg-error rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-white text-xs font-bold">{unreadMessages}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowSessionHistory(true)}
              activeOpacity={0.7}
              className="flex-1 bg-background border border-border rounded-xl p-3"
            >
              <Text className="text-xs text-muted">History</Text>
              <Text className="text-sm font-semibold text-foreground">
                {swapHistory?.length || 0} swaps
              </Text>
            </TouchableOpacity>
          </View>

          {/* Swap Button */}
          <TouchableOpacity
            onPress={() => setShowSwapModal(true)}
            activeOpacity={0.8}
            className="bg-primary px-8 py-4 rounded-2xl"
          >
            <Text className="text-white text-lg font-bold text-center">🔄 SWAP</Text>
          </TouchableOpacity>
        </View>

        {/* Swap Modal */}
        <Modal
          visible={showSwapModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSwapModal(false)}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-background rounded-t-3xl p-6 gap-4 max-h-96">
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

              <ScrollView className="max-h-48">
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
              </ScrollView>

              <TouchableOpacity
                onPress={() => setShowSwapModal(false)}
                activeOpacity={0.7}
                className="bg-surface border border-border px-6 py-3 rounded-xl"
              >
                <Text className="text-foreground font-semibold text-center">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Chat Modal */}
        <Modal
          visible={showChatPanel}
          transparent
          animationType="slide"
          onRequestClose={() => setShowChatPanel(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-background rounded-t-3xl" style={{ height: screenHeight * 0.7 }}>
              <ChatPanel onSendMessage={handleSendMessage} />
              <TouchableOpacity
                onPress={() => setShowChatPanel(false)}
                activeOpacity={0.7}
                className="bg-surface border-t border-border px-6 py-3 rounded-t-xl"
              >
                <Text className="text-foreground font-semibold text-center">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Session History Modal */}
        <Modal
          visible={showSessionHistory}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSessionHistory(false)}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-background rounded-t-3xl p-6 gap-4 max-h-96">
              <Text className="text-2xl font-bold text-foreground">Session History</Text>

              <ScrollView className="max-h-64">
                <View className="gap-4">
                  <View className="bg-surface p-4 rounded-xl">
                    <Text className="text-sm text-muted">Total Swaps</Text>
                    <Text className="text-2xl font-bold text-primary">{swapHistory?.length || 0}</Text>
                  </View>

                  <View className="bg-surface p-4 rounded-xl">
                    <Text className="text-sm text-muted">Total Messages</Text>
                    <Text className="text-2xl font-bold text-secondary">{messages.length}</Text>
                  </View>

                  <View className="bg-surface p-4 rounded-xl">
                    <Text className="text-sm text-muted mb-2">Participants</Text>
                    {roomData.participants.map((p: Participant) => (
                      <Text key={p.id} className="text-foreground">
                        • {p.guestName || "Guest"} {p.currentPlatform && `(${SOCIAL_PLATFORMS.find(pl => pl.id === p.currentPlatform)?.name || p.currentPlatform})`}
                      </Text>
                    ))}
                  </View>

                  {swapHistory && swapHistory.length > 0 && (
                    <View className="bg-surface p-4 rounded-xl">
                      <Text className="text-sm text-muted mb-2">Recent Swaps</Text>
                      {swapHistory.slice(0, 5).map((swap: any) => (
                        <Text key={swap.id} className="text-xs text-foreground mb-1">
                          • {swap.swapType} swap
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              </ScrollView>

              <TouchableOpacity
                onPress={() => setShowSessionHistory(false)}
                activeOpacity={0.7}
                className="bg-surface border border-border px-6 py-3 rounded-xl"
              >
                <Text className="text-foreground font-semibold text-center">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Platform Modal */}
        <Modal
          visible={showPlatformModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPlatformModal(false)}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-background rounded-t-3xl p-6 gap-4 max-h-96">
              <Text className="text-2xl font-bold text-foreground">Select Platform</Text>

              <ScrollView className="max-h-48">
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
