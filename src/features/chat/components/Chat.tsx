import React, { useEffect, useState } from "react";
import {
  type ActivityLog,
  type ChatMessage,
  type DailyCheckIn,
  type StudentProfile,
  type TeacherAlert,
} from "@/types";
import { ChatInterface } from "./ChatInterface";
import { createBackendChatClient, type BackendChatClient } from "@/common/utils/aiHelpers";

type MentorChatClient = BackendChatClient | DemoChatClient;

interface DemoChatClient {
  mode: "demo";
  sendMessageStream: (payload: { studentId: string; message: string }) => AsyncGenerator<{ text: string }>;
}

const createDemoChatClient = (profile: StudentProfile): DemoChatClient => ({
  mode: "demo",
  async *sendMessageStream({ message }): AsyncGenerator<{ text: string }> {
    const firstName = (profile.name && profile.name.split(" ")[0]) || profile.name;
    const reply = `Hi ${firstName}! I'm running in demo mode because the mentor backend isn't reachable yet. Here's a canned thought about "${message}".\n\nTry exploring homework, wellness, or goal prompts while we finish setup.`;
    const chunks = reply.match(/.{1,60}/g) || [reply];
    for (const chunk of chunks) {
      await new Promise((resolve) => setTimeout(resolve, 110));
      yield { text: chunk };
    }
  },
});

interface ChatProps {
  profile: StudentProfile;
  checkIns: DailyCheckIn[];
  activities: ActivityLog[];
  onAddActivity: (activity: Omit<ActivityLog, "id" | "timestamp">) => void;
  onTriggerAlert?: (alert: Omit<TeacherAlert, "id" | "createdAt">) => void;
  idToken?: string | null;
}

