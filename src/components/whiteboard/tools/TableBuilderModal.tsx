'use client';

import React, { useState } from 'react';
import { TableElement } from '@/types/whiteboard';
import { X, Check, Table, Plus, Trash2 } from 'lucide-react';

interface TableBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (tbl: Omit<TableElement, 'id' | 'zIndex'>) => void;
}

export const TableBuilderModal: React.FC<TableBuilderModalProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const [cols, setCols] = useState(3);
  const [rows, setRows] = useState(3);
  const [headers, setHeaders] = useState<string[]>([
    'Reaction / Experiment',
    'Reagents & Catalyst',
    'Observations & Products',
  ]);
  const [cells, setCells] = useState<string[][]>([
    ['Addition of Br2 in CCl4', 'Bromine water (Reddish-brown)', 'Decolorization (Confirms C=C)'],
    ['Nitration of Phenol', 'Dilute HNO3 at 20°C', 'ortho + para nitrophenol mixture'],
    ['Esterification Reaction', 'Carboxylic acid + Alcohol, H2SO4', 'Fruity odor (Ester) + H2O'],
  ]);

  if (!isOpen) return null;

  const handleHeaderChange = (index: number, val: string) => {
    const updated = [...headers];
    updated[index] = val;
    setHeaders(updated);
  };

  const handleCellChange = (r: number, c: number, val: string) => {
    const updated = cells.map((row) => [...row]);
    if (!updated[r]) updated[r] = [];
    updated[r][c] = val;
    setCells(updated);
  };

  const handleAddRow = () => {
    setRows((prev) => prev + 1);
    setCells((prev) => [...prev, Array(cols).fill('')]);
  };

  const handleDeleteRow = (rIdx: number) => {
    if (rows <= 1) return;
    setRows((prev) => prev - 1);
    setCells((prev) => prev.filter((_, idx) => idx !== rIdx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInsert({
      type: 'table',
      x: 150,
      y: 350,
      rows,
      cols,
      headers,
      cells,
      colWidths: headers.map(() => 220),
      rowHeight: 44,
      borderColor: '#D1CDC4',
      headerBgColor: '#501325',
      cellBgColor: '#FFFFFF',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-ivory-100 border border-hairline rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-burgundy-100 text-burgundy-900 flex items-center justify-center font-formula font-bold text-sm">
              <Table className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-charcoal-900 font-display">
                Academic Table & Comparison Builder
              </h3>
              <p className="text-xs text-charcoal-100 font-sans">
                Build structured chemistry comparison tables with customizable columns and rows
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Table Data Matrix */}
          <div className="border border-hairline rounded-xl overflow-x-auto max-h-72 bg-ivory-50 p-2">
            <table className="w-full text-xs text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-burgundy-900 text-ivory-100">
                  {headers.map((h, cIdx) => (
                    <th key={cIdx} className="p-2 border border-burgundy-800 font-display">
                      <input
                        type="text"
                        value={h}
                        onChange={(e) => handleHeaderChange(cIdx, e.target.value)}
                        placeholder={`Column ${cIdx + 1}`}
                        className="w-full bg-transparent text-ivory-100 placeholder-ivory-300/60 font-bold focus:outline-none focus:ring-1 focus:ring-ochre rounded px-1"
                      />
                    </th>
                  ))}
                  <th className="p-2 w-10 text-center border border-burgundy-800"></th>
                </tr>
              </thead>
              <tbody>
                {cells.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-hairline hover:bg-ivory-200/50">
                    {headers.map((_, cIdx) => (
                      <td key={cIdx} className="p-1.5 border border-hairline">
                        <input
                          type="text"
                          value={row[cIdx] || ''}
                          onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                          placeholder="Type cell value..."
                          className="w-full px-2 py-1 rounded bg-ivory-100 text-charcoal-900 font-sans text-xs focus:outline-none focus:ring-1 focus:ring-burgundy-500"
                        />
                      </td>
                    ))}
                    <td className="p-1 text-center border border-hairline">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(rIdx)}
                        title="Delete Row"
                        className="p-1 rounded text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-burgundy-500 hover:text-burgundy-900 px-3 py-1.5 rounded-lg border border-dashed border-burgundy-300 hover:bg-burgundy-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Table Row</span>
            </button>

            <span className="text-[11px] text-charcoal-100 font-sans">
              {rows} rows × {cols} columns
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-hairline text-xs font-semibold text-charcoal-100 hover:text-charcoal-900 hover:bg-ivory-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              <Check className="w-4 h-4 text-ochre" />
              <span>Insert Table onto Board</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
