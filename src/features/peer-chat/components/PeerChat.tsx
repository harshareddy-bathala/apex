import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getPeerContacts, getPeerMessages, sendPeerMessage } from '@/api/client';
import type { ChatContact, PeerMessage } from '@/types';

interface PeerChatProps {
  currentUserId: string;
  currentUserName: string;
  idToken: string;
}

export default function PeerChat({ currentUserId, currentUserName, idToken }: PeerChatProps) {
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<PeerMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sendingMessageId, setSendingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadContacts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setContacts([]);
      setContactsLoading(false);
      return;
    }

    setContactsLoading(true);
    setContactsError(null);
    try {
      const { peers } = await getPeerContacts(idToken, query);
      setContacts(peers);
    } catch (err) {
      setContactsError('Unable to load your peers. Please try again.');
      setContacts([]);
    } finally {
      setContactsLoading(false);
    }
  }, [idToken]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadContacts(searchQuery);
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [loadContacts, searchQuery]);

  const loadConversation = useCallback(
    async (peerId: string) => {
      setMessagesLoading(true);
      setMessagesError(null);
      try {
        const { messages: peerMessages } = await getPeerMessages(idToken, peerId);
        const ordered = peerMessages.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );
        setMessages(ordered);
      } catch (err) {
        setMessagesError('Unable to load this conversation.');
        setMessages([]);
      } finally {
        setMessagesLoading(false);
      }
    },
    [idToken],
  );

  useEffect(() => {
    if (selectedContact) {
      void loadConversation(selectedContact.id);
    } else {
      setMessages([]);
    }
  }, [selectedContact, loadConversation]);

  const currentContactName = selectedContact?.name ?? 'your peer';

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedContact) {
      return;
    }

    const trimmed = newMessage.trim();
    const optimisticId = `temp-${Date.now()}`;
    const conversationId = [currentUserId, selectedContact.id].sort().join('-');
    const optimisticMessage: PeerMessage = {
      id: optimisticId,
      conversationId,
      senderId: currentUserId,
      senderName: currentUserName,
      receiverId: selectedContact.id,
      message: trimmed,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'text',
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage('');
    setSendingMessageId(optimisticId);
    setMessagesError(null);

    try {
      const persisted = await sendPeerMessage(idToken, {
        recipientId: selectedContact.id,
        content: trimmed,
      });

      setMessages((prev) =>
        prev.map((msg) => (msg.id === optimisticId ? { ...persisted } : msg)),
      );
    } catch (err) {
      setMessagesError('Message failed to send. Please try again.');
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId));
      setNewMessage(trimmed);
    } finally {
      setSendingMessageId(null);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void handleSend();
    }
  };

  const renderContactList = () => {
    if (contactsLoading) {
      return (
        <div className="flex items-center justify-center h-full text-muted-ink">
          <p>Searching...</p>
        </div>
      );
    }

    if (contactsError) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <p className="text-body text-red-200 mb-4">{contactsError}</p>
          <button
            type="button"
            onClick={() => void loadContacts(searchQuery)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-from to-primary-to text-white shadow-card"
          >
            Retry
          </button>
        </div>
      );
    }

    if (!searchQuery.trim()) {
      return (
        <div className="p-8 text-center text-muted-ink">
          <p>Type to search for classmates.</p>
        </div>
      );
    }

    if (contacts.length === 0) {
      return (
        <div className="p-8 text-center text-muted-ink">
          <p>No classmates found.</p>
        </div>
      );
    }

    return contacts.map((contact) => (
      <button
        key={contact.id}
        onClick={() => setSelectedContact(contact)}
        className={`w-full p-4 border-b border-card-border hover:bg-panel transition-colors text-left ${selectedContact?.id === contact.id ? 'bg-panel' : ''
          }`}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-from to-primary-to flex items-center justify-center text-white font-bold text-lg">
              {contact.name.charAt(0).toUpperCase()}
            </div>
            {contact.isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-accent-green border-2 border-bg-dark rounded-full" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text white truncate">
              {contact.name}
              {contact.role === 'teacher' && (
                <span className="ml-2 text-xs bg-blue-500/20 text-blue-200 px-2 py-0.5 rounded-full border border-blue-500/40">
                  Teacher
                </span>
              )}
            </p>
            {contact.subject && <p className="text-xs text-muted-ink">{contact.subject}</p>}
            <p className="text-xs text-muted-ink mt-1">
              {contact.isOnline
                ? 'Online now'
                : contact.lastSeen
                  ? `Last seen ${new Date(contact.lastSeen).toLocaleString()}`
                  : 'Last seen recently'}
            </p>
          </div>
        </div>
      </button>
    ));
  };

  const renderMessages = () => {
    if (!selectedContact) {
      return (
        <div className="flex-1 flex items-center justify-center text-muted-ink">
          <div className="text-center">
            <p className="text-6xl mb-4">💬</p>
            <p className="text-xl font-semibold">Select a contact to start chatting</p>
            <p className="text-sm mt-2">Connect with classmates and teachers</p>
          </div>
        </div>
      );
    }

    if (messagesLoading) {
      return (
        <div className="flex-1 flex items-center justify-center text-muted-ink">
          <p>Loading conversation...</p>
        </div>
      );
    }

    if (messagesError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <p className="text-body text-red-200 mb-4">{messagesError}</p>
          <button
            type="button"
            onClick={() => void loadConversation(selectedContact.id)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-from to-primary-to text-white shadow-card"
          >
            Retry
          </button>
        </div>
      );
    }

    if (messages.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center text-muted-ink">
          <div className="text-center">
            <p className="text-4xl mb-2">👋</p>
            <p>Start a conversation with {currentContactName}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isSent = msg.senderId === currentUserId;
          const isPending = isSent && msg.id === sendingMessageId;
          return (
            <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-card border ${isSent
                    ? 'bg-gradient-to-r from-primary-from to-primary-to text-white border-primary-to/40'
                    : 'bg-panel text-white border-card-border'
                  } ${isPending ? 'opacity-70' : ''}`}
              >
                <p className="break-words text-body-sm">{msg.message}</p>
                <p className={`text-micro mt-1 ${isSent ? 'text-white/70' : 'text-muted-ink'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {isSent && msg.read && ' • Read'}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-200px)] bg-bg-dark rounded-3xl shadow-card border border-card-border overflow-hidden">
      {/* Contacts Sidebar */}
      <div className="w-80 border-r border-white/10 flex flex-col bg-slate-900/50 backdrop-blur-xl">
        {/* Search */}
        <div className="p-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="text-2xl">💬</span> Messages
          </h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search classmates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all outline-none text-sm"
            />
            <svg className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {renderContactList()}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-panel">
        {selectedContact && (
          <div className="p-4 border-b border-card-border bg-panel flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-from to-primary-to flex items-center justify-center text-white font-bold">
              {selectedContact.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-white">
                {selectedContact.name}
                {selectedContact.role === 'teacher' && (
                  <span className="ml-2 text-xs bg-blue-500/20 text-blue-200 px-2 py-0.5 rounded-full border border-blue-500/40">
                    Teacher
                  </span>
                )}
              </p>
              {selectedContact.isOnline ? (
                <p className="text-xs text-accent-green">● Online</p>
              ) : (
                <p className="text-xs text-muted-ink">
                  Last seen:{' '}
                  {selectedContact.lastSeen
                    ? new Date(selectedContact.lastSeen).toLocaleString()
                    : 'Recently'}
                </p>
              )}
            </div>
          </div>
        )}

        {renderMessages()}

        {selectedContact && (
          <div className="p-4 border-t border-card-border bg-panel">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={`Message ${currentContactName}`}
                className="flex-1 px-4 py-3 bg-panel-elevated border border-card-border rounded-2xl text-white placeholder-muted-ink focus:ring-2 focus:ring-discrete-highlight"
              />
              <button
                onClick={() => void handleSend()}
                disabled={!newMessage.trim()}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-primary-from to-primary-to text-white font-semibold shadow-card disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
