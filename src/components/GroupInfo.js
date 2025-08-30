import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getGroupEndpoint, getGroupMemberEndpoint } from '../config/api';

const GroupInfo = ({ group, onClose, onGroupUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(group.name);
  const [groupAvatar, setGroupAvatar] = useState(group.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(group.avatar || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const isAdmin = group.admin._id === user.id;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setAvatarFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
        setGroupAvatar(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setGroupAvatar('');
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(getGroupEndpoint(group._id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: groupName.trim(),
          avatar: groupAvatar
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update group');
      }

      onGroupUpdated(data);
      setIsEditing(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!isAdmin) return;

    try {
      const response = await fetch(getGroupMemberEndpoint(group._id, memberId), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove member');
      }

      // Refresh group data
      const updatedGroup = await fetch(getGroupEndpoint(group._id), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).then(res => res.json());

      onGroupUpdated(updatedGroup);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Group Information</h2>
              <p className="text-green-100 mt-1">Manage your group settings and members</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-green-200 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-r-lg mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Group Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <img
                src={group.avatar || `https://ui-avatars.com/api/?name=${group.name}&background=random`}
                alt={group.name}
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg"
              />
              {isAdmin && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="absolute bottom-2 right-2 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-all shadow-lg"
                  title="Edit Group"
                >
                  ✏️
                </button>
              )}
            </div>
            
            {isEditing ? (
              <form onSubmit={handleUpdateGroup} className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">Group Name</label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Group name"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">Group Picture (Optional)</label>
                  
                  <input
                    id="group-info-avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  {!avatarPreview ? (
                    <label 
                      htmlFor="group-info-avatar-upload" 
                      className="cursor-pointer block w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200"
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Upload group photo</p>
                          <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                        </div>
                      </div>
                    </label>
                  ) : (
                    <div className="relative">
                      <div className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg bg-gray-50">
                        <img 
                          src={avatarPreview} 
                          alt="Group avatar preview" 
                          className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Group picture</p>
                          <p className="text-xs text-gray-500">{avatarFile?.name || 'Current photo'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                          title="Remove image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <label 
                        htmlFor="group-info-avatar-upload" 
                        className="cursor-pointer block w-full text-center mt-2 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Change photo
                      </label>
                    </div>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-all font-medium"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{group.name}</h3>
                <div className="flex items-center justify-center space-x-4 text-gray-600">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                    {group.members.length} members
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    Created {new Date(group.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Group Details */}
          <div className="space-y-6">
            {/* Admin Section */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  👑
                </span>
                Group Admin
              </h4>
              <div className="flex items-center p-4 bg-white rounded-lg shadow-sm">
                <img
                  src={group.admin.avatar || `https://ui-avatars.com/api/?name=${group.admin.username}&background=random`}
                  alt={group.admin.username}
                  className="w-12 h-12 rounded-full mr-4 object-cover"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{group.admin.username}</p>
                  <p className="text-sm text-gray-500">Group Administrator</p>
                </div>
                <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-medium">
                  Admin
                </span>
              </div>
            </div>

            {/* Members Section */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  👥
                </span>
                Group Members
                <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {group.members.length}
                </span>
              </h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {group.members.map((member) => (
                  <div key={member._id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <img
                        src={member.avatar || `https://ui-avatars.com/api/?name=${member.username}&background=random`}
                        alt={member.username}
                        className="w-10 h-10 rounded-full mr-4 object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{member.username}</p>
                        <div className="flex items-center mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            member.online 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            <span className={`w-2 h-2 rounded-full mr-1 ${
                              member.online ? 'bg-green-400' : 'bg-gray-400'
                            }`}></span>
                            {member.online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isAdmin && member._id !== group.admin._id && (
                      <button
                        onClick={() => handleRemoveMember(member._id)}
                        className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-all"
                        title="Remove member"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupInfo;
