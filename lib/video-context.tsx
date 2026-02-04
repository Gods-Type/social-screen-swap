import React, { createContext, useContext, useState, useCallback } from "react";

export interface VideoParticipant {
  id: number;
  name: string;
  isVideoOn: boolean;
  avatarColor: string;
}

interface VideoContextType {
  localParticipant: VideoParticipant | null;
  remoteParticipants: VideoParticipant[];
  isVideoEnabled: boolean;
  setLocalParticipant: (participant: VideoParticipant) => void;
  setRemoteParticipants: (participants: VideoParticipant[]) => void;
  toggleLocalVideo: () => void;
  updateRemoteParticipantVideo: (participantId: number, isVideoOn: boolean) => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export function VideoProvider({ children }: { children: React.ReactNode }) {
  const [localParticipant, setLocalParticipant] = useState<VideoParticipant | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<VideoParticipant[]>([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const toggleLocalVideo = useCallback(() => {
    setIsVideoEnabled((prev) => !prev);
    if (localParticipant) {
      setLocalParticipant({
        ...localParticipant,
        isVideoOn: !isVideoEnabled,
      });
    }
  }, [isVideoEnabled, localParticipant]);

  const updateRemoteParticipantVideo = useCallback(
    (participantId: number, isVideoOn: boolean) => {
      setRemoteParticipants((prev) =>
        prev.map((p) =>
          p.id === participantId ? { ...p, isVideoOn } : p
        )
      );
    },
    []
  );

  return (
    <VideoContext.Provider
      value={{
        localParticipant,
        remoteParticipants,
        isVideoEnabled,
        setLocalParticipant,
        setRemoteParticipants,
        toggleLocalVideo,
        updateRemoteParticipantVideo,
      }}
    >
      {children}
    </VideoContext.Provider>
  );
}

export function useVideo() {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error("useVideo must be used within VideoProvider");
  }
  return context;
}
