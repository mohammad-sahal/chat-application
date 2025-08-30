import { useCallback } from 'react';

export const useChatSocket = (socket, chat, chatType, user, { setIsUserTyping, typingTimeoutRef }) => {
  
  const sendMessage = useCallback((content, type = 'text', additionalData = {}) => {
    if (!socket || !chat || !content.trim()) return;

    const messageData = {
      senderId: user.id,
      content: content.trim(),
      type,
      timestamp: new Date().toISOString(),
      [chatType === 'user' ? 'receiverId' : 'groupId']: chat._id,
      ...additionalData
    };

    socket.emit(chatType === 'user' ? 'private message' : 'group message', messageData);
  }, [socket, chat, chatType, user]);

  const sendVoiceMessage = useCallback(async (audioBlob) => {
    if (!socket || !chat || !audioBlob) return;

    try {
      // Convert blob to base64 for transmission
      const reader = new FileReader();
      reader.onload = () => {
        const base64Audio = reader.result.split(',')[1]; // Remove data:audio/webm;base64, prefix
        
        sendMessage(base64Audio, 'voice', {
          duration: Math.floor(audioBlob.size / 1000) // Rough estimate
        });
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error handling voice message:', error);
      throw error;
    }
  }, [sendMessage]);

  const handleTyping = useCallback(() => {
    if (!setIsUserTyping || !socket || !chat) return;

    setIsUserTyping(true);
    socket.emit('typing', {
      senderId: user.id,
      [chatType === 'user' ? 'receiverId' : 'groupId']: chat._id
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  }, [setIsUserTyping, socket, chat, chatType, user, typingTimeoutRef]);

  const handleStopTyping = useCallback(() => {
    if (!setIsUserTyping || !socket || !chat) return;

    setIsUserTyping(false);
    socket.emit('stop typing', {
      senderId: user.id,
      [chatType === 'user' ? 'receiverId' : 'groupId']: chat._id
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [setIsUserTyping, socket, chat, chatType, user, typingTimeoutRef]);

  return {
    sendMessage,
    sendVoiceMessage,
    handleTyping,
    handleStopTyping
  };
};