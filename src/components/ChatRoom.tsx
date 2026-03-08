import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Camera, 
  Image as ImageIcon, 
  Mic, 
  MicOff, 
  X, 
  User, 
  Bot,
  Paperclip,
  RotateCcw,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Message, ClassContext } from '../types';
import { generateResponse } from '../services/gemini';
import confetti from 'canvas-confetti';

interface ChatRoomProps {
  context: ClassContext;
  onReset: () => void;
}

export default function ChatRoom({ context, onReset }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      text: `Hey! I'm Alex. Ready to crush ${context.subject}? I've got all the notes on ${context.topic} right here. What's tripping you up?` 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() && !attachedImage) return;

    const userMsg: Message = { 
      role: 'user', 
      text: textToSend, 
      image: attachedImage || undefined 
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachedImage(null);
    setIsLoading(true);

    try {
      let currentResponse = '';
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      
      await generateResponse([...messages, userMsg], context, (chunk) => {
        currentResponse = chunk;
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].text = chunk;
          return newMsgs;
        });
      });

      if (currentResponse.toLowerCase().includes('correct') || currentResponse.toLowerCase().includes('awesome')) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Whoops, my brain glitched! Can you try that again?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      setAttachedImage(canvas.toDataURL('image/jpeg'));
      stopCamera();
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    setShowCamera(false);
  };

  const toggleRecording = () => {
    if (!isRecording) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsRecording(false);
        };
        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);
        recognition.start();
        setIsRecording(true);
      } else {
        alert("Speech recognition not supported in this browser.");
      }
    } else {
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-stone-100 max-w-4xl mx-auto sm:border-x-4 border-stone-200 shadow-2xl overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b-4 border-stone-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-student-yellow rounded-full flex items-center justify-center border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Alex (Best Student)</h2>
            <p className="text-xs text-stone-500 uppercase tracking-widest font-bold">
              {context.className} • {context.term} • {context.subject}
            </p>
            <p className="text-[10px] text-student-blue font-bold uppercase tracking-tighter">
              Topic: {context.topic}
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShowResetConfirm(true)}
          className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-stone-500"
          title="Change Subject"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </header>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 sm:p-6 space-y-4 sm:space-y-6 notebook-paper"
      >
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-1.5 sm:gap-3 w-full ${msg.role === 'user' ? 'flex-row-reverse pl-4 sm:pl-12' : 'flex-row pr-4 sm:pr-12'}`}>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0 flex items-center justify-center border-2 border-stone-800 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${msg.role === 'user' ? 'bg-student-blue' : 'bg-student-yellow'}`}>
                {msg.role === 'user' ? <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" /> : <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </div>
              <div className={`group relative flex-1 p-3 sm:p-4 rounded-2xl border-2 border-stone-800 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${msg.role === 'user' ? 'bg-white' : 'bg-stone-50'}`}>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(msg.text);
                    setCopyingId(i.toString());
                    setTimeout(() => setCopyingId(null), 2000);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-stone-200 shadow-sm z-10"
                  title="Copy message"
                >
                  {copyingId === i.toString() ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                </button>
                {msg.image && (
                  <img src={msg.image} alt="Attached" className="max-w-full rounded-lg mb-3 border-2 border-stone-200" referrerPolicy="no-referrer" />
                )}
                <div className="markdown-body prose prose-stone max-w-none text-sm sm:text-base leading-relaxed">
                  <Markdown 
                    remarkPlugins={[remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                  >
                    {msg.text}
                  </Markdown>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start gap-2 items-center"
          >
            <div className="w-7 h-7 rounded-full bg-student-yellow flex items-center justify-center border-2 border-stone-800 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-stone-200 px-4 py-2 rounded-2xl border-2 border-stone-300 flex items-center gap-1">
              <span className="text-xs font-bold text-stone-500">Alex is writing</span>
              <span className="flex gap-0.5">
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1 h-1 bg-stone-400 rounded-full" />
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-stone-400 rounded-full" />
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-stone-400 rounded-full" />
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <footer className="bg-white border-t-4 border-stone-200 p-4">
        <AnimatePresence>
          {attachedImage && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="relative mb-4 inline-block"
            >
              <img src={attachedImage} alt="Preview" className="h-24 w-24 object-cover rounded-xl border-2 border-student-blue" referrerPolicy="no-referrer" />
              <button 
                onClick={() => setAttachedImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-stone-100 hover:bg-stone-200 rounded-2xl border-2 border-stone-200 transition-colors text-stone-500"
            title="Attach File"
          >
            <Paperclip className="w-6 h-6" />
          </button>
          
          <div className="flex-1 bg-stone-100 rounded-2xl border-2 border-stone-200 p-2 flex flex-col">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask Alex anything..."
              className="bg-transparent border-none focus:ring-0 resize-none p-2 w-full max-h-32 overflow-y-auto"
            />
            <div className="flex items-center gap-2 mt-2 border-t border-stone-200 pt-2 px-2">
              <button 
                onClick={startCamera}
                className="p-2 hover:bg-stone-200 rounded-lg transition-colors text-stone-500"
                title="Take Photo"
              >
                <Camera className="w-5 h-5" />
              </button>
              <button 
                onClick={toggleRecording}
                className={`p-2 rounded-lg transition-colors ${isRecording ? 'bg-red-100 text-red-500 animate-pulse' : 'hover:bg-stone-200 text-stone-500'}`}
                title="Voice Input"
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          </div>
          <button
            onClick={() => handleSend()}
            disabled={isLoading || (!input.trim() && !attachedImage)}
            className="bg-student-blue text-white p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </footer>

      {/* Camera Overlay */}
      <AnimatePresence>
        {showCamera && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4"
          >
            <div className="relative w-full max-w-lg aspect-video bg-stone-800 rounded-3xl overflow-hidden border-4 border-white">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6">
                <button 
                  onClick={capturePhoto}
                  className="w-16 h-16 bg-white rounded-full border-4 border-stone-300 flex items-center justify-center shadow-xl active:scale-90 transition-transform"
                >
                  <div className="w-12 h-12 bg-white rounded-full border-2 border-stone-800" />
                </button>
                <button 
                  onClick={stopCamera}
                  className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Dialog */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border-4 border-stone-200"
            >
              <div className="flex items-center gap-4 mb-6 text-red-500">
                <div className="bg-red-100 p-3 rounded-2xl">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-stone-800">Change Subject?</h3>
              </div>
              <p className="text-stone-600 mb-8 leading-relaxed">
                Omo, you sure say you wan change subject? All our current chat history for <span className="font-bold text-stone-800">{context.subject}</span> go clear o!
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-stone-500 hover:bg-stone-100 transition-colors"
                >
                  No, stay here
                </button>
                <button
                  onClick={onReset}
                  className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white shadow-lg shadow-red-200 hover:bg-red-600 transition-all active:scale-95"
                >
                  Yes, change am
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
