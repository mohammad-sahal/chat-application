import React from 'react';
import { Message } from './Message';
import PropTypes from 'prop-types';

export const MessageList = ({ 
  messages, 
  user, 
  onDelete, 
  onMarkAsRead, 
  messagesEndRef 
}) => {
  return (
    <div className="p-4 space-y-4">
      {messages.map((message, index) => {
        const isOwn = message.sender._id === user.id || message.sender === user.id;
        const prevMessage = messages[index - 1];
        const showAvatar = !isOwn && (!prevMessage || 
          prevMessage.sender._id !== message.sender._id ||
          prevMessage.sender !== message.sender
        );

        return (
          <Message
            key={message._id || message.tempId || index}
            message={message}
            isOwn={isOwn}
            showAvatar={showAvatar}
            user={user}
            onDelete={onDelete}
            onMarkAsRead={onMarkAsRead}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

MessageList.propTypes = {
  messages: PropTypes.array.isRequired,
  user: PropTypes.object.isRequired,
  onDelete: PropTypes.func.isRequired,
  onMarkAsRead: PropTypes.func.isRequired,
  messagesEndRef: PropTypes.object.isRequired
};