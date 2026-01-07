import React, { useState, useRef, useEffect } from 'react';
import { generateChatResponse, ai } from '../services/geminiService';
import { Send, Bot, User as UserIcon, Loader2, BookOpen, Mic, X, Sparkles, Volume2, Waves } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Subject, Note } from '../types';
import { LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, b64ToUint8Array, decodeAudioData } from '../services/audioUtils';

const ChatTutor: React.FC = () => {
  const { addNote } = useStore();
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: 'Hi there! I\'m EduFly. What are we studying today? I can help with Math, Science, or writing essays!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null); // To store the active Live session
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const activeSourceCountRef = useRef(0);
  
  // Visualizer Refs
  const currentVolumeRef = useRef(0);
  const displayedVolumeRef = useRef(0);
  const visualizerRef = useRef<HTMLDivElement>(null);
  const iconContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  
  // Transcription accumulation
  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isVoiceMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVoiceSession();
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Animation Loop for Visualizer
  useEffect(() => {
    if (!isVoiceMode) return;

    const animate = () => {
      // Smooth decay for volume visualization
      const targetVol = currentVolumeRef.current;
      displayedVolumeRef.current += (targetVol - displayedVolumeRef.current) * 0.15;
      const vol = Math.max(0, displayedVolumeRef.current);

      // 1. Outer Ring Animation (Ambient Echo)
      if (visualizerRef.current) {
        const scale = 1 + vol * 1.5;
        visualizerRef.current.style.transform = `scale(${scale})`;
        visualizerRef.current.style.opacity = `${0.1 + vol * 0.5}`;
      }

      // 2. Icon Container Animation (Core Pulse)
      if (iconContainerRef.current) {
        if (voiceStatus === 'connected' && !isAiSpeaking) {
           // User is speaking: Responsive volume-based glow
           iconContainerRef.current.style.transition = 'none'; // Disable CSS transition for instant reaction
           
           // Calculate dynamic glow properties
           const glowOpacity = 0.5 + vol * 0.5;
           const glowSpread = 20 + vol * 80;
           const scale = 1 + vol * 0.2;

           // Apply complex shadow for "energy" look
           iconContainerRef.current.style.boxShadow = `
             0 0 ${glowSpread}px rgba(255, 255, 255, ${glowOpacity * 0.6}),
             inset 0 0 ${glowSpread / 2}px rgba(255, 255, 255, ${glowOpacity * 0.3})
           `;
           iconContainerRef.current.style.transform = `scale(${scale})`;
           iconContainerRef.current.style.borderColor = `rgba(255, 255, 255, ${0.3 + vol})`;

        } else if (isAiSpeaking) {
           // AI is speaking: Gentle breathing handled by CSS, reset JS overrides
           // We allow the 'animate-pulse' or similar CSS classes to take effect
           iconContainerRef.current.style.transition = 'all 0.5s ease';
           iconContainerRef.current.style.boxShadow = `0 0 40px rgba(99, 102, 241, 0.6)`; // Indigo glow
           iconContainerRef.current.style.transform = 'scale(1.1)';
           iconContainerRef.current.style.borderColor = 'rgba(165, 180, 252, 0.5)';
        } else {
           // Idle / Connecting
           iconContainerRef.current.style.transition = 'all 0.3s ease';
           iconContainerRef.current.style.boxShadow = '';
           iconContainerRef.current.style.transform = '';
           iconContainerRef.current.style.borderColor = '';
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isVoiceMode, voiceStatus, isAiSpeaking]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await generateChatResponse(messages, userMessage);
      if (response) {
          setMessages(prev => [...prev, { role: 'model', text: response }]);
      } else {
          setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble thinking right now. Could you ask differently?" }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error. Please check your connection.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToNotes = (text: string) => {
    const note: Note = {
      id: Date.now().toString(),
      title: `AI Chat: ${text.substring(0, 30)}...`,
      content: text,
      subject: Subject.GENERAL,
      createdAt: new Date().toISOString(),
      tags: ['AI Saved']
    };
    addNote(note);
    alert('Explanation saved to your notes!');
  };

  // --- Voice Mode Logic ---

  const startVoiceSession = async () => {
    setIsVoiceMode(true);
    setVoiceStatus('connecting');
    setIsAiSpeaking(false);
    nextStartTimeRef.current = 0;
    currentInputTranscription.current = '';
    currentOutputTranscription.current = '';
    currentVolumeRef.current = 0;
    activeSourceCountRef.current = 0;

    try {
      // Setup Audio Output
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Setup Audio Input
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setVoiceStatus('connected');
            // Pipe microphone to model
            if (!inputAudioContextRef.current) return;
            
            const source = inputAudioContextRef.current.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Calculate volume (RMS)
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);
              // Boost the signal slightly for visual effect and clamp
              // High sensitivity for better visual feedback
              currentVolumeRef.current = Math.min(rms * 10, 1);

              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Transcriptions
            if (message.serverContent?.outputTranscription) {
               currentOutputTranscription.current += message.serverContent.outputTranscription.text;
            } else if (message.serverContent?.inputTranscription) {
               currentInputTranscription.current += message.serverContent.inputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
               const userText = currentInputTranscription.current;
               const modelText = currentOutputTranscription.current;
               
               if (userText.trim() && modelText.trim()) {
                  setMessages(prev => [
                      ...prev, 
                      { role: 'user', text: userText },
                      { role: 'model', text: modelText }
                  ]);
               }
               currentInputTranscription.current = '';
               currentOutputTranscription.current = '';
            }

            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
               const ctx = audioContextRef.current;
               nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
               
               const audioBuffer = await decodeAudioData(
                   b64ToUint8Array(base64Audio), 
                   ctx, 
                   24000
               );
               
               const source = ctx.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(ctx.destination);
               
               // Update AI Speaking State
               activeSourceCountRef.current++;
               setIsAiSpeaking(true);

               source.addEventListener('ended', () => {
                   audioSourcesRef.current.delete(source);
                   activeSourceCountRef.current--;
                   if (activeSourceCountRef.current === 0) {
                     setIsAiSpeaking(false);
                   }
               });
               source.start(nextStartTimeRef.current);
               nextStartTimeRef.current += audioBuffer.duration;
               audioSourcesRef.current.add(source);
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
                audioSourcesRef.current.forEach(src => {
                    try { src.stop(); } catch(e){}
                    audioSourcesRef.current.delete(src);
                });
                nextStartTimeRef.current = 0;
                activeSourceCountRef.current = 0;
                setIsAiSpeaking(false);
            }
          },
          onclose: () => {
            setVoiceStatus('disconnected');
            setIsAiSpeaking(false);
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setVoiceStatus('error');
            setIsAiSpeaking(false);
          }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: "You are EduFly, a helpful voice tutor for students. Be concise, encouraging, and clear. Speak like a friendly teacher.",
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (e) {
      console.error(e);
      setVoiceStatus('error');
    }
  };

  const stopVoiceSession = () => {
    // Cleanup input
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }
    if (inputAudioContextRef.current) {
        inputAudioContextRef.current.close();
        inputAudioContextRef.current = null;
    }
    
    // Cleanup output
    audioSourcesRef.current.forEach(src => {
        try { src.stop(); } catch(e){}
    });
    audioSourcesRef.current.clear();
    activeSourceCountRef.current = 0;
    
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }

    // Close session
    if (sessionRef.current) {
        sessionRef.current.then((s: any) => s.close());
        sessionRef.current = null;
    }

    setIsVoiceMode(false);
    setVoiceStatus('disconnected');
    setIsAiSpeaking(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden relative">
      
      {/* Voice Mode Overlay */}
      {isVoiceMode && (
        <div className="absolute inset-0 z-20 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex flex-col items-center justify-center text-white p-8 overflow-hidden">
            
            {/* Ambient Atmosphere (Stars/Particles) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Static stars */}
                <div className="absolute top-[10%] left-[20%] w-0.5 h-0.5 bg-white opacity-40"></div>
                <div className="absolute top-[30%] right-[15%] w-1 h-1 bg-white opacity-30"></div>
                <div className="absolute bottom-[20%] left-[10%] w-0.5 h-0.5 bg-white opacity-50"></div>
                
                {/* Active stars when AI speaks */}
                {isAiSpeaking && (
                    <>
                        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-[ping_3s_ease-in-out_infinite]"></div>
                        <div className="absolute top-3/4 right-1/4 w-1.5 h-1.5 bg-indigo-200 rounded-full animate-[ping_4s_ease-in-out_infinite_1s]"></div>
                        <div className="absolute top-1/2 left-3/4 w-1 h-1 bg-purple-200 rounded-full animate-[ping_3.5s_ease-in-out_infinite_0.5s]"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent animate-pulse"></div>
                    </>
                )}
            </div>

            <button 
                onClick={stopVoiceSession}
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md z-20 border border-white/10"
            >
                <X className="w-6 h-6" />
            </button>

            <div className="mb-16 text-center relative z-10">
                <h2 className="text-4xl font-black mb-4 tracking-tight">Voice Mode</h2>
                <div className="h-8 flex items-center justify-center">
                    {voiceStatus === 'connecting' && (
                        <div className="flex items-center gap-2 text-indigo-100 bg-white/10 px-5 py-2 rounded-full backdrop-blur-sm border border-white/5 shadow-lg">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm font-bold tracking-wide">Connecting...</span>
                        </div>
                    )}
                    {voiceStatus === 'connected' && (
                        isAiSpeaking ? (
                            <div className="flex items-center gap-2 text-white bg-indigo-500/80 px-5 py-2 rounded-full backdrop-blur-sm animate-pulse shadow-lg shadow-indigo-500/20">
                                <Waves className="w-4 h-4" />
                                <span className="text-sm font-bold tracking-wide">EduFly is speaking</span>
                            </div>
                        ) : (
                            <p className="text-indigo-200 text-lg font-medium animate-in fade-in duration-500">I'm listening...</p>
                        )
                    )}
                    {voiceStatus === 'error' && (
                        <span className="text-red-200 bg-red-900/30 px-4 py-1.5 rounded-full text-sm font-medium border border-red-500/30">Connection Error</span>
                    )}
                </div>
            </div>

            {/* Central Visualizer Interaction Area */}
            <div className="relative w-64 h-64 flex items-center justify-center z-10">
                
                {/* Visualizer Rings */}
                {voiceStatus === 'connected' && !isAiSpeaking && (
                    <div 
                        ref={visualizerRef}
                        className="absolute inset-0 rounded-full bg-white/10 blur-2xl transition-transform duration-75"
                        style={{ transform: 'scale(1)' }}
                    ></div>
                )}

                {/* AI Speaking Ripples */}
                {isAiSpeaking && (
                    <>
                        <div className="absolute inset-0 rounded-full border border-indigo-400/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                        <div className="absolute inset-0 rounded-full border border-purple-400/20 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]"></div>
                    </>
                )}

                {/* Main Icon Button */}
                <div 
                    ref={iconContainerRef}
                    className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 relative z-10
                    ${voiceStatus === 'connected' 
                        ? (isAiSpeaking 
                            ? 'bg-indigo-600 border-4 border-indigo-400/50' 
                            : 'bg-white/10 backdrop-blur-md border border-white/30') 
                        : 'bg-white/5 border border-white/10'}`}
                >
                    {voiceStatus === 'connecting' ? (
                        <Loader2 className="w-12 h-12 text-white/50 animate-spin" />
                    ) : voiceStatus === 'connected' ? (
                        isAiSpeaking ? (
                            <Volume2 className="w-14 h-14 text-white" />
                        ) : (
                            <Mic className="w-14 h-14 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                        )
                    ) : (
                        <X className="w-12 h-12 text-red-300" />
                    )}
                </div>
            </div>
            
            <button 
                onClick={stopVoiceSession}
                className="mt-20 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all shadow-xl backdrop-blur-sm border border-white/10 text-lg flex items-center gap-3 hover:scale-105 active:scale-95"
            >
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]"></div>
                End Session
            </button>
        </div>
      )}

      {/* Standard Header */}
      <div className="bg-white p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
                <Sparkles className="text-white w-5 h-5" />
            </div>
            <div>
            <h2 className="text-slate-900 font-black text-lg">AI Study Buddy</h2>
            <p className="text-slate-500 text-xs font-medium">Always here to help</p>
            </div>
        </div>
        
        <button 
            onClick={startVoiceSession}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-colors shadow-md"
        >
            <Mic className="w-4 h-4" />
            Voice Mode
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-white ${
              msg.role === 'user' ? 'bg-indigo-100' : 'bg-white'
            }`}>
              {msg.role === 'user' ? <UserIcon className="w-5 h-5 text-indigo-600" /> : <Bot className="w-5 h-5 text-purple-600" />}
            </div>
            
            <div className={`max-w-[80%] rounded-2xl p-5 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
            }`}>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {msg.text.split('\n').map((line, i) => (
                  <p key={i} className="mb-1 last:mb-0 min-h-[1em]">{line}</p>
                ))}
              </div>
              
              {msg.role === 'model' && (
                <button 
                  onClick={() => handleSaveToNotes(msg.text)}
                  className="mt-3 flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-bold transition-colors bg-purple-50 px-3 py-1.5 rounded-lg w-fit"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Save to Notes
                </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5 text-purple-600" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-none p-4 flex items-center gap-3 shadow-sm border border-slate-100">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              <span className="text-sm font-medium text-slate-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-5 border-t border-slate-100 bg-white">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your question..."
            className="flex-1 border border-slate-200 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 shadow-inner font-medium text-slate-900"
            disabled={isLoading}
          />
          
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 rounded-xl transition-all shadow-lg hover:shadow-indigo-200 flex items-center justify-center transform hover:-translate-y-0.5"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatTutor;