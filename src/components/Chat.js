import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import { useAuth } from '../contexts/AuthContext';
import { useCallManager } from '../hooks/useCallManager';
import io from 'socket.io-client';

const Chat = () => {
  const [socket, setSocket] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [chatType, setChatType] = useState(''); // 'user' or 'group'
  const [isMobileView, setIsMobileView] = useState(false);
  const { user } = useAuth();
  
  // Call management - get all state and functions
  const {
    incomingCall,
    activeCall,
    localStream,
    remoteStream,
    isCallActive,
    isConnecting,
    callDuration,
    isMuted,
    isVideoOff,
    callError,
    connectionAttempts,
    callState,
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
    formatDuration
  } = useCallManager(socket);

  // Check for mobile view
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  useEffect(() => {
    const newSocket = io('https://chat-app-3-ch2x.onrender.com', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
      console.log('🔗 Socket ID:', newSocket.id);
      // Join user's personal room
      if (user) {
        newSocket.emit('join', user.id);
        console.log('👤 Joined user room:', user.id);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO disconnected:', reason);
    });

    setSocket(newSocket);

    return () => {
      console.log('🧹 Closing socket connection');
      newSocket.close();
    };
  }, [user]);

  // Debug call state
  useEffect(() => {
    console.log('📊 Call State Debug:', {
      incomingCall: !!incomingCall,
      isCallActive,
      isConnecting,
      socketConnected: !!socket
    });
  }, [incomingCall, isCallActive, isConnecting, socket]);

  // Join/leave group rooms when active chat changes
  useEffect(() => {
    if (socket && activeChat && chatType === 'group') {
      socket.emit('join group', activeChat._id);
      
      return () => {
        socket.emit('leave group', activeChat._id);
      };
    }
  }, [socket, activeChat, chatType]);

  const handleSelectChat = (chat, type) => {
    setActiveChat(chat);
    setChatType(type);
  };

  const handleBackToSidebar = () => {
    setActiveChat(null);
    setChatType('');
  };

  // Mobile view: show only sidebar or only chat area
  if (isMobileView) {
    return (
      <div className="h-screen bg-white">
        {!activeChat ? (
          <Sidebar 
            onSelectChat={handleSelectChat} 
            activeChat={activeChat} 
            chatType={chatType}
            socket={socket}
            isMobileView={isMobileView}
            // Pass all call management props
            incomingCall={incomingCall}
            activeCall={activeCall}
            localStream={localStream}
            remoteStream={remoteStream}
            isCallActive={isCallActive}
            isConnecting={isConnecting}
            callDuration={callDuration}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            initiateCall={initiateCall}
            acceptCall={acceptCall}
            declineCall={declineCall}
            endCall={endCall}
            toggleMute={toggleMute}
            toggleVideo={toggleVideo}
            formatDuration={formatDuration}
            callError={callError}
            connectionAttempts={connectionAttempts}
            callState={callState}
          />
        ) : (
          <ChatArea 
            socket={socket} 
            chat={activeChat} 
            chatType={chatType}
            onInitiateCall={initiateCall}
            onBackToSidebar={handleBackToSidebar}
            isMobileView={isMobileView}
          />
        )}
      </div>
    );
  }

  // Desktop view: show sidebar and chat area side by side
  return (
    <div className="flex h-screen bg-white">
      <Sidebar 
        onSelectChat={handleSelectChat} 
        activeChat={activeChat} 
        chatType={chatType}
        socket={socket}
        isMobileView={isMobileView}
        // Pass all call management props
        incomingCall={incomingCall}
        activeCall={activeCall}
        localStream={localStream}
        remoteStream={remoteStream}
        isCallActive={isCallActive}
        isConnecting={isConnecting}
        callDuration={callDuration}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        initiateCall={initiateCall}
        acceptCall={acceptCall}
        declineCall={declineCall}
        endCall={endCall}
        toggleMute={toggleMute}
        toggleVideo={toggleVideo}
        formatDuration={formatDuration}
        callError={callError}
        connectionAttempts={connectionAttempts}
        callState={callState}
      />
      {activeChat ? (
        <ChatArea 
          socket={socket} 
          chat={activeChat} 
          chatType={chatType}
          onInitiateCall={initiateCall}
          isMobileView={isMobileView}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h2 className="text-2xl font-semibold text-gray-600 mb-2">Welcome to ChatApp</h2>
            <p className="text-gray-500">Select a conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
