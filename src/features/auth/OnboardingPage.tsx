import React, { useEffect, useMemo, useRef, useState } from 'react';
import { streamOnboardingChat } from '@/api/client';
import { useProfile } from '@/common/context/ProfileContext';

interface OnboardingPageProps {
  /** Firebase ID token required for authenticated API calls */
  idToken: string | null;
}

type ChatAuthor = 'mentor' | 'student';

interface ChatMessage {
  id: string;
  author: ChatAuthor;
  content: string;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'mentor-welcome',
  author: 'mentor',
  content: "Welcome! I'm your AI mentor. I'm here to help you get set up. To start, what's your first name?",
};

const buildMessageId = (prefix: string): string => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const OnboardingPage: React.FC<OnboardingPageProps> = ({ idToken }) => {
  const { refetchProfile } = useProfile();
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => Boolean(idToken && inputValue.trim() && !isStreaming), [idToken, inputValue, isStreaming]);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const appendChunkToMessage = (messageId: string, chunk: string) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId
          ? {
              ...message,
              content: `${message.content}${chunk}`,
            }
          : message,
      ),
    );
  };

  const handleSend = async () => {
    if (!canSend || !idToken) {
      return;
    }

    const trimmed = inputValue.trim();
    const userMessage: ChatMessage = {
      id: buildMessageId('student'),
      author: 'student',
      content: trimmed,
    };
    const mentorMessageId = buildMessageId('mentor');

    setMessages((prev) => [...prev, userMessage, { id: mentorMessageId, author: 'mentor', content: '' }]);
    setInputValue('');
    setIsStreaming(true);
    setError(null);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await streamOnboardingChat({
        token: idToken,
        message: trimmed,
        signal: controller.signal,
        onData: (chunk) => appendChunkToMessage(mentorMessageId, chunk),
      });
      await refetchProfile().catch(() => null);
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return;
      }
      setError('We hit a snag talking to your mentor. Please try again.');
      appendChunkToMessage(mentorMessageId, 'Sorry, I lost my train of thought. Could you repeat that?');
    } finally {
      setIsStreaming(false);
      controllerRef.current = null;
    }
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="border-b border-white/5 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-purple-500 flex items-center justify-center text-2xl">
            🎓
          </div>
          <div>
            <p className="text-sm text-slate-400">Student Mentor AI</p>
            <h1 className="text-xl font-semibold">Let’s get to know you</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-3xl mx-auto flex flex-col px-6 py-8 gap-6">
          <div className="flex-1 overflow-y-auto rounded-2xl bg-slate-900/60 border border-white/5 p-6 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.author === 'student' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.author === 'student' ? 'bg-sky-600 text-white rounded-br-sm' : 'bg-white/5 text-slate-100 rounded-bl-sm'
                  }`}
                >
                  {message.content || '...'}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-200 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}

          {!idToken && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-100 rounded-xl px-4 py-3 text-sm">
              You need to be logged in before starting onboarding.
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Type your reply..."
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleInputKeyDown}
                disabled={!idToken || isStreaming}
                className="flex-1 rounded-2xl bg-slate-900/60 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                className="rounded-2xl bg-sky-500 px-6 py-3 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:bg-sky-400 transition-colors"
              >
                {isStreaming ? 'Mentor typing…' : 'Send'}
              </button>
            </div>
            <p className="text-xs text-slate-500 text-center">Your responses are securely saved to personalize your experience.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OnboardingPage;
