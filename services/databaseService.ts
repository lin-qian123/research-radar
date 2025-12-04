import { Paper } from '../types';

const DB_KEY = 'research_radar_library'; // The curated "My Library"
const INBOX_KEY = 'research_radar_inbox'; // The "Daily Feed" / Auto-harvest results

// --- Library Operations (The "Database") ---

export const getLibraryPapers = (): Paper[] => {
  try {
    const saved = localStorage.getItem(DB_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Library read error", e);
    return [];
  }
};

export const addPaperToLibrary = (paper: Paper): boolean => {
  try {
    const library = getLibraryPapers();
    // Dedup by title
    if (library.some(p => p.title === paper.title)) return false;
    
    const updated = [paper, ...library];
    localStorage.setItem(DB_KEY, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.error("Library add error", e);
    return false;
  }
};

export const updateLibrary = (papers: Paper[]) => {
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(papers));
    } catch (e) {
        console.error("Library update error", e);
    }
};

export const removePaperFromLibrary = (paperId: string) => {
    try {
        const library = getLibraryPapers();
        const updated = library.filter(p => p.id !== paperId);
        localStorage.setItem(DB_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error("Library remove error", e);
    }
};

export const isPaperInLibrary = (paper: Paper): boolean => {
    const library = getLibraryPapers();
    return library.some(p => p.title === paper.title); // Check by title to be safe across sources
};

// --- Inbox Operations (The "Daily Feed") ---

export const getInboxPapers = (): Paper[] => {
  try {
    const saved = localStorage.getItem(INBOX_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Inbox read error", e);
    return [];
  }
};

export const saveToInbox = (newPapers: Paper[]): number => {
  try {
    const existingPapers = getInboxPapers();
    let addedCount = 0;

    const existingTitles = new Set(existingPapers.map(p => p.title.toLowerCase().trim()));
    const mergedPapers = [...existingPapers];

    newPapers.forEach(paper => {
      const normalizedTitle = paper.title.toLowerCase().trim();
      if (!existingTitles.has(normalizedTitle)) {
        mergedPapers.push(paper);
        existingTitles.add(normalizedTitle);
        addedCount++;
      }
    });

    // Sort by published date (newest first)
    mergedPapers.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());

    localStorage.setItem(INBOX_KEY, JSON.stringify(mergedPapers));
    return addedCount;
  } catch (e) {
    console.error("Inbox write error", e);
    return 0;
  }
};

// --- Utilities ---

export const clearDatabase = () => {
  localStorage.removeItem(DB_KEY);
  localStorage.removeItem(INBOX_KEY);
};

export const filterPapers = (papers: Paper[], timeRange: '24h' | 'week' | 'month'): Paper[] => {
  const now = new Date();
  const rangeMap = {
    '24h': 24 * 60 * 60 * 1000,
    'week': 7 * 24 * 60 * 60 * 1000,
    'month': 30 * 24 * 60 * 60 * 1000,
  };

  const msLimit = rangeMap[timeRange];

  return papers.filter(p => {
    const pubDate = new Date(p.publishedDate);
    if (isNaN(pubDate.getTime())) return true; 
    return (now.getTime() - pubDate.getTime()) <= msLimit;
  });
};