import React, { useState } from 'react';
import SetupScreen from './components/SetupScreen';
import ChatRoom from './components/ChatRoom';
import { ClassContext } from './types';

export default function App() {
  const [context, setContext] = useState<ClassContext | null>(null);

  if (!context) {
    return <SetupScreen onComplete={setContext} />;
  }

  return <ChatRoom context={context} onReset={() => setContext(null)} />;
}
