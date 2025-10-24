'use client';

import { motion } from 'framer-motion';
import { Channel } from '@/lib/api';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';

interface PlayerOverlayProps {
  channel: Channel;
  show: boolean;
  currentProgram?: any;
}

export function PlayerOverlay({ channel, show, currentProgram }: PlayerOverlayProps) {


    const { ref } = useFocusable({})


    return (
        <motion.div
        ref={ref}
        className="absolute z-10 bottom-0 left-0 right-0 p-[3vw] bg-gradient-to-t from-black/80 to-transparent pointer-events-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: show ? 1 : 0, y: show ? 0 : 20 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
        <div className="flex items-center gap-[1.5vw] bg-white/50 backdrop-blur-sm rounded-[1vw] p-[1vw] w-[40vw]">
            {channel.stream_icon && (
            <img
                src={channel.stream_icon}
                alt={channel.name}
                className="w-[6vw] h-[6vw] rounded-[0.5vw] object-contain"
            />
            )}

            <div className="flex flex-col">
            <h2 className="text-[2vw] font-semibold text-black">
                {channel.name}
            </h2>
            {currentProgram && (
                <p className="text-[1.4vw] text-black/80 font-light">
                Agora: {currentProgram.title}
                </p>
            )}
            </div>
        </div>
        </motion.div>
    );
}
