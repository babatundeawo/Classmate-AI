import React, { useState, useEffect } from 'react';
import SetupScreen from './components/SetupScreen';
import ChatRoom from './components/ChatRoom';
import { ClassContext } from './types';

const STORAGE_KEY = 'classmate_ai_context';

export default function App() {
  const [context, setContext] = useState<ClassContext | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved context", e);
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (context) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [context]);

  if (!context) {
    return <SetupScreen onComplete={setContext} />;
  }

  return <ChatRoom context={context} onReset={() => setContext(null)} />;
}
