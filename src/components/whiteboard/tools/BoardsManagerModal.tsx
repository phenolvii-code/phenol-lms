'use client';

import React, { useState, useEffect } from 'react';
import { WhiteboardDocument } from '@/types/whiteboard';
import { listAllBoards, deleteBoardFromStorage, saveBoardToStorage } from '@/lib/whiteboard-storage';
import { X, Plus, Trash2, Copy, FileText, Check, Clock } from 'lucide-react';

interface BoardsManagerModalProps {
  isOpen: boolean;
  currentBoardId: string;
  onClose: () => void;
  onSelectBoard: (board: WhiteboardDocument) => void;
  onCreateNewBoard: (title: string) => void;
}

export const BoardsManagerModal: React.FC<BoardsManagerModalProps> = ({
  isOpen,
  currentBoardId,
  onClose,
  onSelectBoard,
  onCreateNewBoard,
}) => {
  const [boards, setBoards] = useState<WhiteboardDocument[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const refreshList = async () => {
    const list = await listAllBoards();
    setBoards(list);
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateNewBoard(newTitle.trim());
    setNewTitle('');
    setIsCreating(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this board from local storage?')) {
      await deleteBoardFromStorage(id);
      await refreshList();
    }
  };

  const handleDuplicate = async (board: WhiteboardDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    const cloned: WhiteboardDocument = {
      ...board,
      id: `board-${Date.now()}`,
      title: `${board.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveBoardToStorage(cloned);
    await refreshList();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-ivory-100 border border-hairline rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-burgundy-900 text-ochre flex items-center justify-center font-formula font-bold text-sm">
              📋
            </div>
            <div>
              <h3 className="text-lg font-bold text-charcoal-900 font-display">
                Lecture Boards & Offline Sessions
              </h3>
              <p className="text-xs text-charcoal-100 font-sans">
                Manage, switch, or backup saved lecture whiteboards stored in IndexedDB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-charcoal-50 hover:text-charcoal-900 hover:bg-ivory-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Create New Board */}
        {isCreating ? (
          <form onSubmit={handleCreate} className="p-4 rounded-xl border border-burgundy-300 bg-burgundy-50/50 space-y-3">
            <label className="block text-xs font-bold text-burgundy-900 uppercase tracking-wider">
              New Board Title / Lecture Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Chapter 4: Electrochemistry & Galvanic Cells"
                autoFocus
                className="flex-1 px-3 py-2 rounded-lg border border-hairline bg-ivory-50 text-xs font-sans text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-burgundy-500"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-burgundy-900 text-ivory-100 text-xs font-bold hover:bg-black transition-colors shrink-0"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-2 rounded-lg border border-hairline text-xs font-semibold text-charcoal-100 hover:bg-ivory-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-charcoal-900">
              Saved Sessions ({boards.length})
            </span>
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-ochre" />
              <span>Create New Board</span>
            </button>
          </div>
        )}

        {/* Boards List */}
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {boards.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-hairline rounded-xl text-charcoal-100 text-xs">
              No saved whiteboards found. Click &quot;Create New Board&quot; to begin.
            </div>
          ) : (
            boards.map((b) => {
              const isCurrent = b.id === currentBoardId;
              return (
                <div
                  key={b.id}
                  onClick={() => {
                    onSelectBoard(b);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'border-burgundy-500 bg-burgundy-50/60 shadow-sm'
                      : 'border-hairline bg-ivory-50 hover:border-burgundy-200 hover:bg-ivory-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isCurrent
                          ? 'bg-burgundy-900 text-ochre'
                          : 'bg-ivory-200 border border-hairline text-charcoal-100'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-charcoal-900 font-display">
                          {b.title}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-formula font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-charcoal-100 font-sans mt-0.5">
                        <span className="flex items-center gap-1 font-formula">
                          <Clock className="w-3 h-3" />
                          {new Date(b.updatedAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span>•</span>
                        <span>{b.elements?.length || 0} elements</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleDuplicate(b, e)}
                      title="Duplicate Board"
                      className="p-1.5 rounded-md text-charcoal-50 hover:text-charcoal-900 hover:bg-ivory-300 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(b.id, e)}
                      title="Delete Board"
                      className="p-1.5 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-hairline">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-hairline text-xs font-semibold text-charcoal-100 hover:text-charcoal-900 hover:bg-ivory-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
