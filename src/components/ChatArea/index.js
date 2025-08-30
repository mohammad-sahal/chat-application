import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChatSocket } from '../../hooks/useChatSocket';
import { useMessageOperations } from '../../hooks/useMessageOperations';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';
import { EmojiPicker } from '../EmojiPicker';
import { VoiceRecorder } from '../VoiceRecorder';
import PropTypes from 'prop-types';

const ChatArea = ({ 
  socket, 
  chat, 
  chatType, 
  onInitiateCall, 
  onBackToSidebar, 
  isMobileView = false 
}) => {
  // State management
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Refs
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
  const { user } = useAuth();

  // Custom hooks for better organization
  const { 
    fetchMessages, 
    deleteMessage, 
    markAsRead 
  } = useMessageOperations(chat, chatType, socket, user);

  const {
    sendMessage,
    sendVoiceMessage,
    handleTyping,
    handleStopTyping
  } = useChatSocket(socket, chat, chatType, user, {
    setIsUserTyping,
    typingTimeoutRef
  });

  // Memoized values for performance
  const hasMessages = useMemo(() => messages.length > 0, [messages.length]);
  const sortedMessages = useMemo(() => 
    [...messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)), 
    [messages]
  );

  // Auto-scroll functionality
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, []);

  // Message handlers
  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || loading) return;
    
    sendMessage(newMessage.trim());
    setNewMessage('');
    handleStopTyping();
  }, [newMessage, loading, sendMessage, handleStopTyping]);

  const handleEmojiSelect = useCallback((emoji) => {
    setNewMessage(prev => prev + emoji);
  }, []);

  const handleVoiceMessage = useCallback((audioBlob) => {
    sendVoiceMessage(audioBlob);
    setShowVoiceRecorder(false);
  }, [sendVoiceMessage]);

  const handleDeleteMessage = useCallback(async (messageId) => {
    try {
      await deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  }, [deleteMessage]);

  const handleMarkAsRead = useCallback(async (messageId) => {
    try {
      await markAsRead(messageId);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, [markAsRead]);

  // Load messages when chat changes
  useEffect(() => {
    if (!chat) return;

    const loadMessages = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const fetchedMessages = await fetchMessages();
        setMessages(fetchedMessages);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [chat, fetchMessages]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !chat) return;

    const handleNewMessage = (message) => {
      setMessages(prev => {
        const exists = prev.find(m => m._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });
    };

    const handleMessageDeleted = (data) => {
      setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
    };

    const handleMessageRead = (data) => {
      setMessages(prev => prev.map(msg => {
        if (msg._id === data.messageId) {
          return {
            ...msg,
            readBy: [...(msg.readBy || []), data.userId]
              .filter((id, index, arr) => arr.indexOf(id) === index)
          };
        }
        return msg;
      }));
    };

    const handleTypingEvent = (data) => {
      const isCurrentChat = (chatType === 'user' && data.chatId === chat._id) || 
                           (chatType === 'group' && data.chatId === chat._id);
      
      if (isCurrentChat && data.senderId !== user.id) {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          newMap.set(data.senderId, {
            name: data.senderName,
            timestamp: Date.now()
          });
          return newMap;
        });
      }
    };

    const handleStopTypingEvent = (data) => {
      const isCurrentChat = (chatType === 'user' && data.chatId === chat._id) || 
                           (chatType === 'group' && data.chatId === chat._id);
      
      if (isCurrentChat && data.senderId !== user.id) {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          newMap.delete(data.senderId);
          return newMap;
        });
      }
    };

    // Event listeners
    const events = [
      ['private message', handleNewMessage],
      ['group message', handleNewMessage],
      ['message deleted', handleMessageDeleted],
      ['message read', handleMessageRead],
      ['typing', handleTypingEvent],
      ['stop typing', handleStopTypingEvent]
    ];

    events.forEach(([event, handler]) => socket.on(event, handler));

    return () => {
      events.forEach(([event, handler]) => socket.off(event, handler));
    };
  }, [socket, chat, chatType, user.id]);

  // Reset state when chat changes
  useEffect(() => {
    setTypingUsers(new Map());
    setIsUserTyping(false);
    setShowEmojiPicker(false);
    setShowVoiceRecorder(false);
    setNewMessage('');
    handleStopTyping();
  }, [chat?._id, handleStopTyping]);

  // Clean up stale typing indicators
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => {
        const newMap = new Map();
        for (const [userId, userData] of prev.entries()) {
          if (now - userData.timestamp < 3000) {
            newMap.set(userId, userData);
          }
        }
        return prev.size !== newMap.size ? newMap : prev;
      });
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, []);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker || showVoiceRecorder) {
        if (!event.target.closest('.emoji-picker') && 
            !event.target.closest('.voice-recorder') && 
            !event.target.closest('.emoji-btn') && 
            !event.target.closest('.voice-btn')) {
          setShowEmojiPicker(false);
          setShowVoiceRecorder(false);
        }
      }
    };

    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 'e') {
        event.preventDefault();
        setShowEmojiPicker(!showEmojiPicker);
        setShowVoiceRecorder(false);
      }
      if (event.key === 'Escape') {
        setShowEmojiPicker(false);
        setShowVoiceRecorder(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showEmojiPicker, showVoiceRecorder]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Early return for no chat selected
  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <EmptyState 
          title="Welcome to Chat"
          message="Select a conversation to start messaging"
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full relative">
      {/* Chat Header */}
      <ChatHeader 
        chat={chat}
        chatType={chatType}
        onInitiateCall={onInitiateCall}
        onBackToSidebar={onBackToSidebar}
        isMobileView={isMobileView}
      />

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-gray-50 relative"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23f9fafb' fill-opacity='0.03'%3E%3Cpath d='m0 40l40-40h-40v40zm40 0v-40h-40l40 40z'/%3E%3C/g%3E%3C/svg%3E")` 
        }}
      >
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState 
            error={error} 
            onRetry={() => window.location.reload()} 
          />
        ) : !hasMessages ? (
          <EmptyState 
            chatType={chatType} 
            chat={chat}
            title={`Start a conversation with ${chat.username || chat.name}`}
            message="Send a message to begin chatting"
          />
        ) : (
          <MessageList
            messages={sortedMessages}
            user={user}
            onDelete={handleDeleteMessage}
            onMarkAsRead={handleMarkAsRead}
            messagesEndRef={messagesEndRef}
          />
        )}

        {/* Typing Indicator */}
        <TypingIndicator 
          typingUsers={typingUsers}
          chatType={chatType}
          chat={chat}
        />
      </div>

      {/* Message Input */}
      <MessageInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
        loading={loading}
        showEmojiPicker={showEmojiPicker}
        setShowEmojiPicker={setShowEmojiPicker}
        showVoiceRecorder={showVoiceRecorder}
        setShowVoiceRecorder={setShowVoiceRecorder}
      />

      {/* Overlays */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 right-4 z-50">
          <EmojiPicker 
            onEmojiSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}

      {showVoiceRecorder && (
        <div className="absolute bottom-20 left-4 z-50">
          <VoiceRecorder 
            onVoiceMessage={handleVoiceMessage}
            onClose={() => setShowVoiceRecorder(false)}
          />
        </div>
      )}
    </div>
  );
};

ChatArea.propTypes = {
  socket: PropTypes.object,
  chat: PropTypes.object,
  chatType: PropTypes.oneOf(['user', 'group']),
  onInitiateCall: PropTypes.func.isRequired,
  onBackToSidebar: PropTypes.func,
  isMobileView: PropTypes.bool
};

export default ChatArea;