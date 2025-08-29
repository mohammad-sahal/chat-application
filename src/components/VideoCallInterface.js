import React, { useRef, useEffect, useState } from 'react';

const VideoCallInterface = ({
  incomingCall,
  activeCall,
  localStream,
  remoteStream,
  isCallActive,
  isConnecting,
  callDuration,
  isMuted,
  isVideoOff,
  onAccept,
  onDecline,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  formatDuration
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      setConnectionStatus('connected');
    }
  }, [remoteStream]);

  useEffect(() => {
    if (isConnecting) {
      setConnectionStatus('connecting');
      setError(null);
    } else if (isCallActive) {
      setConnectionStatus('connected');
      setError(null);
    }
  }, [isConnecting, isCallActive]);

  const handleAccept = async () => {
    try {
      setConnectionStatus('connecting');
      setError(null);
      await onAccept();
    } catch (err) {
      setError('Failed to accept call. Please try again.');
      setConnectionStatus('error');
    }
  };

  const handleDecline = () => {
    setConnectionStatus('idle');
    setError(null);
    onDecline();
  };

  const handleEndCall = () => {
    setConnectionStatus('idle');
    setError(null);
    onEndCall();
  };

  // Keyboard shortcuts for call controls
  useEffect(() => {
    const handleCallKeyDown = (event) => {
      if (!isCallActive && !incomingCall) return;
      
      // M key to toggle mute
      if (event.key.toLowerCase() === 'm' && isCallActive) {
        event.preventDefault();
        onToggleMute();
      }
      // V key to toggle video (only for video calls)
      if (event.key.toLowerCase() === 'v' && isCallActive && activeCall?.callType === 'video') {
        event.preventDefault();
        onToggleVideo();
      }
      // End call with Ctrl+End or Escape
      if ((event.ctrlKey && event.key === 'End') || event.key === 'Escape') {
        event.preventDefault();
        if (isCallActive) {
          handleEndCall();
        } else if (incomingCall) {
          handleDecline();
        }
      }
      // Accept call with Enter
      if (event.key === 'Enter' && incomingCall && !isCallActive) {
        event.preventDefault();
        handleAccept();
      }
    };

    document.addEventListener('keydown', handleCallKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleCallKeyDown);
    };
  }, [isCallActive, incomingCall, activeCall, onToggleMute, onToggleVideo, handleEndCall, handleDecline, handleAccept]);

  // Incoming call screen
  if (incomingCall && !isCallActive) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            {/* Call Icon */}
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse">
                <span className="text-white text-4xl">
                  {incomingCall.callType === 'video' ? '📹' : '📞'}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Incoming {incomingCall.callType === 'video' ? 'Video' : 'Voice'} Call
              </h2>
              <p className="text-gray-600 text-lg">{incomingCall.name}</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            {/* Call Actions */}
            <div className="flex space-x-4">
              <button
                onClick={handleAccept}
                disabled={isConnecting || connectionStatus === 'connecting'}
                className="flex-1 bg-green-500 text-white py-4 px-6 rounded-2xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-lg flex items-center justify-center transform hover:scale-105 active:scale-95"
                title="Accept call (Enter)"
              >
                {isConnecting || connectionStatus === 'connecting' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Accept
                  </>
                )}
              </button>
              <button
                onClick={handleDecline}
                disabled={isConnecting || connectionStatus === 'connecting'}
                className="flex-1 bg-red-500 text-white py-4 px-6 rounded-2xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-lg flex items-center justify-center transform hover:scale-105 active:scale-95"
                title="Decline call (Esc)"
              >
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Decline
              </button>
            </div>
            
            {/* Keyboard Shortcuts Info */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Enter</kbd> to accept or <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Esc</kbd> to decline
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active call screen
  if (isCallActive && activeCall) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
        <div className="relative w-full h-full max-w-6xl max-h-[95vh] bg-gray-900 rounded-3xl overflow-hidden">
          {/* Connection Status Overlay */}
          {connectionStatus === 'connecting' && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10">
              <div className="text-center text-white">
                <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
                  <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Connecting...</h3>
                <p className="text-gray-300">Establishing connection with {activeCall.username}</p>
              </div>
            </div>
          )}

          {/* Error Overlay */}
          {connectionStatus === 'error' && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10">
              <div className="text-center text-white bg-red-600 p-6 rounded-2xl max-w-md mx-4">
                <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Connection Failed</h3>
                <p className="text-red-100 mb-4">{error || 'Unable to establish connection. Please try again.'}</p>
                <button
                  onClick={handleEndCall}
                  className="bg-white text-red-600 px-6 py-2 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                >
                  End Call
                </button>
              </div>
            </div>
          )}

          {/* Remote Video */}
          {activeCall.callType === 'video' && (
            <div className="w-full h-full">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {!remoteStream && connectionStatus === 'connected' && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-400">Camera not available</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Call Info Overlay */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
            <div className="bg-black bg-opacity-50 backdrop-blur-sm text-white px-6 py-3 rounded-2xl">
              <p className="font-semibold text-lg">{activeCall.username}</p>
              <p className="text-sm opacity-90">
                {connectionStatus === 'connecting' ? 'Connecting...' : 
                 callDuration > 0 ? formatDuration(callDuration) : 'Connected'}
              </p>
            </div>
            
            {activeCall.callType === 'video' && (
              <div className="w-40 h-28 bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border-2 border-white">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {isVideoOff && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white text-2xl">📹❌</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Call Controls */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center space-y-4">
            {/* Call Duration Display */}
            <div className="bg-black bg-opacity-50 backdrop-blur-sm text-white px-4 py-2 rounded-full">
              <p className="text-sm font-medium">
                {connectionStatus === 'connecting' ? 'Connecting...' : 
                 callDuration > 0 ? formatDuration(callDuration) : 'Connected'}
              </p>
            </div>
            
            {/* Control Buttons */}
            <div className="flex space-x-4">
              {/* Mute Button */}
              <button
                onClick={onToggleMute}
                disabled={connectionStatus === 'connecting'}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-700'
                }`}
                title={`${isMuted ? 'Unmute' : 'Mute'} (M)`}
              >
                {isMuted ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>

              {/* Video Toggle Button (only for video calls) */}
              {activeCall.callType === 'video' && (
                <button
                  onClick={onToggleVideo}
                  disabled={connectionStatus === 'connecting'}
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                    isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                  title={`${isVideoOff ? 'Turn on camera' : 'Turn off camera'} (V)`}
                >
                  {isVideoOff ? (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              )}

              {/* End Call Button */}
              <button
                onClick={handleEndCall}
                disabled={connectionStatus === 'connecting'}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                title="End call (Esc)"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Voice Call Interface */}
          {activeCall.callType === 'voice' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-8 flex items-center justify-center animate-pulse">
                  <span className="text-white text-5xl">📞</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">{activeCall.username}</h3>
                <p className="text-lg opacity-90">
                  {connectionStatus === 'connecting' ? 'Connecting...' : 
                   callDuration > 0 ? formatDuration(callDuration) : 'Connected'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default VideoCallInterface;
