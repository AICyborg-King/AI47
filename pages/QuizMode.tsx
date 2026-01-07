import React, { useState } from 'react';
import { generateQuiz } from '../services/geminiService';
import { Subject, QuizQuestion } from '../types';
import { useStore } from '../context/StoreContext';
import { BrainCircuit, Loader2, Check, X, ArrowRight, RefreshCw } from 'lucide-react';

const QuizMode: React.FC = () => {
  const { addQuizResult } = useStore();
  const [step, setStep] = useState<'setup' | 'loading' | 'taking' | 'result'>('setup');
  const [selectedSubject, setSelectedSubject] = useState<Subject>(Subject.MATH);
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);

  const startQuiz = async () => {
    setStep('loading');
    try {
      const generatedQuestions = await generateQuiz(selectedSubject, difficulty);
      setQuestions(generatedQuestions);
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setStep('taking');
    } catch (error) {
      alert('Failed to generate quiz. Please try again.');
      setStep('setup');
    }
  };

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...userAnswers, optionIndex];
    setUserAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => setCurrentQuestionIndex(currentQuestionIndex + 1), 400);
    } else {
      // Calculate score
      let calculatedScore = 0;
      newAnswers.forEach((ans, idx) => {
        if (ans === questions[idx].correctAnswerIndex) calculatedScore++;
      });
      setScore(calculatedScore);
      
      // Save result
      addQuizResult({
        id: Date.now().toString(),
        subject: selectedSubject,
        score: calculatedScore,
        totalQuestions: questions.length,
        date: new Date().toISOString()
      });
      
      setStep('result');
    }
  };

  if (step === 'setup') {
    return (
      <div className="max-w-2xl mx-auto text-center pt-8">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-indigo-50">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BrainCircuit className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Practice Mode</h1>
          <p className="text-slate-500 mb-8">Generate a custom AI quiz to test your knowledge.</p>

          <div className="space-y-6 text-left max-w-sm mx-auto">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Subject</label>
              <select 
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value as Subject)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                {Object.values(Subject).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {['Beginner', 'Intermediate', 'Advanced'].map(level => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`p-2 rounded-lg text-sm border transition-all ${
                      difficulty === level 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startQuiz}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all hover:-translate-y-1 active:translate-y-0"
            >
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-slate-900">Generating Questions...</h2>
        <p className="text-slate-500">AI is crafting a unique quiz for you.</p>
      </div>
    );
  }

  if (step === 'taking') {
    const question = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex) / questions.length) * 100;

    return (
      <div className="max-w-3xl mx-auto pt-4">
        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full mb-8 overflow-hidden">
          <div 
            className="h-full bg-indigo-600 transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }} 
          />
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-6">
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-8">{question.question}</h2>

          <div className="grid gap-4">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className="w-full text-left p-4 rounded-xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center group-hover:bg-indigo-200 group-hover:text-indigo-700 transition-colors">
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="text-lg text-slate-700 group-hover:text-indigo-900 font-medium">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Results View
  return (
    <div className="max-w-3xl mx-auto pt-8">
      <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-200 text-center">
        <div className="inline-block p-4 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 mb-6">
            <TrophyIcon score={score} total={questions.length} />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {score === questions.length ? 'Perfect Score!' : score > questions.length / 2 ? 'Good Job!' : 'Keep Practicing!'}
        </h1>
        <p className="text-slate-500 mb-8">You scored {score} out of {questions.length}</p>

        {/* Review */}
        <div className="text-left space-y-6 mb-8">
          <h3 className="font-bold text-slate-900 border-b pb-2">Review</h3>
          {questions.map((q, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex gap-2 items-start mb-2">
                {userAnswers[idx] === q.correctAnswerIndex ? (
                  <Check className="w-5 h-5 text-green-500 mt-1 shrink-0" />
                ) : (
                  <X className="w-5 h-5 text-red-500 mt-1 shrink-0" />
                )}
                <div>
                  <p className="font-medium text-slate-900">{q.question}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Your answer: <span className={userAnswers[idx] === q.correctAnswerIndex ? 'text-green-600' : 'text-red-600'}>
                      {q.options[userAnswers[idx]]}
                    </span>
                  </p>
                  {userAnswers[idx] !== q.correctAnswerIndex && (
                    <p className="text-sm text-green-600 font-medium mt-1">
                      Correct: {q.options[q.correctAnswerIndex]}
                    </p>
                  )}
                  <p className="text-sm text-indigo-600 mt-2 bg-indigo-50 p-2 rounded">
                    💡 {q.explanation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setStep('setup')}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
        >
          <RefreshCw className="w-5 h-5" /> Take Another Quiz
        </button>
      </div>
    </div>
  );
};

const TrophyIcon = ({score, total}: {score: number, total: number}) => {
    // Simple visual component
    const percent = score / total;
    if (percent === 1) return <span className="text-4xl">🏆</span>
    if (percent >= 0.6) return <span className="text-4xl">🌟</span>
    return <span className="text-4xl">📚</span>
}

export default QuizMode;