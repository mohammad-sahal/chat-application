import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';

const UserSearch = ({ onSelectUser, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`${API_ENDPOINTS.USER_SEARCH}?q=${encodeURIComponent(searchQuery)}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to search users');
        }

        const data = await response.json();
        setSearchResults(data);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelectUser = (user) => {
    onSelectUser(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Search Users</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        <div className="max-h-64 overflow-y-auto">
          {loading ? (
            <div className="text-center py-4 text-gray-500">
              Searching...
            </div>
          ) : searchQuery.trim().length < 2 ? (
            <div className="text-center py-4 text-gray-500">
              Type at least 2 characters to search
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No users found
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center p-3 hover:bg-gray-50 rounded-md cursor-pointer"
                  onClick={() => handleSelectUser(user)}
                >
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                    alt={user.username}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-gray-500">
                      {user.online ? '🟢 Online' : '⚫ Offline'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSearch;
