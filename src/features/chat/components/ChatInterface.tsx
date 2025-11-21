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
  compact?: boolean;
  showHeader?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  onSendMessage,
  suggestedPrompts = [],
  studentName,
  grade,
  compact = false,
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
    <div className="flex flex-col h-full bg-transparent relative">
      {/* Header (optional) */}
      {showHeader && (
        <div className="flex-shrink-0 p-4 border-b border-[var(--border-color)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-[var(--accent-primary)] rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                AI
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[var(--success)] rounded-full border-2 border-[var(--bg-surface)]"></div>
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Your AI Mentor</h2>
              {studentName && grade && (
                <p className="text-xs text-[var(--text-secondary)]">
                  {studentName} • {grade}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div
        className={`flex-1 overflow-y-auto ${compact ? 'p-3 pb-20' : 'p-4 sm:p-6 pb-24'} space-y-4`}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-[var(--text-tertiary)]">
              <p className="text-sm">Start a conversation with your AI Mentor</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              compact={compact}
              timestamp={formatTimestamp(msg.timestamp)}
            />
          ))
        )}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3 fade-in">
            <div className="w-8 h-8 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center text-[var(--text-tertiary)] text-xs font-bold flex-shrink-0 border border-[var(--border-color)]">
              AI
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-4 py-3 max-w-xs sm:max-w-md">
              <TypingIndicator />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts (show when no messages and not loading) */}
      {messages.length === 0 && !isLoading && suggestedPrompts.length > 0 && (
        <div className={`absolute bottom-20 left-0 right-0 ${compact ? 'px-3' : 'px-6'} flex justify-center`}>
          <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handlePromptClick(prompt)}
                disabled={isLoading}
                className="text-xs px-4 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg transition-all border border-[var(--border-color)] hover:border-[var(--accent-primary)]"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Composer */}
      <div className={`absolute bottom-2 left-4 right-4 ${compact ? 'bottom-2 left-2 right-2' : ''}`}>
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/80 backdrop-blur-xl p-2 shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                disabled={isLoading}
                rows={1}
                className="w-full px-4 py-3 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none resize-none max-h-32 overflow-y-auto text-sm sm:text-base"
                aria-label="Message input"
                style={{ minHeight: '44px' }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="btn-primary p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
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

        {!compact && (
          <p className="text-[10px] text-[var(--text-muted)] text-center mt-2 uppercase tracking-wide opacity-60">
            AI Mentor • Powered by Gemini
          </p>
        )}
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
  compact?: boolean;
  timestamp: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, compact = false, timestamp }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end gap-3 fade-in`}>
      {/* AI Avatar (left side) */}
      {!isUser && (
        <div className="w-8 h-8 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center text-[var(--text-tertiary)] text-xs font-bold flex-shrink-0 border border-[var(--border-color)]">
          AI
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
        <div
          className={`px-5 py-3.5 ${isUser
            ? 'bg-[#1E49FF] text-white rounded-2xl rounded-br-sm shadow-[0_10px_30px_rgba(30,73,255,0.35)]'
            : 'bg-white/5 text-[var(--text-primary)] rounded-2xl rounded-bl-sm border border-white/10 backdrop-blur-md'
            }`}
        >
          <p className={`whitespace-pre-wrap break-words leading-relaxed ${compact ? 'text-sm' : 'text-sm sm:text-base'}`}>
            {message.content}
          </p>
        </div>

        <span className={`text-[10px] text-[var(--text-muted)] mt-1.5 px-1 ${compact ? 'hidden' : 'block'}`}>
          {timestamp}
        </span>
      </div>

      {/* User Avatar (right side) */}
      {isUser && (
        <div className="w-8 h-8 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-hover)] rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md">
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
