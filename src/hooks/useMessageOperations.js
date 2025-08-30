import { useCallback } from 'react';
import API_BASE_URL from '../config/api';

export const useMessageOperations = (chat, chatType, socket, user) => {
  const fetchMessages = useCallback(async () => {
    if (!chat) return [];

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
    return data || [];
  }, [chat, chatType]);

  const deleteMessage = useCallback(async (messageId) => {
    if (!socket || !messageId) {
      throw new Error('Socket or messageId not available');
    }

    return new Promise((resolve, reject) => {
      socket.emit('delete message', { messageId, userId: user.id });
      
      // Set a timeout for the operation
      const timeout = setTimeout(() => {
        reject(new Error('Delete operation timed out'));
      }, 5000);

      // Listen for success/error responses
      const handleSuccess = () => {
        clearTimeout(timeout);
        socket.off('message deleted', handleSuccess);
        socket.off('error', handleError);
        resolve();
      };

      const handleError = (error) => {
        clearTimeout(timeout);
        socket.off('message deleted', handleSuccess);
        socket.off('error', handleError);
        reject(new Error(error.message || 'Failed to delete message'));
      };

      socket.once('message deleted', handleSuccess);
      socket.once('error', handleError);
    });
  }, [socket, user?.id]);

  const markAsRead = useCallback(async (messageId) => {
    if (!socket || !messageId || !chat) return;

    socket.emit('mark as read', { 
      messageId, 
      userId: user.id,
      chatId: chat._id,
      chatType 
    });
  }, [socket, user?.id, chat?._id, chatType]);

  return {
    fetchMessages,
    deleteMessage,
    markAsRead
  };
};