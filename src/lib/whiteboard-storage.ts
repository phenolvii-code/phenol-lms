/**
 * PHENOL ACADEMY — Offline-First Whiteboard Storage
 * Pure native IndexedDB implementation with localStorage fallback.
 * Allows Dr. Omar to prepare lectures offline with zero network dependencies.
 */

import { WhiteboardDocument, WhiteboardElement } from '@/types/whiteboard';

const DB_NAME = 'phenol_whiteboard_db';
const DB_VERSION = 1;
const STORE_NAME = 'boards';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('courseId', 'courseId', { unique: false });
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result as IDBDatabase);
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

export async function saveBoardToStorage(doc: WhiteboardDocument): Promise<void> {
  const updatedDoc: WhiteboardDocument = {
    ...doc,
    updatedAt: new Date().toISOString(),
  };

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(updatedDoc);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    // Fallback to localStorage if IndexedDB is restricted
    if (typeof window !== 'undefined') {
      try {
        const listStr = localStorage.getItem('phenol_local_boards') || '[]';
        const list: WhiteboardDocument[] = JSON.parse(listStr);
        const idx = list.findIndex((b) => b.id === doc.id);
        if (idx >= 0) {
          list[idx] = updatedDoc;
        } else {
          list.unshift(updatedDoc);
        }
        localStorage.setItem('phenol_local_boards', JSON.stringify(list));
      } catch (err) {
        console.warn('Fallback storage error:', err);
      }
    }
  }

  // Dispatch live update event for tabs
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('phenol_whiteboard_saved', { detail: updatedDoc.id }));
  }
}

export async function loadBoardFromStorage(id: string): Promise<WhiteboardDocument | null> {
  try {
    const db = await openDatabase();
    return await new Promise<WhiteboardDocument | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    if (typeof window !== 'undefined') {
      try {
        const listStr = localStorage.getItem('phenol_local_boards') || '[]';
        const list: WhiteboardDocument[] = JSON.parse(listStr);
        return list.find((b) => b.id === id) || null;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function listAllBoards(): Promise<WhiteboardDocument[]> {
  try {
    const db = await openDatabase();
    return await new Promise<WhiteboardDocument[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const results: WhiteboardDocument[] = req.result || [];
        results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    if (typeof window !== 'undefined') {
      try {
        const listStr = localStorage.getItem('phenol_local_boards') || '[]';
        const list: WhiteboardDocument[] = JSON.parse(listStr);
        list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        return list;
      } catch {
        return [];
      }
    }
    return [];
  }
}

export async function deleteBoardFromStorage(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    if (typeof window !== 'undefined') {
      try {
        const listStr = localStorage.getItem('phenol_local_boards') || '[]';
        let list: WhiteboardDocument[] = JSON.parse(listStr);
        list = list.filter((b) => b.id !== id);
        localStorage.setItem('phenol_local_boards', JSON.stringify(list));
      } catch {}
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('phenol_whiteboard_deleted'));
  }
}

/**
 * Creates a pre-populated lecture board template for Dr. Omar
 */
export function createDefaultChemistryBoard(): WhiteboardDocument {
  const now = new Date().toISOString();
  return {
    id: `board-${Date.now()}`,
    title: 'Lecture 1: Structure of Benzene & Resonance Hybrid',
    courseId: 'chem-301',
    viewport: { x: 80, y: 80, zoom: 1.0 },
    background: 'grid',
    createdAt: now,
    updatedAt: now,
    elements: [
      {
        id: 'title-1',
        type: 'text',
        x: 100,
        y: 100,
        text: 'PHENOL ACADEMY • Organic Chemistry Studio',
        fontSize: 26,
        color: '#641C32',
        isBold: true,
        zIndex: 1,
      },
      {
        id: 'subtitle-1',
        type: 'text',
        x: 100,
        y: 145,
        text: 'Dr. Omar Magdi • Aromatic Compounds & Electrophilic Substitution',
        fontSize: 16,
        color: '#454952',
        isItalic: true,
        zIndex: 2,
      },
      {
        id: 'benzene-1',
        type: 'molecule',
        name: 'Benzene (C6H6)',
        x: 180,
        y: 280,
        zIndex: 3,
        atoms: [
          { id: 'a1', symbol: 'C', x: 0, y: -60 },
          { id: 'a2', symbol: 'C', x: 52, y: -30 },
          { id: 'a3', symbol: 'C', x: 52, y: 30 },
          { id: 'a4', symbol: 'C', x: 0, y: 60 },
          { id: 'a5', symbol: 'C', x: -52, y: 30 },
          { id: 'a6', symbol: 'C', x: -52, y: -30 },
        ],
        bonds: [
          { id: 'b1', fromAtomId: 'a1', toAtomId: 'a2', bondOrder: 2 },
          { id: 'b2', fromAtomId: 'a2', toAtomId: 'a3', bondOrder: 1 },
          { id: 'b3', fromAtomId: 'a3', toAtomId: 'a4', bondOrder: 2 },
          { id: 'b4', fromAtomId: 'a4', toAtomId: 'a5', bondOrder: 1 },
          { id: 'b5', fromAtomId: 'a5', toAtomId: 'a6', bondOrder: 2 },
          { id: 'b6', fromAtomId: 'a6', toAtomId: 'a1', bondOrder: 1 },
        ],
        curvedArrows: [
          {
            id: 'c1',
            startX: 26,
            startY: -45,
            endX: 52,
            endY: 0,
            controlX: 45,
            controlY: -20,
            barbCount: 2,
          },
        ],
      },
      {
        id: 'formula-1',
        type: 'formula',
        x: 420,
        y: 280,
        equation: 'C6H6 + HNO3 --(conc. H2SO4, 50°C)--> C6H5NO2 + H2O',
        subtitle: 'Nitration of Benzene Mechanism (Formation of NO2+ Electrophile)',
        deltaH: 'ΔH° = -135 kJ/mol (Exothermic)',
        fontSize: 18,
        color: '#18191B',
        zIndex: 4,
      },
      {
        id: 'table-1',
        type: 'table',
        x: 100,
        y: 480,
        rows: 3,
        cols: 3,
        headers: ['Compound', 'Molecular Formula', 'Aromaticity Test'],
        cells: [
          ['Benzene', 'C6H6', 'Passes Hückel Rule (4n+2=6, n=1)'],
          ['Cyclooctatetraene', 'C8H8', 'Non-aromatic (Tub-shaped non-planar)'],
          ['Phenol', 'C6H5OH', 'Highly Activated towards Electrophiles'],
        ],
        colWidths: [180, 160, 320],
        rowHeight: 40,
        borderColor: '#D1CDC4',
        headerBgColor: '#641C32',
        cellBgColor: '#FFFFFF',
        zIndex: 5,
      },
    ],
  };
}
