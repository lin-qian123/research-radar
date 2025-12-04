import React, { useState } from 'react';
import { UserPreferences } from '../types';
import { Plus, X, ArrowRight, Sprout, Languages } from 'lucide-react';

interface OnboardingProps {
  onComplete: (prefs: UserPreferences) => void;
}

const t = {
    en: {
        welcome: "Research Farm",
        tagline: "Cultivate your knowledge. Harvest daily scientific breakthroughs tailored to your fields.",
        roleLabel: "What is your role?",
        rolePlaceholder: "e.g. PhD Student, ML Researcher...",
        cropsLabel: "Current Crops (Interests)",
        cropPlaceholder: "e.g. LLM Quantization, CRISPR",
        addAtLeastOne: "Add at least one crop topic...",
        startFarming: "Start Farming Knowledge",
        switchLang: "中文"
    },
    zh: {
        welcome: "Research Farm (科研农场)",
        tagline: "耕耘知识，收获突破。为您量身定制的每日科研情报助手。",
        roleLabel: "您的角色是什么？",
        rolePlaceholder: "例如：博士生、深度学习研究员...",
        cropsLabel: "当前作物（研究兴趣）",
        cropPlaceholder: "例如：激光等离子体、大模型",
        addAtLeastOne: "请至少添加一个研究兴趣...",
        startFarming: "开始耕耘知识",
        switchLang: "English"
    }
};

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  // Default values set for debugging convenience
  const [role, setRole] = useState('PhD Student');
  const [topicInput, setTopicInput] = useState('');
  const [topics, setTopics] = useState<string[]>([
    'High Energy Density Physics',
    'Laser Plasma',
    'Electron Ion Acceleration',
    'AI and Plasma',
    'Particle In Cell code'
  ]);

  const addTopic = () => {
    if (topicInput.trim() && !topics.includes(topicInput.trim())) {
      setTopics([...topics, topicInput.trim()]);
      setTopicInput('');
    }
  };

  const removeTopic = (t: string) => {
    setTopics(topics.filter(topic => topic !== t));
  };

  const handleComplete = () => {
    if (role && topics.length > 0) {
      onComplete({
        jobRole: role,
        topics,
        hasOnboarded: true,
        searchMode: 'broad',
        timeRange: 'week',
        language: lang // Pass selected language preference
      });
    }
  };

  const T = t[lang];

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50 p-4 relative">
      {/* Language Toggle */}
      <button 
        onClick={() => setLang(prev => prev === 'en' ? 'zh' : 'en')}
        className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm text-sm text-slate-600 hover:text-emerald-700 hover:shadow-md transition-all"
      >
        <Languages className="w-4 h-4" /> {T.switchLang}
      </button>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-emerald-100">
        <div className="flex items-center justify-center mb-6">
            <div className="bg-emerald-600 p-3 rounded-full shadow-lg shadow-emerald-200">
                <Sprout className="w-8 h-8 text-white" />
            </div>
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 text-center mb-2">{T.welcome}</h1>
        <p className="text-slate-500 text-center mb-8">
          {T.tagline}
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {T.roleLabel}
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              placeholder={T.rolePlaceholder}
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {T.cropsLabel}
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                className="flex-1 px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder={T.cropPlaceholder}
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTopic()}
              />
              <button
                onClick={addTopic}
                className="bg-emerald-800 hover:bg-emerald-900 text-white p-3 rounded-lg transition-colors"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 min-h-[60px]">
              {topics.map(topic => (
                <span key={topic} className="inline-flex items-center bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium border border-emerald-100">
                  {topic}
                  <button onClick={() => removeTopic(topic)} className="ml-2 hover:text-emerald-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {topics.length === 0 && (
                <span className="text-slate-400 text-sm italic">{T.addAtLeastOne}</span>
              )}
            </div>
          </div>

          <button
            onClick={handleComplete}
            disabled={!role || topics.length === 0}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-semibold transition-all ${
              role && topics.length > 0 
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200' 
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            {T.startFarming} <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;