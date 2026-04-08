import React from "react";
import { Button } from "@/components/Button";

type ManualImportCardProps = {
  onManualAdd: () => void;
};

const ManualImportCard: React.FC<ManualImportCardProps> = ({ onManualAdd }) => {
  return (
    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-6 relative overflow-hidden h-full flex flex-col">
      {/* Manual accent gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-zinc-500 via-zinc-400 to-zinc-500" />

      <div className="flex items-center gap-3">
        {/* Manual icon */}
        <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center shadow-md shadow-zinc-900/50 flex-shrink-0 border border-zinc-700">
          <svg className="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white">Add Manually</h3>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
          Create a game entry from scratch if it's not available on Steam or Epic Games. You can manually enter details, upload screenshots, and provide your own links.
        </p>

        <Button onClick={onManualAdd} className="w-full">
          Open Game Editor
        </Button>
      </div>
    </div>
  );
};

export default ManualImportCard;
