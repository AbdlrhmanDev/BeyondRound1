'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import dynamic from 'next/dynamic';

const SignupModal = dynamic(() => import('./SignupModal'), { ssr: false });

interface ModalContextValue {
  openModal: () => void;
}

const ModalContext = createContext<ModalContextValue>({ openModal: () => {} });

export function useModal() {
  return useContext(ModalContext);
}

export function LandingModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);

  return (
    <ModalContext.Provider value={{ openModal }}>
      {children}
      {isOpen && <SignupModal onClose={closeModal} />}
    </ModalContext.Provider>
  );
}
