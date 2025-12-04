import React, { useState, useEffect } from 'react';
import { ApiSettings } from '../types';
import { X, Save, Settings2, Trash2, Info, Languages, Loader2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: ApiSettings) => void;
  currentSettings: ApiSettings;
  onReset: () => void;
  language?: 'en' | 'zh';
  onTranslateLibrary?: () => void; // New prop for translation handler
  isTranslating?: boolean;         // New prop for translation state
}

const t = {
    en: {
        title: "Configuration",
        provider: "API Provider",
        geminiDesc: "Native Search Grounding",
        openaiDesc: "Semantic Scholar Search",
        infoEnhanced: "Enhanced Architecture: The app now uses Semantic Scholar to fetch real-time papers (with citations & PDFs) and uses your configured LLM (e.g., DeepSeek, GPT-4) solely for translation and analysis. This guarantees valid DOIs and eliminates hallucinations.",
        modelName: "Model Name",
        baseUrl: "Base URL",
        optional: "Optional",
        baseUrlHelp: "Useful for proxies. Leave empty for default.",
        apiKey: "API Key",
        apiKeyHelp: "Stored locally in your browser.",
        utilities: "Farm Utilities",
        translateBarn: "Translate Barn",
        translateBarnDesc: "Re-translate all papers in your Knowledge Barn to your current language.",
        translateBtn: "Start Translation",
        dangerZone: "Danger Zone",
        resetProfile: "Reset Profile & Clear Data",
        cancel: "Cancel",
        save: "Save",
        resetConfirm: "Are you sure you want to reset your profile? You will lose your topics and role settings."
    },
    zh: {
        title: "设置",
        provider: "API 提供商",
        geminiDesc: "原生搜索落地",
        openaiDesc: "Semantic Scholar 搜索",
        infoEnhanced: "增强架构：应用现在使用 Semantic Scholar 获取实时论文（包含引用和PDF），并仅使用您的 LLM（如 DeepSeek, GPT-4）进行翻译和分析。这保证了 DOI 的有效性并消除了幻觉。",
        modelName: "模型名称",
        baseUrl: "Base URL (接口地址)",
        optional: "可选",
        baseUrlHelp: "用于代理地址。默认留空。",
        apiKey: "API Key",
        apiKeyHelp: "仅存储在本地浏览器中。",
        utilities: "农场工具",
        translateBarn: "翻译谷仓",
        translateBarnDesc: "将知识谷仓中的所有论文重新翻译为您当前的语言。",
        translateBtn: "开始翻译",
        dangerZone: "危险区域",
        resetProfile: "重置资料并清空数据",
        cancel: "取消",
        save: "保存",
        resetConfirm: "您确定要重置个人资料吗？您将丢失所有话题和角色设置。"
    }
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentSettings, onReset, language = 'en', onTranslateLibrary, isTranslating = false }) => {
  const [settings, setSettings] = useState<ApiSettings>(currentSettings);
  const T = t[language];

  // Sync state when opening
  useEffect(() => {
    if (isOpen) {
      setSettings(currentSettings);
    }
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-100 p-2 rounded-lg">
                <Settings2 className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">{T.title}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">{T.provider}</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSettings({ ...settings, provider: 'gemini' })}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  settings.provider === 'gemini'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                }`}
              >
                <span className="font-bold">Google Gemini</span>
                <span className="text-xs mt-1 opacity-75">{T.geminiDesc}</span>
              </button>
              <button
                onClick={() => setSettings({ ...settings, provider: 'openai' })}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  settings.provider === 'openai'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                }`}
              >
                <span className="font-bold">OpenAI Compatible</span>
                <span className="text-xs mt-1 opacity-75">{T.openaiDesc}</span>
              </button>
            </div>
          </div>

          {settings.provider === 'openai' && (
             <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex gap-3 text-sm text-slate-700">
                <Info className="w-5 h-5 flex-shrink-0 text-slate-500" />
                <p>
                  {T.infoEnhanced}
                </p>
             </div>
          )}

          {/* Model Name */}
          <div>
             <label className="block text-sm font-semibold text-slate-700 mb-2">{T.modelName}</label>
             <input
                type="text"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900"
                placeholder={settings.provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o'}
                value={settings.modelId}
                onChange={(e) => setSettings({ ...settings, modelId: e.target.value })}
             />
             <div className="mt-2 flex gap-2">
                {(settings.provider === 'gemini' ? ['gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-3-pro-preview'] : ['gpt-4o', 'deepseek-chat', 'claude-3-5-sonnet']).map(m => (
                    <button 
                        key={m}
                        onClick={() => setSettings({...settings, modelId: m})}
                        className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-600"
                    >
                        {m}
                    </button>
                ))}
             </div>
          </div>

          {/* Base URL */}
          <div>
             <label className="block text-sm font-semibold text-slate-700 mb-2">
                {T.baseUrl} <span className="font-normal text-slate-400">({T.optional})</span>
             </label>
             <input
                type="text"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 font-mono text-sm"
                placeholder={settings.provider === 'gemini' ? 'https://generativelanguage.googleapis.com' : 'https://api.openai.com/v1'}
                value={settings.baseUrl || ''}
                onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
             />
             <p className="text-xs text-slate-400 mt-1">{T.baseUrlHelp}</p>
          </div>

           {/* API Key */}
           <div>
             <label className="block text-sm font-semibold text-slate-700 mb-2">{T.apiKey}</label>
             <input
                type="password"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 font-mono"
                placeholder="sk-..."
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
             />
             <p className="text-xs text-slate-400 mt-1">{T.apiKeyHelp}</p>
          </div>

          {/* Utilities Section */}
          <div className="pt-4 border-t border-slate-100">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{T.utilities}</h3>
             
             <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                 <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-700 flex items-center gap-2">
                        <Languages className="w-4 h-4 text-emerald-600" /> {T.translateBarn}
                    </span>
                 </div>
                 <p className="text-xs text-slate-500 mb-3">{T.translateBarnDesc}</p>
                 <button
                    onClick={onTranslateLibrary}
                    disabled={isTranslating}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                 >
                    {isTranslating ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Translating...
                        </>
                    ) : (
                        T.translateBtn
                    )}
                 </button>
             </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-4 border-t border-slate-100">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{T.dangerZone}</h3>
             <button 
                onClick={() => {
                    if (window.confirm(T.resetConfirm)) {
                        onReset();
                    }
                }}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium p-2 hover:bg-red-50 rounded-lg transition-colors w-full"
             >
                <Trash2 className="w-4 h-4" /> {T.resetProfile}
             </button>
          </div>

        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium"
          >
            {T.cancel}
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md transition-colors font-medium flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {T.save}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;