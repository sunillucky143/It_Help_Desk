import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Send, Trash2, Bot, User, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatResponse {
  reply: string;
  intent: string;
  agent: string;
  timestamp: string;
}

export default function Chatbot() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history
  const { data: historyData, refetch } = useQuery({
    queryKey: ['chatHistory', user?.id],
    queryFn: async () => {
      const response = await api.get(`/chatbot/history/${user?.id}`);
      return response.data.history;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (historyData) {
      setMessages(
        historyData.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }))
      );
    }
  }, [historyData]);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await api.post<ChatResponse>('/chatbot/message', {
        message,
        userId: user?.id,
      });
      return response.data;
    },
    onSuccess: (data) => {
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(data.timestamp),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    },
    onError: (error: any) => {
      setIsTyping(false);
      toast.error(`Error: ${error.message}`);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/chatbot/history/${user?.id}`);
    },
    onSuccess: () => {
      setMessages([]);
      toast.success('Chat history cleared');
      refetch();
    },
    onError: () => {
      toast.error('Failed to clear chat history');
    },
  });

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    sendMessageMutation.mutate(input.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all chat history?')) {
      clearHistoryMutation.mutate();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Bot className="w-8 h-8 mr-3 text-blue-600" />
              Admin Assistant
            </h1>
            <p className="text-gray-600 mt-1">
              Ask me anything about tickets, organizations, agents, devices, or metrics
            </p>
          </div>
          <button
            onClick={handleClearHistory}
            className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            disabled={messages.length === 0}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear History
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-12">
              <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Start a conversation!</p>
              <p className="text-sm mt-2">Try asking:</p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="bg-gray-50 rounded-lg p-3 max-w-md mx-auto">
                  "Show me all open tickets"
                </div>
                <div className="bg-gray-50 rounded-lg p-3 max-w-md mx-auto">
                  "What are the dashboard metrics?"
                </div>
                <div className="bg-gray-50 rounded-lg p-3 max-w-md mx-auto">
                  "List all organizations"
                </div>
                <div className="bg-gray-50 rounded-lg p-3 max-w-md mx-auto">
                  "How many devices are offline?"
                </div>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start space-x-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              )}

              <div
                className={`max-w-2xl rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{message.content}</div>
                <div
                  className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Loader className="w-4 h-4 animate-spin text-gray-600" />
                  <span className="text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                rows={2}
                disabled={isTyping}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Powered by multi-agent AI system with specialized agents for CRUD operations and analytics
          </p>
        </div>
      </div>
    </div>
  );
}
