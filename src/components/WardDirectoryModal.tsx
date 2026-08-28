import React, { useState } from 'react';
import { X, Search, Phone, User, MapPin, Check, Filter } from 'lucide-react';
import { WardInfo } from '../types';
import { formatLandArea } from '../utils/geoUtils';

interface WardDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  wardRegistry: WardInfo[];
  activeWardFilter: number | null;
  onSelectWard: (wardNo: number) => void;
}

export const WardDirectoryModal: React.FC<WardDirectoryModalProps> = ({
  isOpen,
  onClose,
  wardRegistry,
  activeWardFilter,
  onSelectWard
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredWards = wardRegistry.filter((w) => {
    const q = search.toLowerCase();
    return (
      w.wardName.toLowerCase().includes(q) ||
      w.surveyor.toLowerCase().includes(q) ||
      w.remarks.toLowerCase().includes(q) ||
      String(w.wardNo).includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Karuvarakundu Grama Panchayat — Ward Directory (24 Wards)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Official surveyor assignments, contact numbers, and ward boundary areas
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Ward name, number, or surveyor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
        </div>

        {/* Table List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredWards.map((ward) => {
              const isSelected = activeWardFilter === ward.wardNo;
              const areaInfo = formatLandArea(ward.shapeArea);

              return (
                <div
                  key={ward.wardNo}
                  className={`p-3.5 rounded-xl border transition ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-md'
                      : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-emerald-900/70 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center justify-center">
                        {ward.wardNo}
                      </span>
                      <div>
                        <h4 className="font-bold text-xs text-white">{ward.wardName}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {ward.remarks ? `Locality: ${ward.remarks}` : `Ward #${ward.wardNo}`}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onSelectWard(ward.wardNo);
                        onClose();
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                      }`}
                    >
                      <Filter className="w-3 h-3" />
                      <span>{isSelected ? 'Active' : 'Filter Map'}</span>
                    </button>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-700/50 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                        <User className="w-3 h-3 text-slate-400" />
                        Surveyor:
                      </span>
                      <span className="font-medium text-slate-200">{ward.surveyor}</span>
                    </div>

                    {ward.mobNo && ward.mobNo !== 'N/A' && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" />
                          Phone:
                        </span>
                        <a
                          href={`tel:${ward.mobNo}`}
                          className="text-emerald-400 hover:underline font-mono text-[11px]"
                        >
                          {ward.mobNo}
                        </a>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-slate-400 text-[11px]">Ward Area:</span>
                      <span className="font-mono text-emerald-400 text-[11px]">
                        {areaInfo.acres} ({areaInfo.sqMeters})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Total Wards in Registry: {wardRegistry.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
