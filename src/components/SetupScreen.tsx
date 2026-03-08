import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, GraduationCap, Sparkles, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { ClassContext, SchoolTerm, SchoolClass, ClassCategory } from '../types';
import { fetchTopics, SUBJECTS_BY_CATEGORY } from '../services/curriculum';

interface SetupScreenProps {
  onComplete: (context: ClassContext) => void;
}

type Step = 'term' | 'class' | 'category' | 'subject' | 'topic' | 'notes';

export default function SetupScreen({ onComplete }: SetupScreenProps) {
  const [step, setStep] = useState<Step>('term');
  const [term, setTerm] = useState<SchoolTerm>('1st Term');
  const [className, setClassName] = useState<SchoolClass>('JSS 1');
  const [category, setCategory] = useState<ClassCategory>('Junior Secondary');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [notes, setNotes] = useState('');
  
  const [topics, setTopics] = useState<string[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);

  const terms: SchoolTerm[] = ['1st Term', '2nd Term', '3rd Term'];
  const classes: SchoolClass[] = ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'];
  const categories: ClassCategory[] = ['Science', 'Art', 'Commercial', 'General'];

  useEffect(() => {
    if (className.startsWith('JSS')) {
      setCategory('Junior Secondary');
    } else if (category === 'Junior Secondary') {
      setCategory('Science'); // Default for SSS
    }
  }, [className]);

  useEffect(() => {
    if (step === 'topic' && subject) {
      loadTopics();
    }
  }, [step, subject]);

  const loadTopics = async () => {
    setIsLoadingTopics(true);
    const fetched = await fetchTopics(term, className, subject);
    setTopics(fetched);
    setIsLoadingTopics(false);
  };

  const handleNext = () => {
    if (step === 'term') setStep('class');
    else if (step === 'class') {
      if (className.startsWith('JSS')) setStep('subject');
      else setStep('category');
    }
    else if (step === 'category') setStep('subject');
    else if (step === 'subject') setStep('topic');
    else if (step === 'topic') setStep('notes');
  };

  const handleBack = () => {
    if (step === 'class') setStep('term');
    else if (step === 'category') setStep('class');
    else if (step === 'subject') {
      if (className.startsWith('JSS')) setStep('class');
      else setStep('category');
    }
    else if (step === 'topic') setStep('subject');
    else if (step === 'notes') setStep('topic');
  };

  const handleSubmit = () => {
    onComplete({
      term,
      className,
      category,
      subject,
      topic: topic === 'Other' ? customTopic : topic,
      notes
    });
  };

  const renderStep = () => {
    switch (step) {
      case 'term':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-stone-800">Which term are we in?</h2>
            <div className="grid grid-cols-1 gap-3">
              {terms.map(t => (
                <button
                  key={t}
                  onClick={() => { setTerm(t); handleNext(); }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${term === t ? 'border-student-blue bg-blue-50' : 'border-stone-200 hover:border-stone-300'}`}
                >
                  <span className="font-bold">{t}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 'class':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-stone-800">What's your class?</h2>
            <div className="grid grid-cols-2 gap-3">
              {classes.map(c => (
                <button
                  key={c}
                  onClick={() => { setClassName(c); handleNext(); }}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${className === c ? 'border-student-blue bg-blue-50' : 'border-stone-200 hover:border-stone-300'}`}
                >
                  <span className="font-bold">{c}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 'category':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-stone-800">Select your class category</h2>
            <div className="grid grid-cols-1 gap-3">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); handleNext(); }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${category === cat ? 'border-student-blue bg-blue-50' : 'border-stone-200 hover:border-stone-300'}`}
                >
                  <span className="font-bold">{cat} Class</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 'subject':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-stone-800">Pick a subject</h2>
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2">
              {SUBJECTS_BY_CATEGORY[category].map(s => (
                <button
                  key={s}
                  onClick={() => { setSubject(s); handleNext(); }}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${subject === s ? 'border-student-blue bg-blue-50' : 'border-stone-200 hover:border-stone-300'}`}
                >
                  <span className="font-bold">{s}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 'topic':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-stone-800">What topic are we treating?</h2>
            {isLoadingTopics ? (
              <div className="flex flex-col items-center justify-center py-12 text-stone-500 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200">
                <div className="relative mb-4">
                  <Loader2 className="w-12 h-12 animate-spin text-student-blue" />
                  <BookOpen className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-student-blue" />
                </div>
                <p className="font-bold text-stone-600">Alex is checking the curriculum...</p>
                <p className="text-xs mt-1">Fetching Nigerian Scheme of Work</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2">
                {topics.map(t => (
                  <button
                    key={t}
                    onClick={() => { setTopic(t); handleNext(); }}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${topic === t ? 'border-student-blue bg-blue-50' : 'border-stone-200 hover:border-stone-300'}`}
                  >
                    <span className="font-bold">{t}</span>
                  </button>
                ))}
                <button
                  onClick={() => { setTopic('Other'); }}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${topic === 'Other' ? 'border-student-blue bg-blue-50' : 'border-stone-200 hover:border-stone-300'}`}
                >
                  <span className="font-bold">Other / Not listed</span>
                </button>
                {topic === 'Other' && (
                  <input
                    autoFocus
                    type="text"
                    placeholder="Describe the topic..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-student-blue focus:outline-none mt-2"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                  />
                )}
              </div>
            )}
            {topic === 'Other' && customTopic && (
              <button onClick={handleNext} className="w-full bg-student-blue text-white py-3 rounded-xl font-bold">
                Continue
              </button>
            )}
          </div>
        );
      case 'notes':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-stone-800">Any extra notes? (Optional)</h2>
            <textarea
              placeholder="Paste teacher's notes or specific points to focus on..."
              className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-student-blue focus:outline-none transition-colors h-48 resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button
              onClick={handleSubmit}
              className="w-full bg-student-blue hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Start Studying with Alex
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-stone-100 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-stone-200"
      >
        <div className="bg-student-blue p-6 text-white relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Classmate AI</h1>
              <p className="text-xs opacity-80">Nigerian Secondary School Edition</p>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <BookOpen className="w-24 h-24 rotate-12" />
          </div>
        </div>

        <div className="p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex gap-1">
              {['term', 'class', 'category', 'subject', 'topic', 'notes'].map((s, i) => {
                // Skip category for JSS
                if (s === 'category' && className.startsWith('JSS')) return null;
                const steps = ['term', 'class', 'category', 'subject', 'topic', 'notes'];
                const activeIndex = steps.indexOf(step);
                const currentIndex = steps.indexOf(s);
                return (
                  <div 
                    key={s} 
                    className={`h-1.5 rounded-full transition-all ${currentIndex <= activeIndex ? 'w-6 bg-student-blue' : 'w-2 bg-stone-200'}`} 
                  />
                );
              })}
            </div>
            {step !== 'term' && (
              <button onClick={handleBack} className="text-stone-400 hover:text-stone-600 flex items-center gap-1 text-sm font-bold">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
