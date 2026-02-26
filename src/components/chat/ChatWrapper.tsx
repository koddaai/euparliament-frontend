'use client';

import { useState } from 'react';
import ChatButton from './ChatButton';
import ChatPanel from './ChatPanel';

export default function ChatWrapper() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
      <ChatButton onClick={() => setIsOpen(!isOpen)} isOpen={isOpen} />
    </>
  );
}
