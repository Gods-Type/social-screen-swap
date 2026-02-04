import { View, Text, TouchableOpacity } from "react-native";
import { useVideo } from "@/lib/video-context";
import * as Haptics from "expo-haptics";

interface VideoGridProps {
  onToggleVideo?: () => void;
}

export function VideoGrid({ onToggleVideo }: VideoGridProps) {
  const { localParticipant, remoteParticipants, isVideoEnabled } = useVideo();

  const handleToggleVideo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggleVideo?.();
  };

  const allParticipants = remoteParticipants.length + (localParticipant ? 1 : 0);

  // Determine grid layout based on number of participants
  const getGridLayout = () => {
    if (allParticipants <= 1) return "single";
    if (allParticipants <= 2) return "two";
    if (allParticipants <= 4) return "four";
    return "grid";
  };

  const layout = getGridLayout();

  return (
    <View className="flex-1 bg-black rounded-2xl overflow-hidden">
      {layout === "single" && (
        <View className="flex-1 items-center justify-center gap-4">
          {localParticipant && (
            <View className="flex-1 w-full items-center justify-center bg-surface">
              <View className={`w-32 h-32 rounded-full items-center justify-center ${
                isVideoEnabled ? "bg-primary" : "bg-muted"
              }`}>
                <Text className="text-white text-5xl font-bold">
                  {(localParticipant.name || "?").charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text className="text-white font-semibold mt-4">
                {localParticipant.name} (You)
              </Text>
              <Text className="text-gray-400 text-sm">
                {isVideoEnabled ? "Camera On" : "Camera Off"}
              </Text>
            </View>
          )}
        </View>
      )}

      {layout === "two" && (
        <View className="flex-1 flex-row">
          {localParticipant && (
            <View className="flex-1 items-center justify-center bg-surface border-r border-border">
              <View className={`w-20 h-20 rounded-full items-center justify-center ${
                isVideoEnabled ? "bg-primary" : "bg-muted"
              }`}>
                <Text className="text-white text-2xl font-bold">
                  {(localParticipant.name || "?").charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text className="text-white text-xs font-semibold mt-2">You</Text>
            </View>
          )}

          {remoteParticipants[0] && (
            <View className="flex-1 items-center justify-center bg-surface">
              <View className={`w-20 h-20 rounded-full items-center justify-center ${
                remoteParticipants[0].isVideoOn ? "bg-secondary" : "bg-muted"
              }`}>
                <Text className="text-white text-2xl font-bold">
                  {(remoteParticipants[0].name || "?").charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text className="text-white text-xs font-semibold mt-2">
                {remoteParticipants[0].name}
              </Text>
            </View>
          )}
        </View>
      )}

      {layout === "four" && (
        <View className="flex-1">
          <View className="flex-1 flex-row">
            {localParticipant && (
              <View className="flex-1 items-center justify-center bg-surface border-r border-b border-border">
                <View className={`w-16 h-16 rounded-full items-center justify-center ${
                  isVideoEnabled ? "bg-primary" : "bg-muted"
                }`}>
                  <Text className="text-white text-xl font-bold">
                    {(localParticipant.name || "?").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text className="text-white text-xs font-semibold mt-1">You</Text>
              </View>
            )}

            {remoteParticipants[0] && (
              <View className="flex-1 items-center justify-center bg-surface border-b border-border">
                <View className={`w-16 h-16 rounded-full items-center justify-center ${
                  remoteParticipants[0].isVideoOn ? "bg-secondary" : "bg-muted"
                }`}>
                  <Text className="text-white text-xl font-bold">
                    {(remoteParticipants[0].name || "?").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text className="text-white text-xs font-semibold mt-1">
                  {remoteParticipants[0].name}
                </Text>
              </View>
            )}
          </View>

          <View className="flex-1 flex-row">
            {remoteParticipants[1] && (
              <View className="flex-1 items-center justify-center bg-surface border-r border-border">
                <View className={`w-16 h-16 rounded-full items-center justify-center ${
                  remoteParticipants[1].isVideoOn ? "bg-secondary" : "bg-muted"
                }`}>
                  <Text className="text-white text-xl font-bold">
                    {(remoteParticipants[1].name || "?").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text className="text-white text-xs font-semibold mt-1">
                  {remoteParticipants[1].name}
                </Text>
              </View>
            )}

            {remoteParticipants[2] && (
              <View className="flex-1 items-center justify-center bg-surface">
                <View className={`w-16 h-16 rounded-full items-center justify-center ${
                  remoteParticipants[2].isVideoOn ? "bg-secondary" : "bg-muted"
                }`}>
                  <Text className="text-white text-xl font-bold">
                    {(remoteParticipants[2].name || "?").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text className="text-white text-xs font-semibold mt-1">
                  {remoteParticipants[2].name}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Video Toggle Button */}
      <TouchableOpacity
        onPress={handleToggleVideo}
        activeOpacity={0.7}
        className="absolute bottom-4 right-4 bg-primary rounded-full p-3"
      >
        <Text className="text-white text-xl">
          {isVideoEnabled ? "📹" : "🚫"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
