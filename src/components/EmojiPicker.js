import React, { useState } from 'react';

const EmojiPicker = ({ onEmojiSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('smileys');

  const emojiCategories = {
    smileys: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
      '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
      '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬'
    ],
    gestures: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
      '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
      '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
      '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃',
      '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋'
    ],
    objects: [
      '💎', '💍', '💐', '💒', '💓', '💔', '💕', '💖', '💗', '💘',
      '💙', '💚', '💛', '💜', '🖤', '💝', '💞', '💟', '❣️', '💌',
      '💘', '💝', '💖', '💗', '💙', '💚', '💛', '💜', '🖤', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌',
      '💋', '💍', '💎', '💐', '💒', '💓', '💔', '💕', '💖', '💗'
    ],
    nature: [
      '🌱', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁',
      '🍂', '🍃', '🍄', '🌰', '🦀', '🦞', '🦐', '🦑', '🦪', '🐚',
      '🌍', '🌎', '🌏', '🌐', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖',
      '🌗', '🌘', '🌙', '🌚', '🌛', '🌜', '🌡️', '☀️', '🌤️', '⛅',
      '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '☃️', '⛄', '🌬️'
    ],
    food: [
      '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈',
      '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🥦', '🥬',
      '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠',
      '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞',
      '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕'
    ],
    activities: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
      '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁',
      '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌',
      '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾',
      '🏊', '🏄', '🚣', '🏊', '⛹️', '🏋️', '🚴', '🚵', '🧘', '🏃'
    ]
  };

  const categoryIcons = {
    smileys: '😀',
    gestures: '👋',
    objects: '💎',
    nature: '🌱',
    food: '🍎',
    activities: '⚽'
  };

  return (
    <div className="emoji-picker bg-white border border-gray-200 rounded-lg shadow-lg z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">Emoji</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg"
        >
          ✕
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-gray-200">
        {Object.keys(emojiCategories).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`flex-1 p-2 text-center text-lg hover:bg-gray-50 transition-colors ${
              activeCategory === category ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
            }`}
          >
            {categoryIcons[category]}
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className="p-3 max-h-64 overflow-y-auto">
        <div className="grid grid-cols-8 gap-2">
          {emojiCategories[activeCategory].map((emoji, index) => (
            <button
              key={index}
              onClick={() => onEmojiSelect(emoji)}
              className="w-8 h-8 text-lg hover:bg-blue-100 rounded transition-colors flex items-center justify-center"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmojiPicker;
