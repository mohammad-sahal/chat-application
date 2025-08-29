import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useCallManager = (socket) => {
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callError, setCallError] = useState(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  const peerConnectionRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const connectionTimeoutRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!socket) {
      console.log('🔌 No socket available for call manager');
      return;
    }

    console.log('🎯 Setting up call manager socket listeners');

    // Listen for incoming calls
    socket.on('call user', (data) => {
      console.log('📞 Incoming call received:', data);
      setIncomingCall({
        from: data.from,
        name: data.name,
        signal: data.signal,
        callType: data.callType
      });
      setCallError(null);
      console.log('📞 Set incomingCall state');
    });

    // Listen for call answered
    socket.on('call answered', (signal) => {
      console.log('✅ Call answered signal received:', signal);
      if (peerConnectionRef.current) {
        peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal))
          .then(() => {
            console.log('✅ Remote description set successfully');
            setIsCallActive(true);
            setCallError(null);
            setConnectionAttempts(0);
          })
          .catch(error => {
            console.error('❌ Error setting remote description:', error);
            setCallError('Failed to establish connection. Please try again.');
          });
      } else {
        console.warn('⚠️ No peer connection available for call answered');
        setCallError('Connection lost. Please try again.');
      }
    });

    // Listen for call declined
    socket.on('call declined', () => {
      console.log('❌ Call declined');
      setIncomingCall(null);
      setActiveCall(null);
      setIsCallActive(false);
      setCallError(null);
      cleanupCall();
    });

    // Listen for call ended
    socket.on('call ended', () => {
      console.log('🔚 Call ended');
      setActiveCall(null);
      setIsCallActive(false);
      setCallError(null);
      cleanupCall();
    });

    // Listen for ICE candidates
    socket.on('ice candidate', (candidate) => {
      console.log('🧊 ICE candidate received:', candidate);
      if (peerConnectionRef.current) {
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
          .catch(error => {
            console.error('❌ Error adding ICE candidate:', error);
          });
      } else {
        console.warn('⚠️ No peer connection available for ICE candidate');
      }
    });

    return () => {
      console.log('🧹 Cleaning up call manager socket listeners');
      socket.off('call user');
      socket.off('call answered');
      socket.off('call declined');
      socket.off('call ended');
      socket.off('ice candidate');
    };
  }, [socket]);

  useEffect(() => {
    if (isCallActive) {
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isCallActive]);

  // Connection timeout handling
  useEffect(() => {
    if (isConnecting) {
      connectionTimeoutRef.current = setTimeout(() => {
        if (isConnecting && !isCallActive) {
          console.log('⏰ Connection timeout');
          setCallError('Connection timeout. Please try again.');
          setIsConnecting(false);
          cleanupCall();
        }
      }, 30000); // 30 second timeout
    }

    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, [isConnecting, isCallActive]);

  const createPeerConnection = () => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    };

    const pc = new RTCPeerConnection(configuration);
    
    pc.onicecandidate = (event) => {
      if (event.candidate && activeCall) {
        console.log('Sending ICE candidate:', event.candidate);
        socket.emit('ice candidate', {
          to: activeCall.userId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('Remote stream received:', event.streams[0]);
      setRemoteStream(event.streams[0]);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        setCallError('Connection lost. Please try again.');
        setIsConnecting(false);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'failed') {
        setCallError('Connection failed. Please try again.');
        setIsConnecting(false);
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  const getLocalStream = async (callType = 'voice') => {
    try {
      const constraints = {
        audio: true,
        video: callType === 'video'
      };
      
      console.log('Getting local stream with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      console.log('Local stream obtained:', stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      let errorMessage = 'Failed to access camera/microphone.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera/microphone access denied. Please allow access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera/microphone found. Please check your device.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera/microphone is already in use by another application.';
      }
      
      setCallError(errorMessage);
      throw error;
    }
  };

  const initiateCall = async (userId, username, callType = 'voice') => {
    try {
      console.log('Initiating call:', { userId, username, callType });
      setIsConnecting(true);
      setCallError(null);
      setConnectionAttempts(prev => prev + 1);
      
      const stream = await getLocalStream(callType);
      const pc = createPeerConnection();
      
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log('Sending call user event:', {
        userToCall: userId,
        signalData: offer,
        from: user.id,
        name: user.username,
        callType
      });

      socket.emit('call user', {
        userToCall: userId,
        signalData: offer,
        from: user.id,
        name: user.username,
        callType
      });

      setActiveCall({ userId, username, callType });
      console.log('Call initiated successfully');
    } catch (error) {
      console.error('Error initiating call:', error);
      setIsConnecting(false);
      cleanupCall();
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      console.log('Accepting call:', incomingCall);
      setIsConnecting(true);
      setCallError(null);
      setConnectionAttempts(prev => prev + 1);
      
      const stream = await getLocalStream(incomingCall.callType);
      const pc = createPeerConnection();
      
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      console.log('Setting remote description:', incomingCall.signal);
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      console.log('Sending answer call event:', {
        to: incomingCall.from,
        signal: answer
      });

      socket.emit('answer call', {
        to: incomingCall.from,
        signal: answer
      });

      setActiveCall({
        userId: incomingCall.from,
        username: incomingCall.name,
        callType: incomingCall.callType
      });
      setIncomingCall(null);
      console.log('Call accepted successfully');
    } catch (error) {
      console.error('Error accepting call:', error);
      setIsConnecting(false);
      setCallError('Failed to accept call. Please try again.');
      cleanupCall();
    }
  };

  const declineCall = () => {
    if (incomingCall) {
      console.log('Declining call to:', incomingCall.from);
      socket.emit('call declined', { to: incomingCall.from });
    }
    setIncomingCall(null);
    setCallError(null);
    cleanupCall();
  };

  const endCall = () => {
    if (activeCall) {
      console.log('Ending call to:', activeCall.userId);
      socket.emit('end call', { to: activeCall.userId });
    }
    setActiveCall(null);
    setIsCallActive(false);
    setCallError(null);
    cleanupCall();
  };

  const cleanupCall = () => {
    console.log('Cleaning up call');
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoOff(false);
    setIsConnecting(false);
    
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream && activeCall?.callType === 'video') {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    // State
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

    // Actions
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
    formatDuration
  };
};
