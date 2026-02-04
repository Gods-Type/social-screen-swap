import React, { createContext, useContext, useState, useCallback } from "react";

export interface ReplayEvent {
  id: number;
  participantName: string;
  eventType: string;
  timestamp: Date;
  eventData?: string;
  targetParticipantName?: string;
}

interface ReplayContextType {
  events: ReplayEvent[];
  sessionDuration: number;
  isRecording: boolean;
  addEvent: (event: ReplayEvent) => void;
  setEvents: (events: ReplayEvent[]) => void;
  setSessionDuration: (duration: number) => void;
  setIsRecording: (recording: boolean) => void;
  clearEvents: () => void;
}

const ReplayContext = createContext<ReplayContextType | undefined>(undefined);

export function ReplayProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<ReplayEvent[]>([]);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const addEvent = useCallback((event: ReplayEvent) => {
    setEvents((prev) => [...prev, event]);
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return (
    <ReplayContext.Provider
      value={{
        events,
        sessionDuration,
        isRecording,
        addEvent,
        setEvents,
        setSessionDuration,
        setIsRecording,
        clearEvents,
      }}
    >
      {children}
    </ReplayContext.Provider>
  );
}

export function useReplay() {
  const context = useContext(ReplayContext);
  if (!context) {
    throw new Error("useReplay must be used within ReplayProvider");
  }
  return context;
}
