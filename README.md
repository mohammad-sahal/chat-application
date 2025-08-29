# ChatApp Frontend

A React-based frontend for the real-time chat application with Socket.IO client integration.

## Features

- **Modern UI** with Tailwind CSS
- **Real-time messaging** using Socket.IO client
- **User authentication** (login/register)
- **Private messaging** between users
- **Group messaging** support
- **Typing indicators**
- **Online/offline status**
- **Responsive design**
- **Message history**

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend server running (see server README)

## Installation

1. Navigate to the frontend directory:
   ```bash
   cd frondend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The application will open in your browser at `http://localhost:3000`

## Project Structure

```
src/
├── components/
│   ├── Login.js          # Login form component
│   ├── Register.js       # Registration form component
│   ├── Chat.js           # Main chat container
│   ├── Sidebar.js        # Users and groups sidebar
│   └── ChatArea.js       # Message display and input
├── contexts/
│   └── AuthContext.js    # Authentication context
├── App.js                # Main app component with routing
├── index.js              # App entry point
└── index.css             # Global styles with Tailwind
```

## Components

### Login Component
- Username and password authentication
- Error handling and loading states
- Redirect to registration page

### Register Component
- User registration with password confirmation
- Optional avatar URL input
- Form validation

### Chat Component
- Main chat interface container
- Socket.IO connection management
- Chat selection handling

### Sidebar Component
- User and group lists
- Online status indicators
- Tab switching between chats and groups
- User profile and logout

### ChatArea Component
- Real-time message display
- Message input with typing indicators
- Auto-scroll to latest messages
- Message timestamps

## Authentication Context

The `AuthContext` provides:
- User state management
- Login/logout functions
- Registration function
- Token storage in localStorage
- Automatic authentication check

## Socket.IO Integration

The frontend connects to the backend Socket.IO server for:
- Real-time message sending/receiving
- Typing indicators
- Online status updates
- Private and group messaging

## Styling

The application uses **Tailwind CSS** for styling with:
- Responsive design
- Dark theme for sidebar
- Modern UI components
- Hover effects and transitions
- Mobile-friendly layout

## API Integration

The frontend communicates with the backend through:
- REST API calls for authentication and data fetching
- Socket.IO for real-time features
- JWT token authentication
- Automatic token inclusion in requests

## Environment Configuration

The frontend is configured to proxy API requests to the backend server at `http://localhost:5000`. This is set in the `package.json` file.

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Development Notes

- The app uses React Router for navigation
- Socket.IO client for real-time features
- Context API for state management
- Functional components with hooks
- Responsive design principles

## Troubleshooting

1. **Connection issues**: Make sure the backend server is running on port 5000
2. **Authentication errors**: Check if JWT tokens are properly stored
3. **Socket connection**: Verify Socket.IO server is accessible
4. **Styling issues**: Ensure Tailwind CSS is properly configured
