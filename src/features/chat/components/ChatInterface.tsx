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
        <div className="flex-shrink-0 p-4 border-b border-white/10 bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-sky-500/20">
                AI
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0f172a]"></div>
            </div>
            <div>
              <h2 className="text-base font-semibold text-white font-display">Your AI Mentor</h2>
              {studentName && grade && (
                <p className="text-xs text-slate-400">
                  {studentName} • {grade}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div
        className={`flex-1 overflow-y-auto ${compact ? 'p-3 pb-20' : 'p-4 sm:p-6 pb-24'} space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent`}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-500">
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
          <div className="flex items-start gap-3 animate-fade-in">
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/50 text-xs font-bold flex-shrink-0 border border-white/5">
              AI
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-none px-4 py-3 max-w-xs sm:max-w-md backdrop-blur-sm">
              <TypingIndicator />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts (show when no messages and not loading) */}
      {messages.length === 0 && !isLoading && suggestedPrompts.length > 0 && (
        <div className={`absolute bottom-24 left-0 right-0 ${compact ? 'px-3' : 'px-6'} flex justify-center`}>
          <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handlePromptClick(prompt)}
                disabled={isLoading}
                className="text-xs px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md text-slate-200 rounded-full transition-all border border-white/10 hover:border-sky-500/30 hover:shadow-lg hover:shadow-sky-500/10"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Composer - Floating Glass Bar */}
      <div className={`absolute bottom-4 left-4 right-4 ${compact ? 'bottom-2 left-2 right-2' : ''}`}>
        <div className="glass-panel rounded-2xl p-2 border border-white/10 shadow-2xl bg-[#0f172a]/80 backdrop-blur-xl">
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
                className="w-full px-4 py-3 bg-transparent text-white placeholder-slate-500 focus:outline-none resize-none max-h-32 overflow-y-auto text-sm sm:text-base"
                aria-label="Message input"
                style={{ minHeight: '44px' }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:shadow-lg hover:shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none active:scale-95 m-1"
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
          <p className="text-[10px] text-slate-500 text-center mt-2 font-medium tracking-wide uppercase opacity-60">
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
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      {/* AI Avatar (left side) */}
      {!isUser && (
        <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center text-white/60 text-xs font-bold flex-shrink-0 border border-white/10">
          AI
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%]`}>
        <div
          className={`px-5 py-3.5 ${isUser
              ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-2xl rounded-br-none shadow-lg shadow-sky-500/20 border border-white/10'
              : 'bg-white/5 text-slate-200 rounded-2xl rounded-bl-none border border-white/10 backdrop-blur-sm'
            }`}
        >
          <p className={`whitespace-pre-wrap break-words leading-relaxed ${compact ? 'text-sm' : 'text-sm sm:text-base'}`}>
            {message.content}
          </p>
        </div>

        <span className={`text-[10px] text-slate-500 mt-1.5 px-1 font-medium ${compact ? 'hidden' : 'block'}`}>
          {timestamp}
        </span>
      </div>

      {/* User Avatar (right side) */}
      {isUser && (
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-lg shadow-indigo-500/20">
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
    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
  </div>
);

export default ChatInterface;
