'use client';

import { useEffect, useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, Transition } from '@headlessui/react';
import { Search, Video, BookOpen, CheckCircle, Clock, X } from 'lucide-react';

interface CommandItem {
  id: string;
  type: 'submission' | 'lesson';
  title: string;
  thumbnail: string | null;
  status?: string;
  completed?: boolean;
  description?: string;
  url: string;
  date?: string;
}

export default function CommandPalette() {
  const router = useRouter();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<CommandItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<CommandItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Open with Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch data when opened
  useEffect(() => {
    if (isOpen && user) {
      fetchData();
    }
  }, [isOpen, user]);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const token = await user.getIdToken();
      
      // Fetch submissions
      const submissionsRes = await fetch('/api/submissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const submissionsData = await submissionsRes.json();
      
      // Fetch lessons (if you have this endpoint)
      const lessonsRes = await fetch('/api/athlete/content?type=lesson', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const lessonsData = await lessonsRes.json();

      const allItems: CommandItem[] = [
        // Add submissions
        ...(submissionsData.submissions || []).map((sub: any) => ({
          id: sub.id,
          type: 'submission' as const,
          title: sub.skillName || sub.videoFileName || 'Video Submission',
          thumbnail: sub.thumbnailUrl,
          status: sub.status,
          completed: sub.status === 'complete',
          description: sub.athleteContext,
          url: `/dashboard/athlete/reviews/${sub.id}`,
          date: sub.createdAt
        })),
        // Add lessons
        ...(lessonsData.data?.content || []).map((lesson: any) => ({
          id: lesson.id,
          type: 'lesson' as const,
          title: lesson.title,
          thumbnail: lesson.thumbnailUrl,
          completed: lesson.completed,
          description: lesson.description,
          url: `/dashboard/athlete-lessons/${lesson.id}`,
          date: lesson.createdAt
        }))
      ];

      setItems(allItems);
      setFilteredItems(allItems);
    } catch (error) {
      console.error('Error fetching command palette data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter items based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(items);
      setSelectedIndex(0);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = items.filter(item =>
      item.title.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    );
    setFilteredItems(filtered);
    setSelectedIndex(0);
  }, [searchQuery, items]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex]);

  const handleSelect = (item: CommandItem) => {
    router.push(item.url);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
      >
        <Search className="w-4 h-4" />
        <span>Quick search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-gray-500 bg-gray-100 rounded">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Command Palette Modal */}
      <Transition show={isOpen} as={Fragment}>
        <Dialog onClose={() => setIsOpen(false)} className="relative z-50">
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
          </Transition.Child>

          {/* Full-screen container */}
          <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6 md:p-20">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="mx-auto max-w-3xl transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
                {/* Search Input */}
                <div className="relative border-b border-gray-200">
                  <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search videos and lessons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
                  />
                  <button
                    onClick={() => setIsOpen(false)}
                    className="absolute right-4 top-3 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto p-2">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="px-6 py-14 text-center sm:px-14">
                      <Video className="mx-auto h-6 w-6 text-gray-400" />
                      <p className="mt-4 text-sm font-semibold text-gray-900">No results found</p>
                      <p className="mt-2 text-sm text-gray-500">
                        Try searching with different keywords
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredItems.map((item, idx) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`w-full flex items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                            idx === selectedIndex
                              ? 'bg-blue-50 text-blue-900'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                            {item.thumbnail ? (
                              <img
                                src={item.thumbnail}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                {item.type === 'submission' ? (
                                  <Video className="w-6 h-6 text-gray-400" />
                                ) : (
                                  <BookOpen className="w-6 h-6 text-gray-400" />
                                )}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold truncate">
                                {item.title}
                              </p>
                              {item.completed && (
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                              )}
                              {item.status && !item.completed && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                                  item.status === 'in_review' || item.status === 'claimed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {item.status === 'in_review' || item.status === 'claimed' ? 'In Review' : 'Pending'}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {item.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                {item.type === 'submission' ? (
                                  <>
                                    <Video className="w-3 h-3" />
                                    Video
                                  </>
                                ) : (
                                  <>
                                    <BookOpen className="w-3 h-3" />
                                    Lesson
                                  </>
                                )}
                              </span>
                              {item.date && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <span className="text-xs text-gray-400">
                                    {new Date(item.date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Arrow indicator */}
                          {idx === selectedIndex && (
                            <svg
                              className="h-5 w-5 flex-none text-blue-600"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer hint */}
                <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">↑↓</kbd>
                      Navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">↵</kbd>
                      Select
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">Esc</kbd>
                      Close
                    </span>
                  </div>
                  <span>{filteredItems.length} results</span>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}

