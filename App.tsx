
import React, { useState, useCallback } from 'react';
import { GameState, Theme, Difficulty, SpellingWord } from './types';
import { generateWords, speakWord } from './services/geminiService';
import { Confetti, triggerConfetti } from './components/Confetti';

// --- Sub-components (defined outside to avoid re-renders) ---

const LoadingScreen: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
    <h2 className="text-2xl font-bold text-gray-800">Preparing Your Adventure...</h2>
    <p className="text-gray-500 mt-2 italic">Gemini is picking the best words for you!</p>
  </div>
);

const HomeScreen: React.FC<{
  onStart: (theme: Theme, diff: Difficulty) => void;
  isLoading: boolean;
}> = ({ onStart, isLoading }) => {
  const [theme, setTheme] = useState<Theme>('Animals');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);

  const themes: Theme[] = ['Animals', 'Space', 'Food', 'Nature', 'Everyday Objects', 'Superheroes'];
  const difficulties = [
    { id: Difficulty.EASY, label: 'Early Learner', color: 'bg-green-100 text-green-700 border-green-200' },
    { id: Difficulty.MEDIUM, label: 'Spelling Star', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { id: Difficulty.HARD, label: 'Word Master', color: 'bg-red-100 text-red-700 border-red-200' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4 tracking-tight">
          Proplay Quest
        </h1>
        <p className="text-xl text-gray-600">The fun way to master spelling with AI!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Theme Selector */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 transition-transform hover:scale-[1.02]">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="p-2 bg-indigo-100 rounded-lg">🎨</span> Choose a Theme
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {themes.map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`p-4 rounded-2xl text-sm font-semibold transition-all ${
                  theme === t
                    ? 'bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-100'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 transition-transform hover:scale-[1.02]">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="p-2 bg-purple-100 rounded-lg">🚀</span> Set Difficulty
          </h3>
          <div className="space-y-4">
            {difficulties.map((d) => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                  difficulty === d.id
                    ? 'border-indigo-600 bg-indigo-50 shadow-md ring-4 ring-indigo-50'
                    : 'border-transparent bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="font-bold text-lg">{d.label}</div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">{d.id} Mode</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <button
          onClick={() => onStart(theme, difficulty)}
          disabled={isLoading}
          className="px-12 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full text-2xl font-bold shadow-2xl hover:shadow-indigo-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {isLoading ? 'Fetching Words...' : 'Start My Quest! ✨'}
        </button>
      </div>
    </div>
  );
};

const GamePlay: React.FC<{
  words: SpellingWord[];
  onFinish: (score: number) => void;
}> = ({ words, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const currentWord = words[currentIndex];

  const handleSpeak = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    const buffer = await speakWord(currentWord.word);
    if (buffer) {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.onended = () => setIsSpeaking(false);
      source.start();
    } else {
      setIsSpeaking(false);
    }
  };

  const checkAnswer = () => {
    if (input.toLowerCase().trim() === currentWord.word.toLowerCase()) {
      setIsCorrect(true);
      setScore(s => s + 1);
      triggerConfetti();
      setTimeout(() => {
        if (currentIndex < words.length - 1) {
          setCurrentIndex(c => c + 1);
          setInput('');
          setIsCorrect(null);
          setShowHint(false);
        } else {
          onFinish(score + 1);
        }
      }, 2000);
    } else {
      setIsCorrect(false);
      setTimeout(() => setIsCorrect(null), 1500);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-2">
          <span className="text-indigo-600 font-bold uppercase tracking-wider text-sm">Progress</span>
          <span className="text-gray-400 font-medium">Word {currentIndex + 1} of {words.length}</span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100 text-center relative overflow-hidden">
        {isCorrect === true && (
          <div className="absolute inset-0 bg-green-500/90 flex items-center justify-center z-10 transition-opacity">
            <div className="text-white text-5xl font-black scale-110 animate-bounce">AMAZING! 🌟</div>
          </div>
        )}

        <div className="flex justify-center mb-8">
          <button
            onClick={handleSpeak}
            disabled={isSpeaking}
            className={`group relative p-8 rounded-full transition-all ${isSpeaking ? 'bg-indigo-100' : 'bg-indigo-600 hover:scale-110 shadow-lg'}`}
          >
            {isSpeaking ? (
              <div className="flex gap-1 items-center">
                <div className="w-1.5 h-6 bg-indigo-600 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-10 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-6 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            ) : (
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
            <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-sm font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">Listen!</span>
          </button>
        </div>

        <div className="mb-10">
          <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Definition</h4>
          <p className="text-2xl font-medium text-gray-700 leading-relaxed italic">
            "{currentWord.definition}"
          </p>
        </div>

        <div className="relative mb-8">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
            placeholder="Type your answer here..."
            className={`w-full text-center py-6 px-4 text-4xl font-bold rounded-2xl border-4 transition-all focus:outline-none focus:ring-8 ${
              isCorrect === false
                ? 'border-red-400 animate-shake focus:ring-red-100'
                : 'border-indigo-100 focus:border-indigo-400 focus:ring-indigo-50'
            }`}
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={checkAnswer}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-xl font-bold shadow-xl hover:bg-indigo-700 transition-all hover:scale-[1.02]"
          >
            Submit Answer
          </button>

          <div className="flex items-center justify-center gap-2 mt-4">
             <button
              onClick={() => setShowHint(!showHint)}
              className="text-indigo-500 font-bold hover:underline decoration-2 underline-offset-4"
            >
              {showHint ? 'Hide Hint' : 'Need a Hint?'}
            </button>
          </div>

          {showHint && (
            <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-2xl text-yellow-800 animate-in slide-in-from-top-4 duration-300">
              <span className="font-bold">Hint:</span> {currentWord.hint}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ResultsScreen: React.FC<{
  score: number;
  total: number;
  onRestart: () => void;
}> = ({ score, total, onRestart }) => {
  const percentage = (score / total) * 100;
  let title = "Great Attempt!";
  let icon = "🌈";

  if (percentage === 100) { title = "Perfect Score!"; icon = "👑"; }
  else if (percentage >= 70) { title = "Spelling Wizard!"; icon = "🧙‍♂️"; }
  else if (percentage >= 50) { title = "Awesome Job!"; icon = "⭐"; }

  return (
    <div className="max-w-xl mx-auto p-6 text-center">
      <div className="mb-10">
        <span className="text-9xl mb-6 block animate-bounce-slow">{icon}</span>
        <h2 className="text-5xl font-black text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-500 text-xl">You've mastered these words!</p>
      </div>

      <div className="bg-white rounded-3xl p-10 shadow-2xl border border-gray-100 mb-10">
        <div className="text-7xl font-black text-indigo-600 mb-2">
          {score}<span className="text-gray-200">/</span>{total}
        </div>
        <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Words Correct</div>
      </div>

      <button
        onClick={onRestart}
        className="px-12 py-5 bg-indigo-600 text-white rounded-full text-2xl font-bold shadow-xl hover:bg-indigo-700 transition-all hover:scale-105"
      >
        Play Again
      </button>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.HOME);
  const [words, setWords] = useState<SpellingWord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const startGame = async (theme: Theme, diff: Difficulty) => {
    setIsLoading(true);
    try {
      const generated = await generateWords(theme, diff);
      if (generated && generated.length > 0) {
        setWords(generated);
        setGameState(GameState.PLAYING);
      } else {
        alert("Oops! Gemini is shy. Let's try again.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to start game. Check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = (score: number) => {
    setFinalScore(score);
    setGameState(GameState.RESULTS);
  };

  const handleRestart = () => {
    setGameState(GameState.HOME);
    setWords([]);
  };

  return (
    <div className="min-h-screen pb-20 pt-8 md:pt-16 px-4 bg-slate-50">
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center pointer-events-none">
         <div className="flex items-center gap-2 pointer-events-auto bg-white/80 backdrop-blur shadow-sm px-4 py-2 rounded-full border border-gray-200">
           <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black text-xs">P</div>
           <span className="font-extrabold text-indigo-900 tracking-tight">PROPLAY</span>
         </div>
      </header>

      <main className="container mx-auto">
        {gameState === GameState.HOME && (
          <HomeScreen onStart={startGame} isLoading={isLoading} />
        )}

        {isLoading && <LoadingScreen />}

        {!isLoading && gameState === GameState.PLAYING && words.length > 0 && (
          <GamePlay words={words} onFinish={handleFinish} />
        )}

        {gameState === GameState.RESULTS && (
          <ResultsScreen score={finalScore} total={words.length} onRestart={handleRestart} />
        )}
      </main>

      {/* Footer / Credits */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 text-center pointer-events-none">
        <div className="inline-block px-4 py-1 bg-white/50 backdrop-blur rounded-full text-xs font-medium text-gray-400 border border-gray-100 pointer-events-auto">
          Powered by Gemini AI • Made with Fun
        </div>
      </footer>
    </div>
  );
}
