// API Configuration
const API_BASE_URL = 'https://chat-app-3-ch2x.onrender.com';

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  USERS: `${API_BASE_URL}/api/users`,
  GROUPS: `${API_BASE_URL}/api/groups`,
  USER_PROFILE: `${API_BASE_URL}/api/users/profile`,
  USER_SEARCH: `${API_BASE_URL}/api/users/search`,
  MESSAGES: `${API_BASE_URL}/api/messages`,
};

// Helper function to get group-specific endpoints
export const getGroupEndpoint = (groupId) => `${API_BASE_URL}/api/groups/${groupId}`;
export const getGroupMemberEndpoint = (groupId, memberId) => `${API_BASE_URL}/api/groups/${groupId}/members/${memberId}`;

export default API_BASE_URL;
