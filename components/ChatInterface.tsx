import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { chatWithCurator } from '../services/geminiService';
import { Paper } from '../types';

interface ChatInterfaceProps {
  contextPapers: Paper[];
  language?: 'en' | 'zh';
}

const t = {
    en: {
        welcome: "Greetings! I am your Agronomist. I have access to the crops in your Knowledge Barn. Ask me to find connections, summarize findings, or explain technical details.",
        placeholder: "Ask about your crops...",
        botName: "The Agronomist"
    },
    zh: {
        welcome: "您好！我是您的农学家助手。我已经熟悉了您谷仓里的所有作物（文献）。您可以让我寻找关联、总结发现或解释技术细节。",
        placeholder: "询问关于作物的问题...",
        botName: "农学家助手"
    }
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ contextPapers, language = 'en' }) => {
  const T = t[language];
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Initialize message when language changes or first load
  useEffect(() => {
      // Only set if empty to avoid wiping history on lang switch, OR logic to translate history? 
      // Simplest is to just append a new greeting or reset if empty.
      if (messages.length === 0) {
          setMessages([{
              id: '1',
              role: 'model',
              text: T.welcome,
              timestamp: Date.now()
          }]);
      }
  }, [language]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const responseText = await chatWithCurator(messages, userMsg.text, contextPapers, language);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
       // Error handling handled by logs usually, user just sees no response or retry in real app
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-2">
        <Bot className="w-5 h-5 text-emerald-600" />
        <h3 className="font-semibold text-slate-800">{T.botName}</h3>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-slate-200' : 'bg-emerald-100'
            }`}>
              {msg.role === 'user' ? <User className="w-5 h-5 text-slate-700" /> : <Bot className="w-5 h-5 text-emerald-600" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${
              msg.role === 'user' 
                ? 'bg-slate-700 text-white rounded-tr-none' 
                : 'bg-slate-100 text-slate-700 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-emerald-600" />
             </div>
             <div className="bg-slate-100 rounded-2xl rounded-tl-none p-4 flex items-center">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
             </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            placeholder={T.placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;