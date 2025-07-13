// src/components/ChatWindow.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  FaThumbsUp,
  FaThumbsDown,
  FaEllipsisH,
  FaPaperPlane,
  FaPaperclip,
  FaSmile,
  FaSyncAlt
} from 'react-icons/fa';
import { getGeminiResponse } from '../Api/gemini';

export default function ChatWindow({ darkMode }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationStarted, setConversationStarted] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const containerRef = useRef();

  // Auto‑scroll to bottom on new messages
  useEffect(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  // New‑chat reset
  useEffect(() => {
    const handleNewChatWindow = () => {
      setMessages([]);
      setInput('');
      setConversationStarted(false);
      setConversationId(null);
    };
    window.addEventListener('newChatWindow', handleNewChatWindow);
    return () => window.removeEventListener('newChatWindow', handleNewChatWindow);
  }, []);

  // Load from storage
  useEffect(() => {
    const onSelect = ({ detail: { id } }) => {
      const convos = JSON.parse(localStorage.getItem('conversations') || '[]');
      const conv = convos.find((c) => c.id === id);
      if (conv) {
        setMessages(conv.messages || []);
        setConversationStarted(true);
        setConversationId(id);
      }
    };
    window.addEventListener('selectConversation', onSelect);
    return () => window.removeEventListener('selectConversation', onSelect);
  }, []);

  // Persist updates
  useEffect(() => {
    if (!conversationId) return;
    window.dispatchEvent(
      new CustomEvent('updateConversation', {
        detail: { id: conversationId, messages },
      })
    );
  }, [messages, conversationId]);

  // Send a message
  const sendMessage = async () => {
    if (!input.trim()) return;

    let updated = [...messages];

    if (!conversationStarted) {
      const id = Date.now();
      const title =
        input.length > 30 ? input.substring(0, 30) + '...' : input;
      setConversationId(id);
      window.dispatchEvent(
        new CustomEvent('newConversation', { detail: { id, title } })
      );
      setConversationStarted(true);
    }

    updated.push({ from: 'user', text: input.trim() });
    setMessages(updated);
    setInput('');

    updated = [...updated, { from: 'bot', text: 'Thinking…' }];
    setMessages(updated);
    const botIndex = updated.length - 1;

    try {
      const prompt = updated.map((m) => m.text).join('\n');
      const botReply = await getGeminiResponse(prompt);
      const final = [...updated];
      final[botIndex] = { from: 'bot', text: botReply };
      setMessages(final);
    } catch (err) {
      console.error(err);
      const final = [...updated];
      final[botIndex] = {
        from: 'bot',
        text: 'Error: Unable to fetch response. Please try again.',
      };
      setMessages(final);
    }
  };

  // Regenerate last bot reply
  const regenerateResponse = async () => {
    const lastBotIndex = messages.map((m) => m.from).lastIndexOf('bot');
    if (lastBotIndex === -1) return;

    let updated = [...messages];
    updated[lastBotIndex] = { from: 'bot', text: 'Rethinking…' };
    setMessages(updated);

    const prompt = updated
      .slice(0, lastBotIndex)
      .map((m) => m.text)
      .join('\n');

    try {
      const botReply = await getGeminiResponse(prompt);
      updated[lastBotIndex] = { from: 'bot', text: botReply };
      setMessages([...updated]);
    } catch (err) {
      console.error(err);
      updated[lastBotIndex] = {
        from: 'bot',
        text: 'Error: Unable to regenerate response. Please try again.',
      };
      setMessages([...updated]);
    }
  };

  // Custom Markdown renderers
  const markdownComponents = {
    h1: ({ node, ...props }) => <h1 className="text-2xl font-extrabold my-2" {...props} />,
    h2: ({ node, ...props }) => <h2 className="text-xl font-bold my-1.5" {...props} />,
    h3: ({ node, ...props }) => <h3 className="text-lg font-semibold my-1" {...props} />,
    p: ({ node, ...props }) => <p className="mb-2 leading-relaxed" {...props} />,
    ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2" {...props} />,
    ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2" {...props} />,
    li: ({ node, ...props }) => <li className="ml-4 mb-1" {...props} />,
    strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
    em: ({ node, ...props }) => <em className="italic" {...props} />,
    code: ({ node, inline, className, children, ...props }) =>
      inline ? (
        <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded" {...props}>
          {children}
        </code>
      ) : (
        <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto" {...props}>
          <code>{children}</code>
        </pre>
      ),
  };

  return (
    <div
      className={`
        relative                  /* establishes positioning context */
        flex flex-col flex-1 h-full
        transition-colors duration-300
        ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}
      `}
    >
      {/* Message List: fills all space above the input bar and scrolls */}
      <div
        ref={containerRef}
        className="absolute inset-x-0 top-0 bottom-16 px-0 py-4 overflow-auto space-y-8 scroll-smooth"
      >
        {messages.map((m, i) => {
          const incoming = m.from === 'bot';
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex w-full"
            >
              <div
                className={`flex w-full px-4 sm:px-6 ${
                  incoming ? 'justify-start' : 'justify-end'
                }`}
              >
                <div className="relative max-w-[calc(100%-32px)] sm:max-w-[calc(100%-48px)] w-auto">
                  <div
                    className={`absolute ${
                      incoming ? '-left-3' : '-right-3'
                    } top-3 w-4 h-4 ${
                      incoming
                        ? darkMode
                          ? 'bg-gray-900'
                          : 'bg-gray-50'
                        : 'bg-blue-500'
                    } transform rotate-45 shadow-lg`}
                  />
                  <div
                    className={`relative p-5 ${
                      incoming
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200'
                        : 'bg-blue-500 text-white'
                    } rounded-2xl shadow-xl leading-relaxed`}
                    style={{ wordBreak: 'break-word' }}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {m.text}
                    </ReactMarkdown>
                  </div>
                  {incoming && (
                    <div className="flex items-center space-x-4 text-sm text-gray-400 mt-2">
                      <button className="hover:scale-110 transform transition duration-200">
                        <FaThumbsUp className="hover:text-green-500" />
                      </button>
                      <button className="hover:scale-110 transform transition duration-200">
                        <FaThumbsDown className="hover:text-red-500" />
                      </button>
                      <button className="hover:scale-110 transform transition duration-200">
                        <FaEllipsisH className="hover:text-gray-500" />
                      </button>
                      {i === messages.map((x) => x.from).lastIndexOf('bot') && (
                        <button
                          onClick={regenerateResponse}
                          className={`ml-4 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 transition duration-200 ${
                            darkMode
                              ? 'border border-gray-600 text-gray-200 hover:bg-gray-700'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <FaSyncAlt /> Regenerate
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Input Bar: fixed height and always at the bottom */}
      <div
        className={`
          absolute bottom-0 inset-x-0 h-16
          flex items-center px-6 border-t backdrop-blur-md bg-opacity-80 z-20
          ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
        `}
      >
        <button className="p-3 rounded-full hover:bg-gray-200 transition duration-200">
          <FaPaperclip
            className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
          />
        </button>
        <button className="p-3 rounded-full hover:bg-gray-200 transition duration-200 ml-2">
          <FaSmile
            className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
          />
        </button>
        <input
          type="text"
          className={`flex-1 mx-4 min-w-0 h-[2.5rem] px-6 border rounded-full focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm ${
            darkMode
              ? 'bg-gray-700 border-gray-600 text-gray-200 focus:ring-blue-400 placeholder:text-gray-500'
              : 'bg-gray-100 border-gray-300 text-gray-900 focus:ring-blue-300 placeholder:text-gray-500'
          }`}
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-transform duration-200 hover:scale-110 shadow-lg"
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
}
