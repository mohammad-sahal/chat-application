import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserProfile from './UserProfile';
import UserSearch from './UserSearch';
import CreateGroup from './CreateGroup';
import GroupInfo from './GroupInfo';
import VideoCallInterface from './VideoCallInterface';
import { API_ENDPOINTS } from '../config/api';

const Sidebar = ({ 
  onSelectChat, 
  activeChat, 
  chatType, 
  socket,
  isMobileView = false,
  // Call management props
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
  initiateCall,
  acceptCall,
  declineCall,
  endCall,
  toggleMute,
  toggleVideo,
  formatDuration
}) => {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState('chats');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const { user, logout, loading: authLoading } = useAuth();

  // Loading skeleton component
  const LoadingSkeleton = ({ type = 'user' }) => (
    <div className="p-3 rounded-xl animate-pulse">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        {type === 'user' && (
          <div className="flex space-x-1">
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
          </div>
        )}
      </div>
    </div>
  );

  useEffect(() => {
    if (authLoading) return;

    // Fetch users and groups from API
    const fetchUsers = async () => {
      try {
        setError(null);
        const response = await fetch(API_ENDPOINTS.USERS, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            logout();
            return;
          }
          throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users. Please refresh the page.');
      }
    };

    const fetchGroups = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.GROUPS, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            logout();
            return;
          }
          throw new Error('Failed to fetch groups');
        }
        
        const data = await response.json();
        setGroups(data);
      } catch (error) {
        console.error('Error fetching groups:', error);
        setError('Failed to load groups. Please refresh the page.');
      }
    };

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchUsers(), fetchGroups()]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [logout, authLoading]);

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className={`${isMobileView ? 'w-full' : 'w-80'} bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200 flex flex-col h-full shadow-lg`}>
        <div className="p-6 bg-white border-b border-gray-200">
          <div className="animate-pulse">
            <div className="w-32 h-8 bg-gray-300 rounded mb-4"></div>
            <div className="w-48 h-6 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <LoadingSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isMobileView ? 'w-full' : 'w-80'} bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200 flex flex-col h-full shadow-lg`}>
      {/* Header */}
      <div className="p-4 sm:p-6 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              ChatApp
            </h1>
            <p className="text-xs text-gray-500">Real-time messaging</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'chats'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('chats')}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Chats</span>
            </div>
          </button>
          <button
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'groups'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('groups')}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Groups</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Error Message */}
        {error && (
          <div className="m-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Refresh page
            </button>
          </div>
        )}

        {activeTab === 'chats' ? (
          <div className="p-3 sm:p-4">
            {/* Action Buttons */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setShowUserSearch(true)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-xl text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add New Chat</span>
              </button>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <LoadingSkeleton key={i} type="user" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">No users found</p>
                <p className="text-gray-400 text-xs mt-1">Start a conversation</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map(userItem => (
                  <div 
                    key={userItem._id} 
                    className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                      activeChat && activeChat._id === userItem._id && chatType === 'user' 
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 shadow-sm' 
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                    onClick={() => onSelectChat(userItem, 'user')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img 
                          src={userItem.avatar || `https://ui-avatars.com/api/?name=${userItem.username}&background=random`} 
                          alt={userItem.username} 
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white shadow-sm"
                        />
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white shadow-sm ${
                          userItem.online ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">{userItem.username}</p>
                        <p className={`text-xs ${userItem.online ? 'text-green-600' : 'text-gray-500'}`}>
                          {userItem.online ? '● Online' : '○ Offline'}
                        </p>
                      </div>
                      
                      {/* Call Buttons */}
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            initiateCall(userItem._id, userItem.username, 'voice');
                          }}
                          disabled={isConnecting}
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Voice Call"
                        >
                          {isConnecting && activeCall?.userId === userItem._id ? (
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            initiateCall(userItem._id, userItem.username, 'video');
                          }}
                          disabled={isConnecting}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Video Call"
                        >
                          {isConnecting && activeCall?.userId === userItem._id ? (
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 sm:p-4">
            {/* Action Buttons */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setShowCreateGroup(true)}
                className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-2 px-4 rounded-xl text-sm font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create Group</span>
              </button>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <LoadingSkeleton key={i} type="group" />
                ))}
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">No groups found</p>
                <p className="text-gray-400 text-xs mt-1">Create your first group</p>
              </div>
            ) : (
              <div className="space-y-2">
                {groups.map(group => (
                  <div 
                    key={group._id} 
                    className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                      activeChat && activeChat._id === group._id && chatType === 'group' 
                        ? 'bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 shadow-sm' 
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                    onClick={() => onSelectChat(group, 'group')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img 
                          src={group.avatar || `https://ui-avatars.com/api/?name=${group.name}&background=random`} 
                          alt={group.name} 
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white shadow-sm"
                        />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-purple-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">{group.name}</p>
                        <p className="text-xs text-gray-500">{group.members.length} members</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowGroupInfo(true);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                        title="Group Info"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 sm:p-4 bg-white border-t border-gray-200">
        <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
              <div className="relative">
                <img 
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username}&background=random`} 
                  alt={user?.username} 
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white shadow-sm cursor-pointer"
                  onClick={() => setShowUserProfile(true)}
                  title="Click to edit profile"
                />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{user?.username}</p>
              <p className="text-xs text-green-600">● Online</p>
            </div>
          </div>
          <div className="flex space-x-1">
            <button 
              onClick={() => setShowUserProfile(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
              title="Edit Profile"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button 
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showUserProfile && (
        <UserProfile onClose={() => setShowUserProfile(false)} />
      )}

      {showUserSearch && (
        <UserSearch 
          onSelectUser={(selectedUser) => {
            onSelectChat(selectedUser, 'user');
            setShowUserSearch(false);
          }}
          onClose={() => setShowUserSearch(false)}
        />
      )}

      {showCreateGroup && (
        <CreateGroup 
          onGroupCreated={(newGroup) => {
            setGroups(prev => [...prev, newGroup]);
            setShowCreateGroup(false);
          }}
          onClose={() => setShowCreateGroup(false)}
        />
      )}

      {showGroupInfo && activeChat && chatType === 'group' && (
        <GroupInfo 
          group={activeChat}
          onClose={() => setShowGroupInfo(false)}
          onGroupUpdated={(updatedGroup) => {
            setGroups(prev => prev.map(g => g._id === updatedGroup._id ? updatedGroup : g));
            onSelectChat(updatedGroup, 'group');
          }}
        />
      )}

      {/* Video Call Interface */}
      {(incomingCall || isCallActive) && (
        <VideoCallInterface
          incomingCall={incomingCall}
          activeCall={activeCall}
          localStream={localStream}
          remoteStream={remoteStream}
          isCallActive={isCallActive}
          isConnecting={isConnecting}
          callDuration={callDuration}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          callError={callError}
          connectionAttempts={connectionAttempts}
          onAccept={acceptCall}
          onDecline={declineCall}
          onEndCall={endCall}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          formatDuration={formatDuration}
        />
      )}
      

    </div>
  );
};

export default Sidebar;
