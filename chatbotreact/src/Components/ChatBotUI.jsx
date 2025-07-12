// src/ChatBotUI.jsx
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import { FaSun, FaMoon } from 'react-icons/fa';

export default function ChatBotUI() {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <div
      className={`
                  
        flex flex-col md:flex-row         /* mobile: column, md+: row */
        h-screen
        ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-900'}
      `}
    >
      {/* Sidebar wraps to full width on mobile, reverts to sidebar on md+ */}
      <div className="w-full md:w-auto">
        <Sidebar darkMode={darkMode} />
      </div>

      {/* Main chat area */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div
          className={`
            flex items-center justify-between
            px-2 sm:px-4   /* less padding on smallest screens */
            py-2 sm:py-3
            ${darkMode ? 'bg-gray-800' : 'bg-white'}
            shadow
          `}
        >
          <div className="flex items-center">
            <img
              src="Image/dp.png"
              alt="Avatar"
              className="w-8 h-8 rounded-full mr-3"
            />
            <h2 className="font-medium text-sm">Chat A.I+</h2>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {darkMode
              ? <FaSun className="text-yellow-400" />
              : <FaMoon className="text-gray-600" />
            }
          </button>
        </div>

        {/* The chat window itself */}
        <ChatWindow darkMode={darkMode} />
      </div>
    </div>
  );
}
