import { useState, useEffect } from 'react';
import { Language } from '../types/Language';

const BOOKMARKS_KEY = 'rinzo-bookmarks';

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<Language[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(BOOKMARKS_KEY);
    if (saved) {
      try {
        setBookmarks(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load bookmarks:', error);
      }
    }
  }, []);

  const addBookmark = (language: Language) => {
    const newBookmarks = [...bookmarks, language];
    setBookmarks(newBookmarks);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(newBookmarks));
  };

  const removeBookmark = (languageId: string) => {
    const newBookmarks = bookmarks.filter(lang => lang.id !== languageId);
    setBookmarks(newBookmarks);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(newBookmarks));
  };

  const isBookmarked = (languageId: string) => {
    return bookmarks.some(lang => lang.id === languageId);
  };

  const toggleBookmark = (language: Language) => {
    if (isBookmarked(language.id)) {
      removeBookmark(language.id);
    } else {
      addBookmark(language);
    }
  };

  return {
    bookmarks,
    addBookmark,
    removeBookmark,
    isBookmarked,
    toggleBookmark
  };
};
