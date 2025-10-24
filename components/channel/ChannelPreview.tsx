'use client';

import { forwardRef } from "react";
import { useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { Maximize2 } from "lucide-react";
import { Channel } from '@/lib/api';
import { PlayerLoading } from "@/components/player/PlayerLoading";
import { PlayerError } from "../player/PlayerError";

interface ChannelPreviewProps {
  channel?: Channel;
  onEnterPress: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const ChannelPreview = forwardRef<HTMLVideoElement, ChannelPreviewProps>(
  ({ channel, onEnterPress, isLoading = false, error }, ref) => {
    const { ref: focusableRef, focused } = useFocusable({
      focusKey: 'channel-preview',
      onEnterPress,
    });

    return (
      <div
        ref={focusableRef}
        className={`
          relative w-[45vw] bg-black rounded-[1vw] overflow-hidden border-[0.3vw]
          ${focused ? 'border-white' : 'border-neutral-700'}
        `}
      >
        <div className="relative aspect-video">
          <video
            ref={ref}
            className="w-full h-full object-contain"
            autoPlay
            playsInline
            muted
          />

          {isLoading && <PlayerLoading />}

          {error && <PlayerError message={error} />}
          
          <ChannelInfoOverlay channel={channel} />
          {focused && <PreviewFocusHint />}
        </div>
      </div>
    );
  }
);

ChannelPreview.displayName = "ChannelPreview";

function ChannelInfoOverlay({ channel }: { channel?: Channel }) {
  if (!channel) return null;
  return (
    <div className="absolute top-[1vw] left-[1vw] bg-black/60 rounded p-[0.5vw] backdrop-blur-sm flex items-center gap-[0.5vw]">
      {channel.stream_icon && (
        <img
          src={channel.stream_icon}
          alt={channel.name}
          className="w-[2vw] h-[2vw] rounded"
        />
      )}
      <div>
        <h3 className="text-white font-bold text-[1vw]">{channel.name}</h3>
      </div>
    </div>
  );
}

function PreviewFocusHint() {
  return (
    <div className="absolute bottom-[1vw] right-[1vw] bg-white/20 rounded p-[0.5vw] backdrop-blur-sm text-white text-[0.8vw] flex items-center gap-[0.3vw]">
      <Maximize2 className="w-[1.2vw] h-[1.2vw]" />Pressione para tela cheia
    </div>
  );
}
