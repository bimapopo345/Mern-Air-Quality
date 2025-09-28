import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  Loader, 
  Sparkles, 
  MessageSquare,
  Trash2,
  Download,
  Copy,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import './AiHelperPage.css';

const AiHelperPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Hello! I\'m your AI assistant for the IoT Air Quality Dashboard. I can help you understand air quality data, explain readings, suggest improvements, and answer questions about environmental monitoring. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Quick suggestion prompts
  const quickPrompts = [
    "What does my current AQI reading mean?",
    "How can I improve indoor air quality?",
    "Explain the difference between PM2.5 and PM10",
    "What are safe CO2 levels for offices?",
    "When should I be concerned about air quality?",
    "How do weather conditions affect air quality?"
  ];

  // Send message to OpenRouter AI
  const sendMessage = async (content) => {
    if (!content.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.REACT_APP_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "IoT Air Quality Dashboard"
        },
        body: JSON.stringify({
          "model": "google/gemini-2.0-flash-exp:free",
          "messages": [
            { 
              "role": "system", 
              "content": "You are a helpful AI assistant for an IoT Air Quality Dashboard. You specialize in environmental monitoring, air quality analysis, and IoT sensor data interpretation. Provide clear, informative, and actionable advice about air quality, environmental health, and sensor readings. Be friendly, professional, and focus on helping users understand and improve their indoor air quality. When discussing specific values, explain what they mean in practical terms and suggest appropriate actions." 
            },
            { 
              "role": "user", 
              "content": content
            }
          ],
          "max_tokens": 1000,
          "temperature": 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI request failed:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "I'm sorry, I'm having trouble connecting to my AI service right now. Please check your connection and try again. In the meantime, you can refer to the dashboard data or contact your system administrator.",
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  // Handle quick prompt selection
  const handleQuickPrompt = (prompt) => {
    sendMessage(prompt);
  };

  // Copy message to clipboard
  const copyMessage = async (messageId, content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      toast.success('Message copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy message');
    }
  };

  // Clear chat history
  const clearChat = () => {
    setMessages([
      {
        id: 1,
        type: 'ai',
        content: 'Chat cleared! How can I help you with air quality monitoring today?',
        timestamp: new Date()
      }
    ]);
    toast.success('Chat history cleared');
  };

  // Export chat history
  const exportChat = () => {
    const chatText = messages.map(msg => 
      `[${msg.timestamp.toLocaleString()}] ${msg.type.toUpperCase()}: ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `air-quality-chat-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Chat exported successfully');
  };

  return (
    <div className="ai-helper-page">
      {/* Header */}
      <motion.div 
        className="ai-helper-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-content">
          <div className="header-info">
            <div className="ai-avatar">
              <Sparkles size={24} />
            </div>
            <div>
              <h1>AI Assistant</h1>
              <p>Get intelligent insights about your air quality data</p>
            </div>
          </div>
          <div className="header-actions">
            <motion.button
              className="action-button"
              onClick={exportChat}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Export Chat"
            >
              <Download size={18} />
            </motion.button>
            <motion.button
              className="action-button danger"
              onClick={clearChat}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Clear Chat"
            >
              <Trash2 size={18} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Chat Container */}
      <div className="chat-container glass-card">
        {/* Messages */}
        <div className="messages-area">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                className={`message ${message.type} ${message.isError ? 'error' : ''}`}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <div className="message-avatar">
                  {message.type === 'ai' ? (
                    <Bot size={20} />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-sender">
                      {message.type === 'ai' ? 'AI Assistant' : 'You'}
                    </span>
                    <span className="message-time">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="message-text">
                    {message.content}
                  </div>
                  <button
                    className="copy-button"
                    onClick={() => copyMessage(message.id, message.content)}
                    title="Copy message"
                  >
                    {copiedId === message.id ? (
                      <Check size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              className="message ai typing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="message-avatar">
                <Bot size={20} />
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="typing-text">AI is thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <motion.div 
            className="quick-prompts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3>Quick Questions:</h3>
            <div className="prompts-grid">
              {quickPrompts.map((prompt, index) => (
                <motion.button
                  key={index}
                  className="prompt-button glass-button"
                  onClick={() => handleQuickPrompt(prompt)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                >
                  <MessageSquare size={16} />
                  {prompt}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Input Area */}
        <motion.form 
          className="input-area"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="input-container">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me anything about air quality, sensors, or environmental monitoring..."
              className="message-input glass-input"
              disabled={isLoading}
              maxLength={500}
            />
            <motion.button
              type="submit"
              className="send-button"
              disabled={!inputMessage.trim() || isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLoading ? (
                <Loader size={20} className="spinning" />
              ) : (
                <Send size={20} />
              )}
            </motion.button>
          </div>
          <div className="input-footer">
            <span className="character-count">
              {inputMessage.length}/500
            </span>
            <span className="ai-disclaimer">
              AI responses are generated and may not always be accurate
            </span>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default AiHelperPage;