const Chat: React.FC<ChatProps> = ({
  profile,
  checkIns,
  activities,
  onAddActivity,
  onTriggerAlert,
  idToken,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatClient, setChatClient] = useState<MentorChatClient | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const initializeMentorChat = async () => {
      setIsInitializing(true);
      setMessages([]);

      const backendClient = createBackendChatClient(undefined, idToken ?? undefined);
      try {
        await backendClient.healthcheck();
        if (cancelled) return;
        setChatClient(backendClient);
        setMessages([buildWelcomeMessage(profile)]);
      } catch (_error) {
        if (cancelled) return;
        const demoClient = createDemoChatClient(profile);
        setChatClient(demoClient);
        setMessages([buildWelcomeMessage(profile, true)]);
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    };

    initializeMentorChat();
    return () => {
      cancelled = true;
    };
  }, [profile, idToken]);

  const handleSendMessage = async (userMessageContent: string) => {
    if (!userMessageContent.trim() || isLoading) return;
    if (!chatClient) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "model",
          content: "Still connecting to the mentor service. Please try again shortly.",
          timestamp: new Date().toISOString(),
        },
      ]);
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userMessageContent,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const responseStream = chatClient.sendMessageStream({ studentId: profile.id, message: userMessageContent });
      const modelMessageId = `model-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: modelMessageId,
          role: "model",
          content: "",
          timestamp: new Date().toISOString(),
        },
      ]);

      for await (const chunk of responseStream) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === modelMessageId ? { ...msg, content: msg.content + chunk.text } : msg))
        );
      }

      const messageType = detectMessageType(userMessageContent);
      if (messageType) {
        onAddActivity({
          studentId: profile.id,
          type: messageType.type,
          category: messageType.category,
          description: messageType.description,
        });

        if (
          "shouldAlert" in messageType &&
          messageType.shouldAlert &&
          onTriggerAlert &&
          "alert" in messageType &&
          messageType.alert
        ) {
          onTriggerAlert(messageType.alert);
        }
      }
    } catch (error) {
      let userFriendlyMessage = "I'm having a little trouble thinking right now. Please try again in a moment.";
      if (error instanceof Error) {
        const lowered = error.message.toLowerCase();
        if (lowered.includes("backend")) {
          userFriendlyMessage = "The mentor backend is offline. Switching to demo mode soon.";
        } else if (lowered.includes("network") || lowered.includes("fetch")) {
          userFriendlyMessage = "I'm having trouble connecting. Please check your internet and try again.";
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "model",
          content: userFriendlyMessage,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const detectMessageType = (
    message: string
  ): {
    type: ActivityLog["type"];
    category: string;
    description: string;
    shouldAlert?: boolean;
    alert?: Omit<TeacherAlert, "id" | "createdAt">;
  } | null => {
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes("depressed") ||
      lowerMessage.includes("hopeless") ||
      lowerMessage.includes("can't cope") ||
      lowerMessage.includes("give up")
    ) {
      return {
        type: "mental-health",
        category: "emotional-crisis",
        description: "Expressed serious emotional distress",
        shouldAlert: true,
        alert: {
          studentId: profile.id,
          studentName: profile.name,
          alertType: "mental-health",
          severity: "urgent",
          title: "Student Expressing Serious Emotional Distress",
          description: `${profile.name} has used concerning language in chat that may indicate mental health crisis.`,
          aiInsight:
            "The student used language indicating potential depression or hopelessness. Immediate check-in recommended.",
          suggestedActions: [
            "Schedule immediate one-on-one conversation",
            "Contact school counselor",
            "Reach out to parents/guardians",
            "Provide mental health resources",
          ],
          relatedData: {
            recentCheckIns: checkIns.slice(0, 3),
            recentActivities: activities.slice(0, 5),
          },
          status: "new",
        },
      };
    }

    if (
      (lowerMessage.includes("failing") ||
        lowerMessage.includes("don't understand") ||
        lowerMessage.includes("too hard") ||
        lowerMessage.includes("can't do it")) &&
      checkIns.filter((c) => c.academicChallengesFaced).length >= 3
    ) {
      return {
        type: "academic",
        category: "struggling",
        description: "Expressed difficulty with coursework",
        shouldAlert: true,
        alert: {
          studentId: profile.id,
          studentName: profile.name,
          alertType: "academic-struggle",
          severity: "high",
          title: "Student Struggling with Academic Performance",
          description: `${profile.name} has repeatedly mentioned academic difficulties and may need extra support.`,
          aiInsight: "Pattern detected: Student has expressed academic challenges in multiple check-ins and is seeking help.",
          suggestedActions: [
            "Arrange tutoring sessions",
            "Review study methods and materials",
            "Break down complex topics into smaller parts",
            "Consider additional practice resources",
          ],
          relatedData: {
            recentCheckIns: checkIns.slice(0, 5),
            recentActivities: activities.filter((a) => a.type === "academic").slice(0, 5),
          },
          status: "new",
        },
      };
    }

    if (lowerMessage.includes("stress") || lowerMessage.includes("anxious") || lowerMessage.includes("worried")) {
      return {
        type: "mental-health",
        category: "emotional-support",
        description: "Sought support for stress or anxiety",
      };
    }

    if (
      lowerMessage.includes("homework") ||
      lowerMessage.includes("assignment") ||
      lowerMessage.includes("study")
    ) {
      return {
        type: "academic",
        category: "study-help",
        description: "Asked for academic help",
      };
    }

    if (lowerMessage.includes("career") || lowerMessage.includes("future") || lowerMessage.includes("goal")) {
      return {
        type: "achievement",
        category: "goal-planning",
        description: "Discussed career goals and aspirations",
      };
    }

    return null;
  };

  const suggestedPrompts = [
    `Help me understand ${profile.subjects[0] || "a difficult concept"}`,
    "How can I manage my time better?",
    `What steps should I take to become ${profile.dreamJob}?`,
    "I'm feeling stressed about exams",
  ];

  return (
    <div className="h-screen w-full bg-[var(--bg-app)] flex flex-col">
      {/* Top bar with logo */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-app)]">
        <div className="flex items-center gap-3">
          <img
            src="/logo.ico"
            alt="APEX Logo"
            className="h-8 w-8 object-contain"
          />
          <span className="text-lg font-semibold text-[var(--text-primary)]">APEX</span>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 overflow-hidden">
        {isInitializing ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)] mx-auto mb-4"></div>
              <p className="text-lg font-semibold text-[var(--text-primary)] mb-2">Connecting to AI Mentor</p>
              <p className="text-sm text-[var(--text-secondary)]">Setting up your personalized assistant...</p>
            </div>
          </div>
        ) : !chatClient ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md mx-auto px-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-[var(--text-primary)] mb-2">Connection Failed</p>
              <p className="text-sm text-[var(--text-secondary)]">Unable to connect to the AI mentor service. Please try refreshing or check your connection.</p>
            </div>
          </div>
        ) : (
          <ChatInterface
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            suggestedPrompts={messages.length === 1 ? suggestedPrompts : undefined}
            showHeader={false}
          />
        )}
      </div>
    </div>
  );
};

const getWelcomeMessage = (profile: StudentProfile): string => {
  const timeOfDay = new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening";
  return `Good ${timeOfDay}, ${profile.name}! \n\nI'm your personal AI mentor, here to support you in achieving your dream of becoming ${profile.dreamJob}.\n\nWhether you need help with ${profile.subjects[0] || "your studies"
    }, want to talk about your goals, or just need someone to listen, I'm here for you. What's on your mind today?`;
};

const getDemoWelcomeMessage = (profile: StudentProfile): string => {
  const firstName = (profile.name && profile.name.split(" ")[0]) || profile.name;
  return `Hello ${firstName}! \n\nThe mentor brain is warming up, so you're chatting with a local demo agent until the backend connects.`;
};

const buildWelcomeMessage = (profile: StudentProfile, isDemo = false): ChatMessage => ({
  id: `${isDemo ? "demo" : "model"}-welcome-${Date.now()}`,
  role: "model",
  content: isDemo ? getDemoWelcomeMessage(profile) : getWelcomeMessage(profile),
  timestamp: new Date().toISOString(),
});

export default Chat;
