import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { useMessaging } from "@/lib/messaging-context";
import { useState } from "react";
import * as Haptics from "expo-haptics";

interface ChatPanelProps {
  onSendMessage: (content: string) => Promise<void>;
  isLoading?: boolean;
}

export function ChatPanel({ onSendMessage, isLoading = false }: ChatPanelProps) {
  const { messages } = useMessaging();
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    setIsSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await onSendMessage(messageText.trim());
      setMessageText("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: any }) => (
    <View
      className={`mb-3 flex-row ${item.isOwn ? "justify-end" : "justify-start"}`}
    >
      <View
        className={`max-w-xs px-4 py-2 rounded-2xl ${
          item.isOwn
            ? "bg-primary rounded-br-none"
            : "bg-surface rounded-bl-none"
        }`}
      >
        {!item.isOwn && (
          <Text className="text-xs text-muted font-semibold mb-1">
            {item.senderName}
          </Text>
        )}
        <Text className={`${item.isOwn ? "text-white" : "text-foreground"}`}>
          {item.content}
        </Text>
        <Text
          className={`text-xs mt-1 ${
            item.isOwn ? "text-white/70" : "text-muted"
          }`}
        >
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background rounded-t-3xl flex-col"
    >
      <View className="flex-1 p-4">
        <Text className="text-lg font-bold text-foreground mb-4">Chat</Text>

        {messages.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted">No messages yet</Text>
            <Text className="text-xs text-muted mt-2">
              Start the conversation!
            </Text>
          </View>
        ) : (
          <FlatList
            data={[...messages].reverse()}
            renderItem={renderMessage}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            inverted
            scrollEnabled
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Message Input */}
      <View className="border-t border-border p-4 gap-3">
        <View className="flex-row gap-2 items-end">
          <TextInput
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            placeholderTextColor="#9BA1A6"
            multiline
            maxLength={500}
            editable={!isSending && !isLoading}
            className="flex-1 bg-surface border border-border rounded-2xl px-4 py-3 text-foreground"
            style={{ maxHeight: 100 }}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!messageText.trim() || isSending || isLoading}
            activeOpacity={0.7}
            className="bg-primary rounded-full p-3"
          >
            <Text className="text-white text-lg">
              {isSending ? "⏳" : "📤"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-xs text-muted text-right">
          {messageText.length}/500
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
