/**
 * ChatDrawer Component
 * 
 * Slide-in chat drawer from the right side with ChatGPT-style interface.
 * 
 * Features:
 * - Smooth slide-in animation
 * - Focus trap when open
 * - ESC key to close
 * - Backdrop click to close
 * - Context header with student info
 * - Full ChatInterface integration
 * - Mobile responsive (full width on mobile, 450px on desktop)
 * 
 * Accessibility:
 * - role="dialog" with aria-modal
 * - Focus trap within drawer
 * - ESC key support
 * - Screen reader friendly
 */

import React, { useEffect, useRef } from 'react';
import { ChatInterface } from './ChatInterface';
import type { ChatMessage } from '@/types';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  
  // Chat data
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  suggestedPrompts?: string[];
  
  // Context info
  studentName: string;
  grade: string;
  lastCheckIn?: string;
  
  // Optional context bullets
  contextBullets?: string[];
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  isLoading,
  onSendMessage,
  suggestedPrompts,
  studentName,
  grade,
  lastCheckIn,
  contextBullets = [],
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      // Focus close button on open (accessibility)
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const focusableElements = drawerRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (!focusableElements || focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift+Tab: Focus last element when on first
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab: Focus first element when on last
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleTab);
    return () => window.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed top-0 right-0 h-full w-full sm:w-[450px] lg:w-[500px] bg-bg-dark shadow-2xl z-50 flex flex-col animate-slide-in-right"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-drawer-title"
        aria-describedby="chat-drawer-description"
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 id="chat-drawer-title" className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                AI Mentor Chat
              </h2>
              <p id="chat-drawer-description" className="text-xs text-[var(--text-secondary)]">
                {studentName} • {grade}
                {lastCheckIn && ` • Last check-in: ${lastCheckIn}`}
              </p>

              {/* Context bullets */}
              {contextBullets.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[var(--border-color)]">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Context:</p>
                  <ul className="space-y-0.5">
                    {contextBullets.slice(0, 3).map((bullet, idx) => (
                      <li key={idx} className="text-xs text-[var(--text-secondary)] flex items-start gap-1">
                        <span className="text-[var(--accent-primary)] mt-0.5">•</span>
                        <span className="flex-1">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--bg-secondary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              aria-label="Close chat drawer"
            >
              <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface
            messages={messages}
            isLoading={isLoading}
            onSendMessage={onSendMessage}
            suggestedPrompts={suggestedPrompts}
            compact={false}
            showHeader={false}
          />
        </div>
      </div>
    </>
  );
};

export default ChatDrawer;
