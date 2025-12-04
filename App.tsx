import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import PaperCard from './components/PaperCard';
import ChatInterface from './components/ChatInterface';
import SettingsModal from './components/SettingsModal';
import { UserPreferences, Paper, ApiSettings } from './types';
import { harvestPapers, semanticSearchPapers, translateBatch } from './services/geminiService';
import { 
    getInboxPapers, 
    getLibraryPapers, 
    saveToInbox, 
    addPaperToLibrary, 
    removePaperFromLibrary,
    updateLibrary,
    clearDatabase, 
    filterPapers,
    isPaperInLibrary
} from './services/databaseService';
import { Sprout, Search, RotateCw, LayoutGrid, MessageSquare, Clock, Settings, Database, RefreshCw, Globe, ArrowRight, Warehouse, Wheat, Hash, Plus, X, Languages } from 'lucide-react';

// Simple translation dictionary
const t = {
    en: {
        harvest: "Daily Harvest",
        harvestDesc: "Fresh crops from the daily harvest.",
        barn: "Knowledge Barn",
        barnDesc: "Your stored knowledge for analysis.",
        agronomist: "The Agronomist",
        agronomistDesc: "Consult with your expert Agronomist.",
        settings: "Farm Tools",
        crops: "Current Crops",
        harvestNow: "Harvest Now",
        harvesting: "Harvesting",
        lastHarvest: "Last Harvest",
        never: "Never",
        searchPlaceholder: "Search new crops online...",
        filterPlaceholder: "Filter...",
        noCropsFound: "No crops found",
        noCropsDesc: "We couldn't find matches in your",
        scoutWeb: "Scout the Web",
        emptyBarn: "The Barn is empty",
        emptyBarnDesc: "Go to the Daily Harvest and store interesting crops.",
        emptyHarvest: "No harvest yet",
        startHarvesting: "Start Harvesting",
        analyzing: "Agronomist is analyzing",
        storedCrops: "stored crops",
        manageBarn: "Manage Barn",
        emptyBarnChatTitle: "The Barn is Empty",
        emptyBarnChatDesc: "The Agronomist can only discuss crops stored in your barn. Please add some papers from the Daily Harvest first.",
        goToHarvest: "Go to Harvest",
        noCropsPlanted: "No crops planted.",
        enterCrop: "Enter crop & press Enter..."
    },
    zh: {
        harvest: "每日收割",
        harvestDesc: "为您收割的最新科研成果。",
        barn: "知识谷仓",
        barnDesc: "您存储的知识库，用于深度分析。",
        agronomist: "农学家助手",
        agronomistDesc: "与您的专家农学家咨询交流。",
        settings: "农场工具",
        crops: "当前作物",
        harvestNow: "立即收割",
        harvesting: "收割中",
        lastHarvest: "上次收割",
        never: "从未",
        searchPlaceholder: "全网搜索新作物...",
        filterPlaceholder: "筛选...",
        noCropsFound: "未找到作物",
        noCropsDesc: "未找到匹配项，范围：",
        scoutWeb: "全网侦察",
        emptyBarn: "谷仓是空的",
        emptyBarnDesc: "请前往每日收割页面收藏感兴趣的作物。",
        emptyHarvest: "暂无收成",
        startHarvesting: "开始收割",
        analyzing: "农学家正在分析",
        storedCrops: "份存储的作物",
        manageBarn: "管理谷仓",
        emptyBarnChatTitle: "谷仓是空的",
        emptyBarnChatDesc: "农学家只能讨论您谷仓里存储的作物。请先从每日收割中添加一些论文。",
        goToHarvest: "前往收割",
        noCropsPlanted: "尚未种植作物。",
        enterCrop: "输入作物并回车..."
    }
};

