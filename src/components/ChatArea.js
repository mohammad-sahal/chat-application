import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import EmojiPicker from './EmojiPicker';
import VoiceRecorder from './VoiceRecorder';
import API_BASE_URL from '../config/api';

// Separate components for better organization
const ChatHeader = ({ chat, chatType, onInitiateCall, onBackToSidebar, isMobileView }) => (
  <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
        {isMobileView && (
          <button
            onClick={onBackToSidebar}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Back to chat list"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="relative flex-shrink-0">
            <img
              src={chat.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.username || chat.name)}&background=6366f1&color=ffffff`}
              alt={chat.username || chat.name}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
            />
            {chat.online && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white"></div>
            )}
          </div>
          
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
              {chat.username || chat.name}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              {chatType === 'group' ? `${chat.members?.length || 0} members` : 
               chat.online ? 'Online' : 'Last seen recently'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
        <button
          onClick={() => onInitiateCall('voice')}
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          aria-label="Voice call"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </button>
        
        <button
          onClick={() => onInitiateCall('video')}
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          aria-label="Video call"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        
        <button
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="More options"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
);

const MessageSkeleton = () => (
  <div className="animate-pulse space-y-4 p-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
        <div className="flex space-x-3 max-w-xs">
          {i % 2 !== 0 && <div className="w-8 h-8 bg-gray-300 rounded-full"></div>}
          <div className="flex-1">
            <div className="bg-gray-300 h-4 rounded mb-2"></div>
            <div className="bg-gray-300 h-4 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const Message = React.memo(({ message, isOwn, showAvatar, user }) => {
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex items-end space-x-2 group ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {!isOwn && showAvatar && (
        <img
          src={message.sender.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender.username)}&background=random&size=32`}
          alt={message.sender.username}
          className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0"
        />
      )}
      {!isOwn && !showAvatar && <div className="w-6 sm:w-8 flex-shrink-0"></div>}
      
      <div className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl relative ${isOwn ? 'order-first' : ''}`}>
        <div
          className={`px-3 sm:px-4 py-2 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
            isOwn
              ? 'bg-blue-600 text-white rounded-br-md'
              : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
          }`}
        >
          {message.type === 'text' && (
            <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}
          
          {message.type === 'voice' && (
            <div className="flex items-center space-x-3">
              <button className={`p-2 rounded-full ${isOwn ? 'bg-blue-500' : 'bg-gray-200'}`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
              <div className="flex-1">
                <div className="flex items-center space-x-1">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-0.5 rounded-full ${isOwn ? 'bg-blue-300' : 'bg-gray-400'}`}
                      style={{ height: `${Math.random() * 20 + 8}px` }}
                    ></div>
                  ))}
                </div>
              </div>
              <span className={`text-xs ${isOwn ? 'text-blue-200' : 'text-gray-500'}`}>
                0:{message.duration || '15'}
              </span>
            </div>
          )}
          
          {message.type === 'image' && (
            <div className="space-y-2">
              <img
                src={message.content}
                alt="Shared image"
                className="rounded-lg max-w-full h-auto"
              />
            </div>
          )}
        </div>
        
        <div className={`flex items-center space-x-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-gray-500">
            {formatTime(message.timestamp)}
          </span>
          {isOwn && (
            <div className="flex">
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

const TypingIndicator = ({ typingUsers, chatType, chat }) => {
  if (typingUsers.size === 0) return null;

  const typingNames = Array.from(typingUsers.values()).map(u => u.name);
  
  const getTypingText = () => {
    if (chatType === 'user') {
      return `${chat.username || chat.name} is typing...`;
    } else {
      if (typingNames.length === 1) {
        return `${typingNames[0]} is typing...`;
      } else if (typingNames.length === 2) {
        return `${typingNames[0]} and ${typingNames[1]} are typing...`;
      } else {
        return `${typingNames[0]} and ${typingNames.length - 1} others are typing...`;
      }
    }
  };

  return (
    <div className="flex items-center space-x-2 px-4 py-2">
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.1}s` }}
          ></div>
        ))}
      </div>
      <p className="text-sm text-gray-600">
        {getTypingText()}
      </p>
    </div>
  );
};

const MessageInput = ({ 
  newMessage, 
  setNewMessage, 
  onSendMessage, 
  onTyping,
  onStopTyping,
  loading,
  showEmojiPicker,
  setShowEmojiPicker,
  showVoiceRecorder,
  setShowVoiceRecorder,
  emojiButtonRef,
  voiceButtonRef 
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim() && !loading) {
      onSendMessage();
    }
  };

  return (
    <div className="flex-shrink-0 bg-white border-t border-gray-200 p-3 sm:p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-2 sm:space-x-3">
        {/* Voice Message Button */}
        <button
          ref={voiceButtonRef}
          type="button"
          onClick={() => {
            setShowVoiceRecorder(!showVoiceRecorder);
            setShowEmojiPicker(false);
          }}
          className="voice-btn p-2 sm:p-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 flex-shrink-0 group"
          title="Voice Message"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Input Container */}
        <div className="flex-1 relative">
          <div className="flex items-center bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                if (e.target.value.trim() !== '') {
                  onTyping();
                } else {
                  onStopTyping();
                }
              }}
              onBlur={onStopTyping}
              onFocus={() => {
                if (newMessage.trim() !== '') {
                  onTyping();
                }
              }}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-gray-700 placeholder-gray-500 text-sm sm:text-base"
              disabled={loading}
            />
            
            {/* Emoji Button */}
            <button
              ref={emojiButtonRef}
              type="button"
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowVoiceRecorder(false);
              }}
              className="emoji-btn p-2 sm:p-3 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all duration-200 flex-shrink-0 group"
              title="Emoji (Ctrl+E)"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!newMessage.trim() || loading}
          className={`p-3 rounded-xl transition-all duration-200 flex-shrink-0 group ${
            newMessage.trim() && !loading
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title="Send Message (Enter)"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className={`w-5 h-5 ${newMessage.trim() ? 'group-hover:scale-110' : ''} transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
};

