import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import { X } from '@phosphor-icons/react';
import WaitlistCard from '../ui/WaitlistCard';
import '../ui/overlay.css';

// "Get early access" opens the waitlist card in a modal dialog: the page behind is inert, so focus stays
// inside, and Esc closes it. Following one of the card's links closes it too.

const Open = createContext<() => void>(() => {});
export const useWaitlist = () => useContext(Open);

export function WaitlistProvider({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { key } = useLocation();

  const show = useCallback(() => dialog.current?.showModal(), []);

  useEffect(() => {
    dialog.current?.close();
  }, [key]);

  return (
    <Open.Provider value={show}>
      {children}
      <dialog ref={dialog} className="waitlist" aria-label="Get early access">
        <WaitlistCard className="card static" />
        <button type="button" className="waitlist-close" aria-label="Close" onClick={() => dialog.current?.close()}>
          <X size={22} aria-hidden="true" />
        </button>
      </dialog>
    </Open.Provider>
  );
}
