import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bug, X, Plus, Clipboard, Trash2, Bot, MessageSquare, ExternalLink, Check } from 'lucide-react';
import { clsx } from 'clsx';
import apiClient from '@/api/client';

interface DevNoteEntry {
  id: string;
  type: 'note' | 'response' | 'comment';
  text: string;
  page?: string;
  ts: string;
  parentId?: string;
}

const POLL_MS = 8000;

async function fetchNotes(): Promise<DevNoteEntry[]> {
  const res = await apiClient.get('/dev-notes');
  const data = res.data as any;
  return Array.isArray(data) ? data : [];
}

async function postEntry(type: 'note' | 'response' | 'comment', text: string, page?: string, parentId?: string) {
  const res = await apiClient.post('/dev-notes', { type, text, page, ...(parentId ? { parentId } : {}) });
  return res.data as DevNoteEntry;
}

async function deleteOne(id: string) {
  await apiClient.delete(`/dev-notes/${id}`);
}

async function deleteAll() {
  await apiClient.delete('/dev-notes');
}

export const DevNotesPanel: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<DevNoteEntry[]>([]);
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchNotes();
      setEntries(data);
    } catch {
      // backend not ready yet, ignore
    }
  }, []);

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [load]);

  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 50);
  }, [open]);

  const addNote = async () => {
    const text = draft.trim();
    if (!text || saving) return;
    setSaving(true);
    try {
      const entry = await postEntry('note', text, location.pathname);
      setEntries((prev) => [entry, ...prev]);
      setDraft('');
    } finally {
      setSaving(false);
    }
  };

  const addComment = async (parentId: string) => {
    const text = commentDraft.trim();
    if (!text || saving) return;
    setSaving(true);
    try {
      const entry = await postEntry('comment', text, location.pathname, parentId);
      setEntries((prev) => [entry, ...prev]);
      setCommentDraft('');
      setCommentingOn(null);
    } finally {
      setSaving(false);
    }
  };

  const removeNote = async (id: string) => {
    await deleteOne(id);
    setEntries((prev) => prev.filter((e) => e.id !== id && e.parentId !== id));
  };

  const copyAll = () => {
    if (!entries.length) return;
    const lines = entries
      .map((e) => {
        if (e.type === 'response') return `[Claude] ${new Date(e.ts).toLocaleTimeString()}\n${e.text}`;
        if (e.type === 'comment') return `  [Comment on ${e.parentId}] ${new Date(e.ts).toLocaleTimeString()}\n  ${e.text}`;
        return `[Note] ${e.page ?? ''} — ${new Date(e.ts).toLocaleTimeString()}\n${e.text}`;
      })
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const clearAll = async () => {
    if (!confirm('Clear all notes and responses?')) return;
    await deleteAll();
    setEntries([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      addNote();
    }
  };

  const noteCount = entries.filter((e) => e.type === 'note').length;
  const hasResponse = entries.some((e) => e.type === 'response');

  // Top-level entries (notes and responses), sorted newest first
  const topLevel = entries.filter((e) => !e.parentId);
  // Comments keyed by parentId
  const commentsByParent: Record<string, DevNoteEntry[]> = {};
  entries.filter((e) => e.parentId).forEach((e) => {
    if (!commentsByParent[e.parentId!]) commentsByParent[e.parentId!] = [];
    commentsByParent[e.parentId!].push(e);
  });

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          'fixed bottom-6 right-6 z-[200] flex items-center gap-2 rounded-full shadow-lg',
          'px-4 py-2.5 text-sm font-semibold transition-all',
          open
            ? 'bg-gray-800 text-white dark:bg-gray-700'
            : hasResponse
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white animate-pulse'
              : 'bg-red-500 hover:bg-red-600 text-white'
        )}
        title="Dev Notes"
      >
        {open ? (
          <X className="h-4 w-4" />
        ) : (
          <>
            <Bug className="h-4 w-4 flex-shrink-0" />
            <span>{hasResponse ? 'Reply!' : 'Notes'}</span>
            {noteCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-red-600 text-xs font-bold">
                {noteCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-[199] w-[420px] max-h-[78vh] flex flex-col rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-red-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Dev Notes</span>
              {entries.length > 0 && (
                <span className="text-xs text-gray-400">({entries.length})</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {entries.length > 0 && (
                <>
                  <button
                    onClick={copyAll}
                    title="Copy all to clipboard"
                    className="p-1.5 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {copied
                      ? <span className="text-xs text-green-600 font-medium">Copied!</span>
                      : <Clipboard className="h-3.5 w-3.5" />
                    }
                  </button>
                  <button
                    onClick={clearAll}
                    title="Clear all"
                    className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* New note input */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="text-xs font-mono text-primary-500 dark:text-primary-400 mb-1.5 truncate">
              {location.pathname}
            </div>
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the issue… (Ctrl+Enter to save)"
              rows={3}
              className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-red-400 placeholder-gray-400"
            />
            <button
              onClick={addNote}
              disabled={!draft.trim() || saving}
              className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-1.5 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              {saving ? 'Saving…' : 'Add note'}
            </button>
          </div>

          {/* Entries */}
          <div className="flex-1 overflow-y-auto">
            {topLevel.length === 0 ? (
              <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">
                No notes yet. Start testing!
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {topLevel.map((entry) => (
                  <li key={entry.id}>
                    {entry.type === 'response' ? (
                      // Claude Code response
                      <div className="px-3 py-3 bg-emerald-50 dark:bg-emerald-900/10 border-l-4 border-emerald-400 dark:border-emerald-600">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Bot className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            Claude Code
                          </span>
                          <span className="text-xs text-gray-400 ml-auto">
                            {new Date(entry.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button
                            onClick={() => removeNote(entry.id)}
                            title="Mark as done / delete"
                            className="p-0.5 rounded text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                          {entry.text}
                        </p>
                      </div>
                    ) : (
                      // Tester note
                      <div className="px-3 py-2.5 group hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {entry.page && (
                                <button
                                  onClick={() => { navigate(entry.page!); setOpen(false); }}
                                  title={`Go to ${entry.page}`}
                                  className="text-xs font-mono text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-0.5 truncate max-w-[180px]"
                                >
                                  <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                                  <span className="truncate">{entry.page}</span>
                                </button>
                              )}
                              <span className="text-xs text-gray-400 flex-shrink-0 ml-auto">
                                {new Date(entry.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                              {entry.text}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setCommentingOn(commentingOn === entry.id ? null : entry.id); setCommentDraft(''); }}
                              title="Add comment"
                              className="p-1 rounded text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => removeNote(entry.id)}
                              title="Delete (mark as fixed)"
                              className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Comments on this note */}
                        {(commentsByParent[entry.id] ?? []).map((comment) => (
                          <div key={comment.id} className="mt-1.5 ml-4 pl-3 border-l-2 border-gray-200 dark:border-gray-600 group/comment">
                            <div className="flex items-center gap-1.5">
                              {comment.type === 'response'
                                ? <Bot className="h-3 w-3 text-emerald-500" />
                                : <MessageSquare className="h-3 w-3 text-gray-400" />
                              }
                              <span className="text-xs text-gray-400">
                                {new Date(comment.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <button
                                onClick={() => removeNote(comment.id)}
                                className="ml-auto p-0.5 opacity-0 group-hover/comment:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap mt-0.5">
                              {comment.text}
                            </p>
                          </div>
                        ))}

                        {/* Inline comment input */}
                        {commentingOn === entry.id && (
                          <div className="mt-2 ml-4">
                            <textarea
                              autoFocus
                              value={commentDraft}
                              onChange={(e) => setCommentDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                  e.preventDefault();
                                  addComment(entry.id);
                                }
                                if (e.key === 'Escape') { setCommentingOn(null); setCommentDraft(''); }
                              }}
                              placeholder="Add a comment… (Ctrl+Enter)"
                              rows={2}
                              className="w-full text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-primary-400"
                            />
                            <div className="flex gap-1 mt-1">
                              <button
                                onClick={() => addComment(entry.id)}
                                disabled={!commentDraft.trim() || saving}
                                className="text-xs px-2 py-0.5 rounded bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-40 transition-colors"
                              >
                                Comment
                              </button>
                              <button
                                onClick={() => { setCommentingOn(null); setCommentDraft(''); }}
                                className="text-xs px-2 py-0.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
};