const EmptyState = ({ chatType, chat }) => (
  <div className="flex-1 flex items-center justify-center p-8">
    <div className="text-center max-w-md mx-auto">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Start a conversation with {chat.username || chat.name}
      </h3>
      <p className="text-gray-500 text-sm">
        Send a message to begin chatting
      </p>
    </div>
  </div>
);

const ErrorState = ({ error, onRetry }) => (
  <div className="flex-1 flex items-center justify-center p-8">
    <div className="text-center max-w-md mx-auto">
      <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Something went wrong
      </h3>
      <p className="text-gray-500 text-sm mb-4">
        {error || 'Failed to load messages'}
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
);

const ChatArea = ({ socket, chat, chatType, onInitiateCall, onBackToSidebar, isMobileView = false }) => {
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
  const emojiButtonRef = useRef(null);
  const voiceButtonRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
  const { user } = useAuth();

  // Memoized values
  const hasMessages = useMemo(() => messages.length > 0, [messages.length]);
  const sortedMessages = useMemo(() => 
    [...messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)), 
    [messages]
  );

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, []);

  // Handle typing events
  const handleTyping = useCallback(() => {
    if (!isUserTyping && socket && chat) {
      setIsUserTyping(true);
      socket.emit('typing', {
        senderId: user.id,
        [chatType === 'user' ? 'receiverId' : 'groupId']: chat._id
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  }, [isUserTyping, socket, chat, chatType, user.id]);

  const handleStopTyping = useCallback(() => {
    if (isUserTyping && socket && chat) {
      setIsUserTyping(false);
      socket.emit('stop typing', {
        senderId: user.id,
        [chatType === 'user' ? 'receiverId' : 'groupId']: chat._id
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [isUserTyping, socket, chat, chatType, user.id]);

  // Handle sending messages
  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !socket || loading) return;

    const messageData = {
      senderId: user.id,
      content: newMessage.trim(),
      type: 'text',
      timestamp: new Date().toISOString(),
      [chatType === 'user' ? 'receiverId' : 'groupId']: chat._id
    };

    socket.emit(chatType === 'user' ? 'private message' : 'group message', messageData);
    setNewMessage('');
    handleStopTyping();
  }, [newMessage, socket, loading, user.id, chatType, chat._id, handleStopTyping]);

  // Handle emoji selection
  const handleEmojiSelect = useCallback((emoji) => {
    setNewMessage(prev => prev + emoji);
  }, []);

  // Handle voice message
  const handleVoiceMessage = useCallback((audioBlob) => {
    if (!socket || !chat) return;

    // Create a FormData object to send the audio file
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice-message.webm');
    formData.append('senderId', user.id);
    formData.append('type', 'voice');
    formData.append(chatType === 'user' ? 'receiverId' : 'groupId', chat._id);

    // For now, emit a voice message event through socket
    // TODO: Implement proper file upload to server
    const messageData = {
      senderId: user.id,
      content: 'Voice message',
      type: 'voice',
      duration: Math.floor(audioBlob.size / 1000), // Rough estimate
      timestamp: new Date().toISOString(),
      [chatType === 'user' ? 'receiverId' : 'groupId']: chat._id
    };

    socket.emit(chatType === 'user' ? 'private message' : 'group message', messageData);
  }, [socket, chat, chatType, user.id]);

  // Fetch messages when chat changes
  useEffect(() => {
    if (!chat) return;

    const fetchMessages = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const endpoint = chatType === 'user' 
          ? `${API_BASE_URL}/api/messages/private/${chat._id}`
          : `${API_BASE_URL}/api/messages/group/${chat._id}`;
          
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }

        const data = await response.json();
        setMessages(data || []);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [chat, chatType]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !chat) return;

    const handleNewMessage = (message) => {
      setMessages(prev => {
        // Prevent duplicate messages
        const exists = prev.find(m => m._id === message._id);
        if (exists) return prev;
        
        return [...prev, message];
      });
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

    socket.on('private message', handleNewMessage);
    socket.on('group message', handleNewMessage);
    socket.on('typing', handleTypingEvent);
    socket.on('stop typing', handleStopTypingEvent);

    return () => {
      socket.off('private message', handleNewMessage);
      socket.off('group message', handleNewMessage);
      socket.off('typing', handleTypingEvent);
      socket.off('stop typing', handleStopTypingEvent);
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

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Chat</h3>
          <p className="text-gray-500">Select a conversation to start messaging</p>
        </div>
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
          <MessageSkeleton />
        ) : error ? (
          <ErrorState 
            error={error} 
            onRetry={() => window.location.reload()} 
          />
        ) : !hasMessages ? (
          <EmptyState chatType={chatType} chat={chat} />
        ) : (
          <div className="p-4 space-y-4">
            {sortedMessages.map((message, index) => {
              const isOwn = message.sender._id === user.id || message.sender === user.id;
              const prevMessage = sortedMessages[index - 1];
              const showAvatar = !isOwn && (!prevMessage || 
                prevMessage.sender._id !== message.sender._id ||
                prevMessage.sender !== message.sender
              );

              return (
                <Message
                  key={message._id || message.tempId || index}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  user={user}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
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
        emojiButtonRef={emojiButtonRef}
        voiceButtonRef={voiceButtonRef}
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

export default ChatArea;