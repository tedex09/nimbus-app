'use client';

import { Loader2 } from 'lucide-react';

export function PlayerLoading() {

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
      <Loader2 className="w-[4vw] h-[4vw] text-white animate-spin" />
    </div>
  );
}
