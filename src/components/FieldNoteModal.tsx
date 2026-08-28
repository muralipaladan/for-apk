import React, { useState } from 'react';
import { X, MapPin, Tag, User, AlignLeft, Check } from 'lucide-react';
import { FieldNote } from '../types';

interface FieldNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveNote: (note: Omit<FieldNote, 'id' | 'timestamp'>) => void;
  initialCoord: { lat: number; lng: number } | null;
}

export const FieldNoteModal: React.FC<FieldNoteModalProps> = ({
  isOpen,
  onClose,
  onSaveNote,
  initialCoord
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FieldNote['category']>('boundary_marker');
  const [surveyNo, setSurveyNo] = useState('');
  const [wardNo, setWardNo] = useState('');
  const [surveyorName, setSurveyorName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSaveNote({
      lat: initialCoord?.lat || 11.115,
      lng: initialCoord?.lng || 76.355,
      title: title.trim(),
      description: description.trim(),
      category,
      surveyNo: surveyNo.trim() || undefined,
      wardNo: wardNo.trim() || undefined,
      surveyorName: surveyorName.trim() || undefined
    });

    setTitle('');
    setDescription('');
    setSurveyNo('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Add Surveyor Field Note</h3>
              <p className="text-[11px] text-slate-400">Record field observations & survey markers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {/* Location details */}
          {initialCoord && (
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-between text-xs">
              <span className="text-slate-400">Target Coordinates:</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {initialCoord.lat.toFixed(6)}°N, {initialCoord.lng.toFixed(6)}°E
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Title / Point Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Boundary Pillar #14, Road Bend Marker..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FieldNote['category'])}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="boundary_marker">Boundary Marker</option>
                <option value="reference_pillar">Reference Pillar</option>
                <option value="disputed_point">Disputed Point</option>
                <option value="road_access">Road Access</option>
                <option value="general">General Note</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Survey No.</label>
              <input
                type="text"
                placeholder="e.g. 82, 137"
                value={surveyNo}
                onChange={(e) => setSurveyNo(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Ward Number</label>
              <input
                type="text"
                placeholder="e.g. 8 (Mullara)"
                value={wardNo}
                onChange={(e) => setWardNo(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Surveyor Name</label>
              <input
                type="text"
                placeholder="e.g. Jeri Amal Dev"
                value={surveyorName}
                onChange={(e) => setSurveyorName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Observation Description</label>
            <textarea
              rows={3}
              placeholder="Enter survey findings, physical markers found, stone pillars, tree marks, etc..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition resize-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow flex items-center gap-1.5 transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Field Note</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
