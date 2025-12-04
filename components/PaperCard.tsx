import React, { useState } from 'react';
import { Paper } from '../types';
import { ExternalLink, Calendar, Users, Share2, TrendingUp, BookOpen, Plus, Check, FileDown, Quote } from 'lucide-react';

interface PaperCardProps {
  paper: Paper;
  isInLibrary?: boolean;
  onToggleLibrary?: (paper: Paper) => void;
  categories?: string[];
  language?: 'en' | 'zh';
}

const t = {
    en: {
        citedBy: "Cited by",
        preprint: "Preprint / New",
        keyTakeaway: "Key Takeaway",
        saved: "Saved",
        addToLib: "Add to Lib",
        readSource: "Read Source",
        match: "Match"
    },
    zh: {
        citedBy: "被引次数",
        preprint: "预印本 / 最新",
        keyTakeaway: "核心结论",
        saved: "已保存",
        addToLib: "加入谷仓",
        readSource: "阅读原文",
        match: "相关度"
    }
};

const PaperCard: React.FC<PaperCardProps> = ({ paper, isInLibrary = false, onToggleLibrary, categories = [], language = 'en' }) => {
  const [showCatPicker, setShowCatPicker] = useState(false);
  const T = t[language];

  const handleAddClick = () => {
    if (!onToggleLibrary) return;
    onToggleLibrary(paper);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full group relative overflow-hidden">
      
      {/* Relevance Badge */}
      <div className="absolute top-0 right-0 p-3 flex gap-2">
        <div className={`px-2 py-1 rounded-full text-xs font-bold border ${
            paper.relevanceScore > 90 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
            {paper.relevanceScore}% {T.match}
        </div>
      </div>

      <div className="mb-4 pr-16">
        <div className="flex flex-wrap items-center gap-2 mb-2">
             <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {paper.journal || 'Preprint'}
            </span>
            
            {/* Logic for Impact Factor OR Citation Count */}
            {paper.impactFactor && paper.impactFactor !== 'N/A' && paper.impactFactor !== 'Preprint' && !paper.impactFactor.startsWith("Cited") && (
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {paper.impactFactor}
                </span>
            )}
            
            {/* Show Citation Count if available (Semantic Scholar) */}
            {paper.citationCount !== undefined && paper.citationCount > 0 && (
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 flex items-center gap-1" title="Citation Count">
                    <Quote className="w-3 h-3" />
                    {T.citedBy} {paper.citationCount}
                </span>
            )}

            {(paper.impactFactor === 'Preprint' || (!paper.impactFactor && !paper.citationCount)) && (
                 <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {T.preprint}
                </span>
            )}
        </div>
       
        <h3 className="text-xl font-bold text-slate-900 mt-1 leading-snug group-hover:text-emerald-700 transition-colors">
          <a href={paper.url} target="_blank" rel="noopener noreferrer">
             {paper.title}
          </a>
        </h3>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4 flex-wrap">
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>{paper.authors.slice(0, 2).join(', ')}{paper.authors.length > 2 ? ' et al.' : ''}</span>
        </div>
        <span className="text-slate-300">•</span>
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{paper.publishedDate}</span>
        </div>
      </div>

      <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-grow">
        {paper.summary}
      </p>

      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
        <p className="text-xs font-medium text-slate-700">
            <span className="text-emerald-700 font-bold">{T.keyTakeaway}:</span> {paper.keyTakeaway}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {paper.tags.map((tag, idx) => (
          <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">
            #{tag}
          </span>
        ))}
        {paper.category && (
             <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs rounded-md">
                📂 {paper.category}
            </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
         <div className="flex gap-2">
            {onToggleLibrary && (
                 <button 
                    onClick={handleAddClick}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isInLibrary 
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                 >
                     {isInLibrary ? (
                         <>
                            <Check className="w-4 h-4" /> {T.saved}
                         </>
                     ) : (
                         <>
                            <Plus className="w-4 h-4" /> {T.addToLib}
                         </>
                     )}
                 </button>
            )}
         </div>
         
         <div className="flex gap-3">
             <button className="text-slate-400 hover:text-slate-600 transition-colors">
                 <Share2 className="w-5 h-5" />
             </button>
            
            {/* Show PDF Download if available (Semantic Scholar) */}
            {paper.openAccessPdf && (
                <a 
                    href={paper.openAccessPdf} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition-colors"
                >
                    <FileDown className="w-4 h-4" /> PDF
                </a>
            )}

            {paper.url && !paper.openAccessPdf && (
                <a 
                    href={paper.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                    {T.readSource} <ExternalLink className="w-4 h-4" />
                </a>
            )}
         </div>
      </div>
    </div>
  );
};

export default PaperCard;