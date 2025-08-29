import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const CallInterface = ({ 
  incomingCall, 
  onAccept, 
  onDecline, 
  onEndCall, 
  callType = 'voice',
  remoteUser 
}) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const { user } = useAuth();

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

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getLocalStream = async () => {
    try {
      const constraints = {
        audio: true,
        video: callType === 'video'
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  };

  const createPeerConnection = () => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const pc = new RTCPeerConnection(configuration);
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to remote peer
        window.socket?.emit('ice candidate', {
          to: remoteUser.id,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  const handleAcceptCall = async () => {
    try {
      setIsConnecting(true);
      const stream = await getLocalStream();
      const pc = createPeerConnection();
      
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      onAccept(answer);
      setIsCallActive(true);
      setIsConnecting(false);
    } catch (error) {
      console.error('Error accepting call:', error);
      setIsConnecting(false);
    }
  };

  const handleDeclineCall = () => {
    onDecline();
  };

  const handleEndCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    setIsCallActive(false);
    setCallDuration(0);
    onEndCall();
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
    if (localStream && callType === 'video') {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // Handle incoming call
  if (incomingCall && !isCallActive) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl">
                  {callType === 'video' ? '📹' : '📞'}
                </span>
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Incoming {callType === 'video' ? 'Video' : 'Voice'} Call
              </h2>
              <p className="text-gray-600">{remoteUser?.username || 'Unknown'}</p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleAcceptCall}
                disabled={isConnecting}
                className="flex-1 bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {isConnecting ? 'Connecting...' : 'Accept'}
              </button>
              <button
                onClick={handleDeclineCall}
                className="flex-1 bg-red-500 text-white py-3 px-6 rounded-lg hover:bg-red-600"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active call interface
  if (isCallActive) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="relative w-full h-full max-w-4xl max-h-[90vh] bg-gray-900 rounded-lg overflow-hidden">
          {/* Remote Video */}
          {callType === 'video' && (
            <div className="w-full h-full">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Call Info Overlay */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
              <p className="font-medium">{remoteUser?.username || 'Unknown'}</p>
              <p className="text-sm">{formatDuration(callDuration)}</p>
            </div>
            
            {callType === 'video' && (
              <div className="w-32 h-24 bg-gray-800 rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Call Controls */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4">
            <button
              onClick={toggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isMuted ? 'bg-red-500' : 'bg-gray-600'
              } text-white hover:opacity-80`}
            >
              {isMuted ? '🔇' : '🎤'}
            </button>

            {callType === 'video' && (
              <button
                onClick={toggleVideo}
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isVideoOff ? 'bg-red-500' : 'bg-gray-600'
                } text-white hover:opacity-80`}
              >
                {isVideoOff ? '📹❌' : '📹'}
              </button>
            )}

            <button
              onClick={handleEndCall}
              className="w-12 h-12 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center"
            >
              📞
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CallInterface;

