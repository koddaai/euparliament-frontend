'use client';

import { useState, useEffect } from 'react';
import ChatButton from './ChatButton';
import ChatPanel from './ChatPanel';

export default function ChatWrapper() {
  const [isOpen, setIsOpen] = useState(false);

  // Listen for custom event to open chat from other components
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('openChat', handleOpenChat);
    return () => window.removeEventListener('openChat', handleOpenChat);
  }, []);

  return (
    <>
      <ChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
      <ChatButton onClick={() => setIsOpen(!isOpen)} isOpen={isOpen} />
    </>
  );
}
