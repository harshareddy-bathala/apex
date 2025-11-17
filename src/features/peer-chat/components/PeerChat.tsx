import React, { useState, useRef, useEffect } from 'react';
import { ChatContact, PeerMessage, Conversation } from '@/types';

interface PeerChatProps {
  currentUserId: string;
  currentUserName: string;
  contacts: ChatContact[];
  conversations: Conversation[];
  messages: PeerMessage[];
  onSendMessage: (receiverId: string, message: string) => void;
}

export default function PeerChat({
  currentUserId,
  currentUserName: _currentUserName,
  contacts,
  conversations,
  messages,
  onSendMessage,
}: PeerChatProps) {
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedContact]);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (contact.subject && contact.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const currentMessages = selectedContact
    ? messages.filter(
        m =>
          (m.senderId === currentUserId && m.receiverId === selectedContact.id) ||
          (m.senderId === selectedContact.id && m.receiverId === currentUserId)
      ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : [];

  const handleSend = () => {
    if (!newMessage.trim() || !selectedContact) return;
    onSendMessage(selectedContact.id, newMessage.trim());
    setNewMessage('');
  };

  const getContactConversation = (contactId: string) => {
    return conversations.find(conv => conv.participants.includes(contactId));
  };

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Contacts Sidebar */}
      <div className="w-80 border-r flex flex-col">
        {/* Search */}
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900 mb-3">💬 Messages</h2>
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No contacts found</p>
            </div>
          ) : (
            filteredContacts.map(contact => {
              const conversation = getContactConversation(contact.id);
              return (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full p-4 border-b hover:bg-gray-50 transition-colors text-left ${
                    selectedContact?.id === contact.id ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      {contact.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 truncate">
                          {contact.name}
                          {contact.role === 'teacher' && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              Teacher
                            </span>
                          )}
                        </p>
                        {conversation?.unreadCount > 0 && (
                          <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      {contact.subject && (
                        <p className="text-xs text-gray-600">{contact.subject}</p>
                      )}
                      {conversation && (
                        <p className="text-sm text-gray-500 truncate mt-1">
                          {conversation.lastMessage}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                  {selectedContact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {selectedContact.name}
                    {selectedContact.role === 'teacher' && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        Teacher
                      </span>
                    )}
                  </p>
                  {selectedContact.isOnline ? (
                    <p className="text-xs text-green-600">● Online</p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Last seen: {selectedContact.lastSeen ? new Date(selectedContact.lastSeen).toLocaleString() : 'Unknown'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <p className="text-4xl mb-2">👋</p>
                    <p>Start a conversation with {selectedContact.name}</p>
                  </div>
                </div>
              ) : (
                currentMessages.map(msg => {
                  const isSent = msg.senderId === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          isSent
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="break-words">{msg.message}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isSent ? 'text-indigo-200' : 'text-gray-500'
                          }`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {isSent && msg.read && ' • Read'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-6xl mb-4">💬</p>
              <p className="text-xl font-semibold">Select a contact to start chatting</p>
              <p className="text-sm mt-2">Connect with classmates and teachers</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