const App: React.FC = () => {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  
  // View State
  const [view, setView] = useState<'feed' | 'library' | 'chat'>('feed');
  
  // Data State
  const [feedPapers, setFeedPapers] = useState<Paper[]>([]);
  const [libraryPapers, setLibraryPapers] = useState<Paper[]>([]);
  
  // Loading & Sync
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchScope, setSearchScope] = useState<'local' | 'web'>('local');
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiSettings, setApiSettings] = useState<ApiSettings>({
    provider: 'gemini',
    apiKey: process.env.API_KEY || '',
    modelId: 'gemini-2.5-flash'
  });

  // Topic Management State
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopicInput, setNewTopicInput] = useState('');

  // Load prefs and settings
  useEffect(() => {
    const savedPrefs = localStorage.getItem('research_radar_prefs');
    if (savedPrefs) {
      setPrefs(JSON.parse(savedPrefs));
    }

    const savedSettings = localStorage.getItem('research_radar_api_settings');
    if (savedSettings) {
        setApiSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Effect to refresh data when prefs change
  useEffect(() => {
    if (prefs) {
       refreshData(prefs);
    }
  }, [prefs?.timeRange, prefs?.searchMode, prefs?.language]);

  const refreshData = (currentPrefs?: UserPreferences) => {
    const p = currentPrefs || prefs;
    if (!p) return;
    
    // Load Library (DB)
    const lib = getLibraryPapers();
    setLibraryPapers(lib);

    // Load Feed (Inbox)
    const inbox = getInboxPapers();
    const filteredInbox = filterPapers(inbox, p.timeRange);
    setFeedPapers(filteredInbox);
  };

  const handleSyncFeed = async (currentPrefs?: UserPreferences) => {
    const p = currentPrefs || prefs;
    if (!p || syncing) return;
    
    setSyncing(true);
    setError(null);
    try {
        console.log(`Starting harvest for ${p.topics.length} topics:`, p.topics);
        
        // Harvest papers for ALL topics to INBOX
        const newPapers = await harvestPapers(p.topics, p.jobRole, p.timeRange, p.language);
        const added = saveToInbox(newPapers);
        
        // Update timestamp
        const updatedPrefs = { ...p, lastSync: Date.now() };
        setPrefs(updatedPrefs);
        localStorage.setItem('research_radar_prefs', JSON.stringify(updatedPrefs));
        
        refreshData(updatedPrefs);
        console.log(`Harvest complete. Added ${added} new papers to feed.`);
    } catch (err) {
        console.error(err);
        setError("Background sync failed.");
    } finally {
        setSyncing(false);
    }
  };

  const handleTranslateLibrary = async () => {
      if (!prefs || isTranslating || libraryPapers.length === 0) return;
      
      setIsTranslating(true);
      try {
          const translated = await translateBatch(libraryPapers, prefs.language, apiSettings);
          updateLibrary(translated);
          setLibraryPapers(translated);
          // Also optionally translate feed? For now just library as it is the "Barn"
          refreshData(prefs);
      } catch (e) {
          console.error("Translation failed", e);
      } finally {
          setIsTranslating(false);
      }
  };

  const handleOnboardingComplete = (newPrefs: UserPreferences) => {
    setPrefs(newPrefs);
    localStorage.setItem('research_radar_prefs', JSON.stringify(newPrefs));
    handleSyncFeed(newPrefs);
  };

  const updateTimeRange = (range: '24h' | 'week' | 'month') => {
    if (!prefs) return;
    const newPrefs = { ...prefs, timeRange: range };
    setPrefs(newPrefs);
    localStorage.setItem('research_radar_prefs', JSON.stringify(newPrefs));
  };
  
  const toggleLanguage = () => {
      if (!prefs) return;
      const newLang: 'en' | 'zh' = prefs.language === 'zh' ? 'en' : 'zh';
      const newPrefs: UserPreferences = { ...prefs, language: newLang };
      setPrefs(newPrefs);
      localStorage.setItem('research_radar_prefs', JSON.stringify(newPrefs));
  };

  // Topic Management Functions
  const handleAddTopic = () => {
    if (!prefs || !newTopicInput.trim()) return;
    if (prefs.topics.includes(newTopicInput.trim())) {
        setNewTopicInput('');
        setIsAddingTopic(false);
        return;
    }
    const updatedTopics = [...prefs.topics, newTopicInput.trim()];
    const newPrefs = { ...prefs, topics: updatedTopics };
    setPrefs(newPrefs);
    localStorage.setItem('research_radar_prefs', JSON.stringify(newPrefs));
    setNewTopicInput('');
    setIsAddingTopic(false);
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    if (!prefs) return;
    const updatedTopics = prefs.topics.filter(t => t !== topicToRemove);
    const newPrefs = { ...prefs, topics: updatedTopics };
    setPrefs(newPrefs);
    localStorage.setItem('research_radar_prefs', JSON.stringify(newPrefs));
  };

  // Toggle Library Status
  const handleToggleLibrary = (paper: Paper) => {
      const exists = isPaperInLibrary(paper);
      if (exists) {
          removePaperFromLibrary(paper.id);
      } else {
          addPaperToLibrary(paper);
      }
      setLibraryPapers(getLibraryPapers());
  };

  // Search Logic
  const getDisplayedPapers = () => {
      let source = view === 'library' ? libraryPapers : feedPapers;
      
      if (!searchQuery) return source;
      
      if (searchScope === 'local') {
        const lowerQ = searchQuery.toLowerCase();
        return source.filter(p => 
            p.title.toLowerCase().includes(lowerQ) ||
            p.summary.toLowerCase().includes(lowerQ) ||
            p.tags.some(t => t.toLowerCase().includes(lowerQ)) ||
            (p.journal && p.journal.toLowerCase().includes(lowerQ))
        );
      }
      return source;
  };

  const handleWebSearch = async () => {
    if (!searchQuery.trim() || !prefs) return;
    setIsSearching(true);
    if (view !== 'feed') setView('feed');
    
    try {
        const results = await semanticSearchPapers(searchQuery, feedPapers, prefs.language); 
        setFeedPapers(results); 
    } catch (e) {
        console.error(e);
    } finally {
        setIsSearching(false);
    }
  };

  const handleSearchSubmit = () => {
      if (searchScope === 'web') {
          handleWebSearch();
      }
  };

  const handleReset = () => {
    localStorage.removeItem('research_radar_prefs');
    clearDatabase();
    setPrefs(null);
    setFeedPapers([]);
    setLibraryPapers([]);
    setIsSettingsOpen(false);
  };

  const SearchBar = ({ className = "" }: { className?: string }) => (
    <div className={`relative ${className}`}>
        <div className="absolute left-2 top-1.5 z-10">
            <button 
                onClick={() => { setSearchScope(prev => prev === 'local' ? 'web' : 'local'); setSearchQuery(''); refreshData(prefs!); }}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-bold transition-all ${
                    searchScope === 'local' 
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                }`}
                title={searchScope === 'local' ? "Switch to Web Search" : "Switch to Local Filter"}
            >
                {searchScope === 'local' ? <Search className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                {searchScope === 'local' ? 'FILTER' : 'WEB'}
            </button>
        </div>
        <input 
            type="text" 
            placeholder={
                searchScope === 'web' 
                ? (prefs?.language === 'zh' ? t.zh.searchPlaceholder : t.en.searchPlaceholder)
                : (prefs?.language === 'zh' ? t.zh.filterPlaceholder : t.en.filterPlaceholder)
            }
            className={`w-full pl-24 pr-10 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 outline-none ${
                searchScope === 'local'
                    ? 'bg-slate-50 border-slate-200 focus:ring-emerald-500 focus:border-transparent'
                    : 'bg-white border-emerald-200 focus:ring-emerald-500 focus:border-transparent shadow-sm'
            }`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
        />
        <button 
            onClick={handleSearchSubmit}
            className={`absolute right-3 top-2.5 ${searchScope === 'web' && searchQuery ? 'text-emerald-600 hover:text-emerald-700' : 'text-slate-400'}`}
            disabled={searchScope === 'local'}
        >
            {searchScope === 'web' ? <ArrowRight className="w-4 h-4" /> : <Search className="w-4 h-4" />}
        </button>
    </div>
  );

  const displayedPapers = getDisplayedPapers();

  if (!prefs) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const lang = prefs.language || 'en';
  const T = t[lang];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(s) => { setApiSettings(s); localStorage.setItem('research_radar_api_settings', JSON.stringify(s)); }}
        currentSettings={apiSettings}
        onReset={handleReset}
        language={lang}
        onTranslateLibrary={handleTranslateLibrary}
        isTranslating={isTranslating}
      />

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 md:h-screen sticky top-0 z-20 flex flex-col">
        {/* Clickable Logo */}
        <button 
            onClick={() => { setView('feed'); setSearchQuery(''); refreshData(prefs); setSearchScope('local'); }}
            className="w-full p-6 border-b border-slate-800 flex items-center gap-3 hover:bg-slate-800 transition-colors text-left focus:outline-none"
        >
          <div className="bg-emerald-600 p-2 rounded-lg">
            <Sprout className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Research Farm</span>
        </button>
        
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          <button 
            onClick={() => { setView('feed'); setSearchQuery(''); refreshData(prefs); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'feed' ? 'bg-emerald-700 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Wheat className="w-5 h-5" />
            <div className="flex-1 text-left">{T.harvest}</div>
            {feedPapers.length > 0 && <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full">{feedPapers.length}</span>}
          </button>

          <button 
            onClick={() => { setView('library'); setSearchQuery(''); refreshData(prefs); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'library' ? 'bg-emerald-700 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Warehouse className="w-5 h-5" />
            <div className="flex-1 text-left">{T.barn}</div>
            <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full">{libraryPapers.length}</span>
          </button>
          
          <button 
            onClick={() => setView('chat')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'chat' ? 'bg-emerald-700 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <MessageSquare className="w-5 h-5" />
            {T.agronomist}
          </button>

           <button 
            onClick={() => setIsSettingsOpen(true)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-slate-400 hover:bg-slate-800 hover:text-white`}
          >
            <Settings className="w-5 h-5" />
            {T.settings}
          </button>
          
          {/* Active Topics Management */}
          {prefs.topics && (
             <div className="mt-6 pt-4 border-t border-slate-800 px-2">
                <div className="flex items-center justify-between mb-3 px-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Hash className="w-3 h-3" />
                        {T.crops}
                    </h3>
                    <button 
                        onClick={() => setIsAddingTopic(!isAddingTopic)}
                        className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded"
                        title="Plant New Crop"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>

                {isAddingTopic && (
                    <div className="mb-3 px-2 animate-in fade-in slide-in-from-top-1">
                        <input 
                            type="text" 
                            autoFocus
                            className="w-full bg-slate-800 border border-slate-600 text-white text-xs rounded px-2 py-1.5 outline-none focus:border-emerald-500 placeholder-slate-500"
                            placeholder={T.enterCrop}
                            value={newTopicInput}
                            onChange={(e) => setNewTopicInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddTopic();
                                if (e.key === 'Escape') {
                                    setIsAddingTopic(false);
                                    setNewTopicInput('');
                                }
                            }}
                        />
                    </div>
                )}
                
                <div className="flex flex-wrap gap-2 px-2">
                    {prefs.topics.map((topic, idx) => (
                        <div key={idx} className="group relative inline-flex max-w-full">
                            <span className="text-xs text-slate-300 bg-slate-800 px-2 py-1 pr-6 rounded-md border border-slate-700 break-words truncate w-full hover:border-slate-500 transition-colors cursor-default">
                                {topic}
                            </span>
                            <button 
                                onClick={() => handleRemoveTopic(topic)}
                                className="absolute right-1 top-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                                title="Remove crop"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    {prefs.topics.length === 0 && !isAddingTopic && (
                        <span className="text-xs text-slate-500 italic">{T.noCropsPlanted}</span>
                    )}
                </div>
             </div>
          )}
        </nav>

        {/* Sync Status Panel (Only relevant for Feed) */}
        <div className="px-4 py-4 mx-4 bg-slate-800/50 rounded-xl border border-slate-700/50 mb-2 mt-2">
            <div className="text-xs text-slate-500 mb-3 flex justify-between">
               <span>{T.lastHarvest}:</span>
               <span>{prefs.lastSync ? new Date(prefs.lastSync).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : T.never}</span>
            </div>

            <button 
                onClick={() => handleSyncFeed(prefs)}
                disabled={syncing}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                    syncing 
                        ? 'bg-emerald-500/20 text-emerald-300 cursor-wait' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
            >
                {syncing ? (
                    <>
                        <RefreshCw className="w-3 h-3 animate-spin" /> {T.harvesting} {prefs.topics.length}...
                    </>
                ) : (
                    <>
                        <RefreshCw className="w-3 h-3" /> {T.harvestNow}
                    </>
                )}
            </button>
        </div>

        <div className="p-6 mt-auto border-t border-slate-800 bg-slate-900">
            {/* Time Range Selector */}
            <div className="mb-0">
                 <div className="flex items-center gap-2 mb-2 text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs uppercase font-bold">Filter</span>
                </div>
                <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1 rounded-lg">
                    {(['24h', 'week', 'month'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => updateTimeRange(t)}
                            className={`py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                                prefs.timeRange === t
                                    ? 'bg-emerald-500 text-white shadow-sm' 
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 md:h-screen md:overflow-y-auto">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                {view === 'feed' && <Wheat className="w-6 h-6 text-emerald-600" />}
                {view === 'library' && <Warehouse className="w-6 h-6 text-emerald-600" />}
                {view === 'chat' && <MessageSquare className="w-6 h-6 text-emerald-600" />}
                
                {view === 'feed' ? T.harvest : (view === 'library' ? T.barn : T.agronomist)}
            </h1>
            <p className="text-sm text-slate-500 flex items-center gap-2">
                {view === 'feed' && T.harvestDesc}
                {view === 'library' && T.barnDesc}
                {view === 'chat' && T.agronomistDesc}
                {syncing && <span className="text-emerald-600 flex items-center gap-1 text-xs bg-emerald-50 px-2 py-0.5 rounded-full ml-2"><RefreshCw className="w-3 h-3 animate-spin"/> {T.harvesting}...</span>}
            </p>
          </div>
          
          <div className="flex items-center gap-4 flex-1 justify-end">
             {/* Language Toggle Slider */}
             <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${lang === 'en' ? 'text-emerald-700' : 'text-slate-400'}`}>EN</span>
                <button 
                    onClick={toggleLanguage}
                    className="w-10 h-5 bg-slate-200 rounded-full relative shadow-inner transition-colors duration-300 focus:outline-none"
                    title={lang === 'en' ? "Switch to Chinese" : "Switch to English"}
                >
                    <div 
                        className={`absolute top-1 left-1 w-3 h-3 bg-emerald-600 rounded-full shadow-md transition-transform duration-300 ${lang === 'zh' ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                </button>
                <span className={`text-xs font-bold ${lang === 'zh' ? 'text-emerald-700' : 'text-slate-400'}`}>中</span>
             </div>

             {(view === 'feed' || view === 'library') && (
                 <div className="hidden sm:block w-full max-w-md">
                    <SearchBar />
                 </div>
             )}
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto">
          {(view === 'feed' || view === 'library') && (
            <>
                 <div className="sm:hidden mb-6">
                    <SearchBar />
                 </div>

              {loading || isSearching ? (
                <div className="flex flex-col items-center justify-center h-96">
                  <div className="relative">
                      <div className={`w-16 h-16 border-4 rounded-full animate-spin ${searchScope === 'web' ? 'border-emerald-200 border-t-emerald-600' : 'border-slate-200 border-t-slate-600'}`}></div>
                  </div>
                  <p className="mt-4 text-slate-600 font-medium">
                      {isSearching ? 'Scouting global fields...' : 'Loading crops...'}
                  </p>
                </div>
              ) : (
                <>
                    {displayedPapers.length === 0 ? (
                        <div className="text-center py-20 text-slate-500 max-w-md mx-auto">
                            {searchQuery ? (
                                <>
                                    <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-800 mb-2">{T.noCropsFound}</h3>
                                    <p className="mb-6">
                                        {T.noCropsDesc} "{searchQuery}"
                                    </p>
                                    {searchScope === 'local' && view === 'feed' && (
                                        <button 
                                            onClick={() => { setSearchScope('web'); refreshData(prefs); }}
                                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700 transition-colors flex items-center gap-2 mx-auto"
                                        >
                                            <Globe className="w-4 h-4" /> {T.scoutWeb}
                                        </button>
                                    )}
                                </>
                            ) : (
                                <>
                                    {view === 'library' ? (
                                         <>
                                            <Warehouse className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-slate-800 mb-2">{T.emptyBarn}</h3>
                                            <p>{T.emptyBarnDesc}</p>
                                         </>
                                    ) : (
                                         <>
                                            <Wheat className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-slate-800 mb-2">{T.emptyHarvest}</h3>
                                            <button 
                                                onClick={() => handleSyncFeed(prefs)}
                                                disabled={syncing}
                                                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                            >
                                                {T.startHarvesting}
                                            </button>
                                         </>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {displayedPapers.map((paper) => (
                                <PaperCard 
                                    key={paper.id} 
                                    paper={paper} 
                                    isInLibrary={isPaperInLibrary(paper)}
                                    onToggleLibrary={handleToggleLibrary}
                                    language={lang}
                                />
                            ))}
                        </div>
                    )}
                </>
              )}
            </>
          )}

          {view === 'chat' && (
             <div className="max-w-4xl mx-auto">
                 {libraryPapers.length === 0 ? (
                      <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                          <Warehouse className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                          <h2 className="text-xl font-bold text-slate-800 mb-2">{T.emptyBarnChatTitle}</h2>
                          <p className="text-slate-500 mb-6 max-w-md mx-auto">{T.emptyBarnChatDesc}</p>
                          <button onClick={() => setView('feed')} className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">{T.goToHarvest}</button>
                      </div>
                 ) : (
                     <>
                        <div className="mb-6 bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-sm text-emerald-800 flex items-center justify-between">
                            <span className="flex items-center gap-2"><Database className="w-4 h-4"/> {T.analyzing} <strong>{libraryPapers.length} {T.storedCrops}</strong>.</span>
                            <button onClick={() => setView('library')} className="text-emerald-700 hover:text-emerald-900 font-medium text-xs underline">{T.manageBarn}</button>
                        </div>
                        <ChatInterface contextPapers={libraryPapers} language={lang} />
                     </>
                 )}
             </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;