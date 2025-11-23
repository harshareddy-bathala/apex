/**
 * ChatInterface Component
 * 
 * Shared chat UI component with ChatGPT-style interface:
 * - Message bubbles (user on right, AI on left)
 * - Typing indicator with animated dots
 * - Multiline input composer (Enter to send, Shift+Enter for newline)
 * - Suggested prompts as clickable chips
 * - Auto-scroll to bottom on new messages
 * - Accessible with aria-live regions
 * 
 * This component can be used in both full-page Chat view and ChatDrawer.
 * 
 * Props:
 * - messages: ChatMessage[] - Message history
 * - isLoading: boolean - Show typing indicator
 * - onSendMessage: (message: string) => void - Send callback
 * - suggestedPrompts?: string[] - Optional prompt chips
 * - studentName?: string - For context display
 * - grade?: string - For context display
 * - compact?: boolean - Compact mode for drawer
 */

import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '@/types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  suggestedPrompts?: string[];
  studentName?: string;
  grade?: string;
  showHeader?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  onSendMessage,
  suggestedPrompts = [],
  studentName,
  grade,
  showHeader = true,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    onSendMessage(input.trim());
    setInput('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handlePromptClick = (prompt: string) => {
    if (isLoading) return;
    onSendMessage(prompt);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-app)]">
      {/* Messages Area - Full height */}
      <div
        className="flex-1 overflow-y-auto px-4 py-6"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center">
                <div className="w-16 h-16 bg-[var(--accent-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">How can I help you today?</h2>
                <p className="text-[var(--text-secondary)] mb-8">Ask me anything about your studies, goals, or personal growth.</p>

                {/* Suggested Prompts */}
                {suggestedPrompts.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    {suggestedPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handlePromptClick(prompt)}
                        disabled={isLoading}
                        className="p-4 text-left bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] rounded-lg transition-all duration-200 group"
                      >
                        <p className="text-[var(--text-primary)] font-medium group-hover:text-[var(--accent-primary)]">{prompt}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  timestamp={formatTimestamp(msg.timestamp)}
                />
              ))}

              {/* Typing Indicator */}
              {isLoading && (
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[var(--accent-primary)] rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    AI
                  </div>
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl px-4 py-3">
                    <TypingIndicator />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-app)] p-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <form onSubmit={handleSubmit} className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message AI Mentor..."
                  disabled={isLoading}
                  rows={1}
                  className="w-full px-4 py-3 pr-12 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent resize-none max-h-32 overflow-y-auto"
                  aria-label="Message input"
                  style={{ minHeight: '52px' }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-3 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex-shrink-0"
                aria-label="Send message"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </form>
          </div>

          <p className="text-xs text-[var(--text-muted)] text-center mt-3">
            AI Mentor powered by Gemini • Your conversations are private and secure
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * ChatBubble Component
 * Individual message bubble with role-based styling
 */

interface ChatBubbleProps {
  message: ChatMessage;
  timestamp: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, timestamp }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'} fade-in`}>
      {/* AI Avatar (left side) */}
      {!isUser && (
        <div className="w-8 h-8 bg-[var(--accent-primary)] rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
          AI
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%] md:max-w-[70%]`}>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-[var(--accent-primary)] text-white'
              : 'bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)]'
          }`}
        >
          <p className="whitespace-pre-wrap break-words leading-relaxed text-sm md:text-base">
            {message.content}
          </p>
        </div>

        <span className="text-xs text-[var(--text-muted)] mt-2 px-1">
          {timestamp}
        </span>
      </div>

      {/* User Avatar (right side) */}
      {isUser && (
        <div className="w-8 h-8 bg-[var(--text-primary)] rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
          U
        </div>
      )}
    </div>
  );
};

/**
 * TypingIndicator Component
 * Animated three-dot typing indicator
 */

const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-1" role="status" aria-label="AI is typing">
    <div className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
    <div className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
    <div className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
  </div>
);

export default ChatInterface;
