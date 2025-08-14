'use client';

import { useState, useEffect, useCallback } from 'react';
import { init, setFocus } from '@noriginmedia/norigin-spatial-navigation';

interface VirtualKeyboardProps {
  onType: (char: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  focusKey: string;
}

const KEYBOARD_LAYOUT = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  ['SPACE', 'BKSP', 'OK']
];

export function VirtualKeyboard({ onType, onBackspace, onSubmit, focusKey }: VirtualKeyboardProps) {
  const [currentFocus, setCurrentFocus] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      init({
        debug: false,
        visualDebug: false,
      });
    }
  }, []);

  const handleKeyPress = useCallback((key: string) => {
    if (key === 'SPACE') {
      onType(' ');
    } else if (key === 'BKSP') {
      onBackspace();
    } else if (key === 'OK') {
      onSubmit();
    } else {
      onType(key);
    }
  }, [onType, onBackspace, onSubmit]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent, key: string) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleKeyPress(key);
    }
  }, [handleKeyPress]);

  return (
    <div className="mt-8 bg-gray-800/50 rounded-lg p-6">
      <div className="space-y-2">
        {KEYBOARD_LAYOUT.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-2">
            {row.map((key, keyIndex) => {
              const keyId = `${focusKey}-key-${rowIndex}-${keyIndex}`;
              const isSpecial = ['SPACE', 'BKSP', 'OK'].includes(key);
              
              return (
                <button
                  key={keyId}
                  data-focus-key={keyId}
                  className={`
                    h-12 px-4 rounded-md font-medium text-white
                    border-2 border-transparent transition-all
                    bg-gray-700 hover:bg-gray-600
                    focus:border-white focus:outline-none focus:ring-0
                    ${isSpecial ? 'min-w-16' : 'min-w-12'}
                    ${key === 'SPACE' ? 'min-w-32' : ''}
                  `}
                  onClick={() => handleKeyPress(key)}
                  onKeyDown={(e) => handleKeyDown(e, key)}
                  onFocus={() => setCurrentFocus(keyId)}
                  onBlur={() => setCurrentFocus(null)}
                >
                  {key === 'SPACE' ? 'ESPAÇO' : 
                   key === 'BKSP' ? 'APAGAR' :
                   key === 'OK' ? 'ENTRAR' : key.toUpperCase()}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}