import { Text, View, TouchableOpacity, TextInput, Alert } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomeScreen() {
  const [roomName, setRoomName] = useState("");
  const [guestName, setGuestName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);

  const createRoomMutation = trpc.rooms.create.useMutation();
  const joinRoomMutation = trpc.rooms.join.useMutation();

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      Alert.alert("Error", "Please enter a room name");
      return;
    }

    if (!guestName.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const result = await createRoomMutation.mutateAsync({
        name: roomName.trim(),
        guestName: guestName.trim(),
        maxParticipants: 8,
      });

      // Store session data
      await AsyncStorage.setItem("currentRoomId", result.roomId.toString());
      await AsyncStorage.setItem("currentParticipantId", result.participantId.toString());
      await AsyncStorage.setItem("roomCode", result.code);
      await AsyncStorage.setItem("guestName", guestName.trim());

      // Navigate to lobby
      router.push({
        pathname: "/lobby",
        params: {
          roomId: result.roomId,
          participantId: result.participantId,
          code: result.code,
          isHost: "true",
        },
      });
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to create room");
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim() || joinCode.length !== 6) {
      Alert.alert("Error", "Please enter a valid 6-character room code");
      return;
    }

    if (!guestName.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const result = await joinRoomMutation.mutateAsync({
        code: joinCode.trim().toUpperCase(),
        guestName: guestName.trim(),
      });

      // Store session data
      await AsyncStorage.setItem("currentRoomId", result.roomId.toString());
      await AsyncStorage.setItem("currentParticipantId", result.participantId.toString());
      await AsyncStorage.setItem("roomCode", joinCode.trim().toUpperCase());
      await AsyncStorage.setItem("guestName", guestName.trim());

      // Navigate to lobby
      router.push({
        pathname: "/lobby",
        params: {
          roomId: result.roomId,
          participantId: result.participantId,
          code: joinCode.trim().toUpperCase(),
          isHost: "false",
        },
      });
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to join room");
    }
  };

  return (
    <ScreenContainer className="p-6">
      <View className="flex-1 justify-center gap-8">
        {/* Header */}
        <View className="items-center gap-3">
          <Text className="text-5xl font-bold text-foreground">Screen Swap</Text>
          <Text className="text-base text-muted text-center px-4">
            Share and swap screens with friends across social media platforms
          </Text>
        </View>

        {/* Main Actions */}
        {!showCreateForm && !showJoinForm && (
          <View className="gap-4">
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowCreateForm(true);
              }}
              activeOpacity={0.8}
              className="bg-primary px-8 py-4 rounded-2xl"
            >
              <Text className="text-white text-lg font-semibold text-center">Create Room</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowJoinForm(true);
              }}
              activeOpacity={0.7}
              className="bg-surface px-8 py-4 rounded-2xl border border-border"
            >
              <Text className="text-foreground text-lg font-semibold text-center">Join Room</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Create Room Form */}
        {showCreateForm && (
          <View className="bg-surface p-6 rounded-2xl gap-4">
            <Text className="text-xl font-bold text-foreground">Create New Room</Text>
            
            <View className="gap-2">
              <Text className="text-sm text-muted">Your Name</Text>
              <TextInput
                value={guestName}
                onChangeText={setGuestName}
                placeholder="Enter your name"
                placeholderTextColor="#9BA1A6"
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                maxLength={50}
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm text-muted">Room Name</Text>
              <TextInput
                value={roomName}
                onChangeText={setRoomName}
                placeholder="Enter room name"
                placeholderTextColor="#9BA1A6"
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                maxLength={100}
              />
            </View>

            <View className="flex-row gap-3 mt-2">
              <TouchableOpacity
                onPress={handleCreateRoom}
                disabled={createRoomMutation.isPending}
                activeOpacity={0.8}
                className="flex-1 bg-primary px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold text-center">
                  {createRoomMutation.isPending ? "Creating..." : "Create"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowCreateForm(false);
                  setRoomName("");
                  setGuestName("");
                }}
                activeOpacity={0.7}
                className="flex-1 bg-surface border border-border px-6 py-3 rounded-xl"
              >
                <Text className="text-foreground font-semibold text-center">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Join Room Form */}
        {showJoinForm && (
          <View className="bg-surface p-6 rounded-2xl gap-4">
            <Text className="text-xl font-bold text-foreground">Join Room</Text>
            
            <View className="gap-2">
              <Text className="text-sm text-muted">Your Name</Text>
              <TextInput
                value={guestName}
                onChangeText={setGuestName}
                placeholder="Enter your name"
                placeholderTextColor="#9BA1A6"
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                maxLength={50}
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm text-muted">Room Code</Text>
              <TextInput
                value={joinCode}
                onChangeText={(text) => setJoinCode(text.toUpperCase())}
                placeholder="Enter 6-character code"
                placeholderTextColor="#9BA1A6"
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground text-2xl font-mono text-center tracking-widest"
                maxLength={6}
                autoCapitalize="characters"
              />
            </View>

            <View className="flex-row gap-3 mt-2">
              <TouchableOpacity
                onPress={handleJoinRoom}
                disabled={joinRoomMutation.isPending}
                activeOpacity={0.8}
                className="flex-1 bg-primary px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold text-center">
                  {joinRoomMutation.isPending ? "Joining..." : "Join"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowJoinForm(false);
                  setJoinCode("");
                  setGuestName("");
                }}
                activeOpacity={0.7}
                className="flex-1 bg-surface border border-border px-6 py-3 rounded-xl"
              >
                <Text className="text-foreground font-semibold text-center">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}
