'use client';

interface PlayerErrorProps {
  message: string;
}

export function PlayerError({ message }: PlayerErrorProps) {
  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-[2vw]">
      <p className="text-red-500 text-[1.5vw] font-bold text-center">
        {message}
      </p>
    </div>
  );
}
