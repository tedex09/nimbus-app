type BackHandlerCallback = () => void;

interface HandlerItem {
  keys: (number | string)[];
  callback: BackHandlerCallback;
}

class BackHandlerManager {
  private handlers: HandlerItem[] = [];
  private keyListener: (e: KeyboardEvent) => void;
  private defaultKeys: (string | number)[] = ['Escape', 'Backspace', 461];
  private initialized = false;

  constructor() {
    this.keyListener = (e: KeyboardEvent) => {
      for (let i = this.handlers.length - 1; i >= 0; i--) {
        const handler = this.handlers[i];
        if (handler.keys.includes(e.key) || handler.keys.includes(e.keyCode)) {
          e.preventDefault();
          handler.callback();
          return;
        }
      }
    };

    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    if (this.initialized) return;
    window.addEventListener('keydown', this.keyListener);
    this.initialized = true;
  }

  addHandler(callback: BackHandlerCallback, keys: (number | string)[] = []) {
    if (typeof window === 'undefined') return () => {};
    const item: HandlerItem = { keys: [...this.defaultKeys, ...keys], callback };
    this.handlers.push(item);

    return () => {
      this.handlers = this.handlers.filter(h => h !== item);
    };
  }

  destroy() {
    if (typeof window !== 'undefined' && this.initialized) {
      window.removeEventListener('keydown', this.keyListener);
    }
    this.handlers = [];
    this.initialized = false;
  }
}

export const backHandlerManager =
  typeof window !== 'undefined' ? new BackHandlerManager() : ({} as BackHandlerManager);
