import React, { useState, useEffect, useMemo } from 'react';
import 'font-awesome/css/font-awesome.min.css';

/** useLocalStorage hook **/
function useLocalStorage(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);

  return [state, setState];
}

/**
 * Sidebar
 * Props:
 * - darkMode?: boolean
 * - userName?: string
 */
export default function Sidebar({
  darkMode = false,
  userName = 'User'
}) {
  // State for responsive open/close
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [conversations, setConversations] = useLocalStorage('conversations', []);
  const [activeConversationId, setActiveConversationId] = useState(
    conversations[0]?.id ?? null
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [searchActive, setSearchActive] = useState(false);

  // Listen for new conversations
  useEffect(() => {
    const onNewConv = ({ detail: { id, title } }) => {
      setConversations(prev => [{ id, title, messages: [] }, ...prev]);
      setActiveConversationId(id);
    };
    window.addEventListener('newConversation', onNewConv);
    return () => window.removeEventListener('newConversation', onNewConv);
  }, [setConversations]);

  // Listen for conversation updates
  useEffect(() => {
    const onUpdate = ({ detail: { id, messages } }) => {
      setConversations(prev =>
        prev.map(c => (c.id === id ? { ...c, messages } : c))
      );
    };
    window.addEventListener('updateConversation', onUpdate);
    return () => window.removeEventListener('updateConversation', onUpdate);
  }, [setConversations]);

  const filteredConversations = useMemo(
    () =>
      conversations.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [conversations, searchTerm]
  );

  const last7DaysConversations = useMemo(
    () =>
      conversations.filter(
        c => Date.now() - c.id <= 7 * 24 * 60 * 60 * 1000
      ),
    [conversations]
  );

  // Handlers
  const handleNewChat = () => {
    window.dispatchEvent(new CustomEvent('newChatWindow'));
  };
  const handleSelect = id => {
    setActiveConversationId(id);
    window.dispatchEvent(
      new CustomEvent('selectConversation', { detail: { id } })
    );
  };
  const handleDelete = id => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      const next = conversations.find(c => c.id !== id);
      handleSelect(next?.id || null);
    }
  };
  const handleClearAll = () => {
    setConversations([]);
    setActiveConversationId(null);
    window.dispatchEvent(new CustomEvent('selectConversation', { detail: { id: null } }));
  };

  return (
    <>
      {/* Toggle button visible on mobile/tablet */}
      <button
        className="lg:hidden fixed top-1/2 left-0 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-r-full z-50"
        onClick={() => setSidebarOpen(open => !open)}
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        <i className={`fa ${sidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'}`} />
      </button>

      {/* Sidebar container */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-72 p-4 flex flex-col h-full overflow-y-auto space-y-6
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:transform-none lg:transition-none
          ${darkMode ? 'bg-gray-800 border-r border-gray-700' : 'bg-white border-r border-gray-300'}
        `}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`::-webkit-scrollbar { display: none; }`}</style>

        {/* Header */}
        <div className="mb-4">
          <p className="text-2xl font-bold">CHAT A.I+</p>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 mb-4">
          <button
            className="bg-blue-600 text-white py-2 px-4 rounded-full text-sm"
            onClick={handleNewChat}
          >
            + New chat
          </button>
          {!searchActive ? (
            <button
              onClick={() => setSearchActive(true)}
              className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
              aria-label="Search conversations"
            >
              <i className="fa fa-search" />
            </button>
          ) : (
            <span className="flex-1 relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-8 py-1 rounded bg-gray-100 dark:bg-gray-700 text-sm focus:outline-none"
                autoFocus
              />
              <i className="fa fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <button
                onClick={() => {
                  setSearchActive(false);
                  setSearchTerm('');
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                aria-label="Close search"
              >
                <i className="fa fa-times" />
              </button>
            </span>
          )}
        </div>

        {/* Your Conversations */}
        <div>
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold">Your conversations</p>
            <button className="text-xs hover:text-gray-600" onClick={handleClearAll}>
              Clear All
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {filteredConversations.map(({ id, title }) => (
              <div
                key={id}
                className={`flex items-center justify-between space-x-3 text-sm cursor-pointer ${
                  id === activeConversationId
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-600'
                }`}
                onClick={() => handleSelect(id)}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <p className="truncate max-w-xs">{title}</p>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleDelete(id);
                  }}
                >
                  <i className="fa fa-trash text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Last 7 Days */}
        <div>
          <p className="text-xs font-semibold">Last 7 Days</p>
          <div className="mt-4 space-y-3">
            {last7DaysConversations.map(({ id, title }) => (
              <div
                key={id}
                className="flex items-center space-x-3 text-sm cursor-pointer text-gray-600"
                onClick={() => handleSelect(id)}
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <p className="truncate max-w-xs">{title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t">
          <button className="text-sm">Settings</button>
          <p className="text-sm font-semibold">{userName}</p>
        </div>
      </div>
    </>
  );
}
