import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import EmojiPicker from './EmojiPicker';
import VoiceRecorder from './VoiceRecorder';
import API_BASE_URL from '../config/api';

const ChatArea = ({ socket, chat, chatType, onInitiateCall, onBackToSidebar, isMobileView = false }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isUserTyping, setIsUserTyping] = useState(false); // Current user typing state
  const [typingUsers, setTypingUsers] = useState(new Map()); // Other users typing: Map(senderId -> {name, timestamp})
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const voiceButtonRef = useRef(null);
  const { user } = useAuth();

  // Close pickers when clicking outside and keyboard shortcuts
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker || showVoiceRecorder) {
        const target = event.target;
        if (!target.closest('.emoji-picker') && !target.closest('.voice-recorder') && 
            !target.closest('.emoji-btn') && !target.closest('.voice-btn')) {
          setShowEmojiPicker(false);
          setShowVoiceRecorder(false);
        }
      }
    };

    const handleKeyDown = (event) => {
      // Ctrl+E to open emoji picker
      if (event.ctrlKey && event.key === 'e') {
        event.preventDefault();
        setShowEmojiPicker(!showEmojiPicker);
        setShowVoiceRecorder(false);
      }
      // Escape to close pickers
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

  useEffect(() => {
    // Fetch message history
    const fetchMessages = async () => {
      if (!chat) return;
      
      try {
        setLoading(true);
        setError(null);
        
        let endpoint = '';
        if (chatType === 'user') {
          endpoint = `${API_BASE_URL}/api/messages/private/${chat._id}`;
        } else {
          endpoint = `${API_BASE_URL}/api/messages/group/${chat._id}`;
        }
        
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Unauthorized access');
          }
          throw new Error('Failed to fetch messages');
        }
        
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError(error.message === 'Unauthorized access' ? 'Please log in again' : 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Listen for new messages
    if (socket) {
      const messageHandler = (message) => {
        setMessages(prev => [...prev, message]);
      };

      socket.on('private message', messageHandler);
      socket.on('group message', messageHandler);

      // Listen for typing events
      socket.on('typing', (data) => {
        // Only process typing events for the current chat
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
      });

      socket.on('stop typing', (data) => {
        // Only process stop typing events for the current chat
        const isCurrentChat = (chatType === 'user' && data.chatId === chat._id) || 
                             (chatType === 'group' && data.chatId === chat._id);
        
        if (isCurrentChat && data.senderId !== user.id) {
          setTypingUsers(prev => {
            const newMap = new Map(prev);
            newMap.delete(data.senderId);
            return newMap;
          });
        }
      });

      return () => {
        socket.off('private message', messageHandler);
        socket.off('group message', messageHandler);
        socket.off('typing');
        socket.off('stop typing');
      };
    }
  }, [socket, chat, chatType]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup timeout on unmount and reset typing state when chat changes
  useEffect(() => {
    // Reset typing users when chat changes
    setTypingUsers(new Map());
    setIsUserTyping(false);
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chat?._id]);

  // Clean up stale typing indicators every 3 seconds
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => {
        const newMap = new Map();
        for (const [userId, userData] of prev.entries()) {
          // Remove typing indicators older than 3 seconds
          if (now - userData.timestamp < 3000) {
            newMap.set(userId, userData);
          }
        }
        return newMap;
      });
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    if (chatType === 'user') {
      socket.emit('private message', {
        senderId: user.id,
        receiverId: chat._id,
        content: newMessage.trim()
      });
    } else {
      socket.emit('group message', {
        senderId: user.id,
        groupId: chat._id,
        content: newMessage.trim()
      });
    }

    setNewMessage('');
    setShowEmojiPicker(false);
    setShowVoiceRecorder(false);
    
    // Stop typing indicator when sending message
    stopTyping();
  };

  const handleTyping = () => {
    // Only emit typing event if user wasn't already typing
    if (!isUserTyping) {
      setIsUserTyping(true);
      if (chatType === 'user') {
        socket.emit('typing', { 
          senderId: user.id, 
          receiverId: chat._id 
        });
      } else {
        socket.emit('typing', { 
          senderId: user.id, 
          groupId: chat._id 
        });
      }
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  const stopTyping = () => {
    if (isUserTyping) {
      setIsUserTyping(false);
      if (chatType === 'user') {
        socket.emit('stop typing', { 
          senderId: user.id, 
          receiverId: chat._id 
        });
      } else {
        socket.emit('stop typing', { 
          senderId: user.id, 
          groupId: chat._id 
        });
      }
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji);
    // Don't close the picker immediately to allow multiple emoji selection
  };

  const handleVoiceMessage = (audioBlob) => {
    // Convert blob to base64 for sending
    const reader = new FileReader();
    reader.onload = () => {
      const base64Audio = reader.result;
      
      if (chatType === 'user') {
        socket.emit('private message', {
          senderId: user.id,
          receiverId: chat._id,
          content: base64Audio,
          type: 'voice'
        });
      } else {
        socket.emit('group message', {
          senderId: user.id,
          groupId: chat._id,
          content: base64Audio,
          type: 'voice'
        });
      }
      
      // Close the voice recorder after sending
      setShowVoiceRecorder(false);
    };
    reader.readAsDataURL(audioBlob);
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat header */}
      <div className="p-3 sm:p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {/* Back button for mobile */}
            {isMobileView && onBackToSidebar && (
              <button
                onClick={onBackToSidebar}
                className="mr-3 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
                title="Back to chats"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <img 
              src={chat.avatar || `https://ui-avatars.com/api/?name=${chat.username || chat.name}&background=random`} 
              alt={chat.username || chat.name} 
              className="w-10 h-10 rounded-full"
            />
            <div className="ml-3">
              <p className="font-semibold">{chat.username || chat.name}</p>
              {chatType === 'user' ? (
                <p className="text-xs text-gray-500">{chat.online ? 'Online' : 'Offline'}</p>
              ) : (
                <p className="text-xs text-gray-500">{chat.members.length} members</p>
              )}
            </div>
          </div>
          
          {/* Call Buttons - Only show for user chats */}
          {chatType === 'user' && onInitiateCall && (
            <div className="flex space-x-2">
              <button
                onClick={() => onInitiateCall(chat._id, chat.username, 'voice')}
                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full transition-all"
                title="Voice Call"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
              <button
                onClick={() => onInitiateCall(chat._id, chat.username, 'video')}
                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-all"
                title="Video Call"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-50">
        {loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading messages...</p>
          </div>
        )}
        {error && (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
            {error === 'Please log in again' && (
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Retry
              </button>
            )}
          </div>
        )}
        {!loading && !error && messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No messages yet</p>
            <p className="text-gray-400 text-xs mt-1">Start the conversation!</p>
          </div>
        )}
        {!loading && !error && messages.map((message, index) => (
          <div 
            key={index} 
            className={`flex mb-4 ${message.sender._id === user.id ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-lg ${message.sender._id === user.id ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
            >
              {message.type === 'voice' ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-3 px-3 sm:px-4 py-3 bg-white rounded-xl shadow-sm border border-gray-100 min-w-32 sm:min-w-48">
                    <button
                      onClick={() => {
                        const audio = new Audio(message.content);
                        audio.play();
                      }}
                      className="flex items-center justify-center w-10 h-10 bg-blue-100 hover:bg-blue-200 rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95"
                    >
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Voice Message</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className="w-1 h-3 bg-gray-300 rounded-full"
                              style={{
                                height: `${Math.random() * 8 + 4}px`
                              }}
                            ></div>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">0:15</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p>{message.content}</p>
              )}
              <p className={`text-xs mt-1 ${message.sender._id === user.id ? 'text-blue-100' : 'text-gray-500'}`}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="p-3 sm:p-4 bg-white border-t border-gray-200 relative">
        {/* Typing indicator above input */}
        {typingUsers.size > 0 && (
          <div className="absolute bottom-full left-4 mb-2 z-20">
            <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <p className="text-gray-800 font-medium text-xs">
                  {(() => {
                    const typingNames = Array.from(typingUsers.values()).map(u => u.name);
                    if (chatType === 'user') {
                      return `${chat.username || chat.name} is typing...`;
                    } else {
                      // Group chat - show multiple users
                      if (typingNames.length === 1) {
                        return `${typingNames[0]} is typing...`;
                      } else if (typingNames.length === 2) {
                        return `${typingNames[0]} and ${typingNames[1]} are typing...`;
                      } else {
                        return `${typingNames[0]} and ${typingNames.length - 1} others are typing...`;
                      }
                    }
                  })()}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2 bg-gray-50 rounded-2xl p-2 shadow-sm border border-gray-200">
          {/* Voice Message Button */}
          <button
            ref={voiceButtonRef}
            type="button"
            onClick={() => {
              setShowVoiceRecorder(!showVoiceRecorder);
              setShowEmojiPicker(false);
            }}
            className="voice-btn p-2 sm:p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 flex-shrink-0"
            title="Voice Message"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              if (e.target.value.trim() !== '') {
                handleTyping();
              } else {
                stopTyping();
              }
            }}
            onBlur={stopTyping}
            onFocus={() => {
              // Start typing if there's text in the input
              if (newMessage.trim() !== '') {
                handleTyping();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none outline-none px-2 sm:px-3 py-2 text-gray-700 placeholder-gray-500 focus:ring-0 text-sm sm:text-base"
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
            className="emoji-btn p-2 sm:p-3 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all duration-200 flex-shrink-0"
            title="Emoji (Ctrl+E)"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 5 5 0 00-7.072 0 1 1 0 000 1.415z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!newMessage.trim() || loading}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-2 sm:p-3 rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>

        {/* Voice Recorder */}
        {showVoiceRecorder && (
          <div className="absolute bottom-full left-0 mb-2 z-10">
            <VoiceRecorder
              onVoiceMessage={handleVoiceMessage}
              onClose={() => setShowVoiceRecorder(false)}
            />
          </div>
        )}

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-full right-0 mb-2 z-10">
            <EmojiPicker
              onEmojiSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatArea;
