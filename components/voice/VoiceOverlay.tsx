// components/voice/VoiceOverlay.tsx — full-screen glass overlay: the voice
// copilot. Chips -> push-to-talk -> typed fallback, in that order of
// preference, but the overlay must never dead-end (client-side canned
// fallback if /api/converse fails).
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Send, X, ArrowRight, CalendarClock, Gauge, Mail, Lock, CheckCircle2 } from 'lucide-react';
import type { ConverseEffect, ConverseReply, Encounter } from '@/lib/types';
import { getCannedConversations } from '@/lib/agents/canned';
import { getSchedule } from '@/lib/api';
import { useDemoStore } from '@/lib/store';
import { Waveform, type VoiceState } from './Waveform';

interface SpeechResultLike { 0: { transcript: string }; isFinal: boolean }
interface SpeechEventLike { resultIndex: number; results: ArrayLike<SpeechResultLike> }
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface Message { role: 'user' | 'assistant'; text: string }

function speak(text: string, onEnd: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onEnd();
    return;
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => v.lang === 'en-US' && /natural|premium|enhanced/i.test(v.name)) ??
    voices.find((v) => v.lang === 'en-US') ??
    voices[0];
  if (preferred) utter.voice = preferred;
  utter.rate = 1.02;
  utter.onend = onEnd;
  utter.onerror = onEnd;
  window.speechSynthesis.speak(utter);
}

function matchCanned(text: string): ConverseReply {
  const conversations = getCannedConversations();
  const lower = text.toLowerCase();
  const exact = conversations.find((c) => c.utterance.toLowerCase() === lower);
  if (exact) return exact.response;
  const byKeyword = conversations.find((c) => {
    if (c.key === 'alvarez') return lower.includes('alvarez');
    if (c.key === 'budget') return lower.includes('how many') || lower.includes('budget');
    if (c.key === 'email') return lower.includes('email') || lower.includes('chief') || lower.includes('whitfield');
    return false;
  });
  if (byKeyword) return byKeyword.response;
  return (
    conversations[0]?.response ?? {
      reply: 'Here is what I can help with right now — try one of the suggestions below.',
    }
  );
}

export function VoiceOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const clinicianId = useDemoStore((s) => s.clinicianId);
  const currentDate = useDemoStore((s) => s.currentDate);
  const rescheduledIds = useDemoStore((s) => s.rescheduledIds);
  const applyReschedule = useDemoStore((s) => s.applyReschedule);
  const setEmailDraft = useDemoStore((s) => s.setEmailDraft);
  const sendEmail = useDemoStore((s) => s.sendEmail);

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [effect, setEffect] = useState<ConverseEffect | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isHolding, setIsHolding] = useState(false);
  const [micSupported] = useState(() => {
    if (typeof window === 'undefined') return false;
    const w = window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor };
    return !!w.webkitSpeechRecognition;
  });
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const liveTranscriptRef = useRef('');
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const handleClose = () => {
    window.speechSynthesis?.cancel();
    setVoiceState('idle');
    onClose();
  };

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setMessages((m) => [...m, { role: 'user', text: trimmed }]);
      setInputText('');
      setLiveTranscript('');
      setVoiceState('thinking');

      let reply: ConverseReply;
      try {
        const res = await fetch('/api/converse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clinicianId, message: trimmed }),
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        reply = await res.json();
      } catch {
        reply = matchCanned(trimmed);
      }

      setMessages((m) => [...m, { role: 'assistant', text: reply.reply }]);
      setVoiceState('speaking');
      speak(reply.reply, () => setVoiceState('idle'));

      if (reply.effect) {
        setEffect(reply.effect);
        setEmailSent(false);
        if (reply.effect.kind === 'reschedule') applyReschedule(reply.effect.encounterIds);
        if (reply.effect.kind === 'email') setEmailDraft(reply.effect.email);
      }
    },
    [clinicianId, applyReschedule, setEmailDraft],
  );

  const startHold = () => {
    const w = window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor };
    const Ctor = w.webkitSpeechRecognition;
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (e) => {
      let transcript = '';
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
      liveTranscriptRef.current = transcript;
      setLiveTranscript(transcript);
    };
    recognition.onerror = () => setIsHolding(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsHolding(true);
    setVoiceState('listening');
  };

  const endHold = () => {
    const recognition = recognitionRef.current;
    setIsHolding(false);
    setVoiceState('idle');
    if (!recognition) return;
    recognition.stop();
    recognitionRef.current = null;
    const transcript = liveTranscriptRef.current;
    liveTranscriptRef.current = '';
    setLiveTranscript('');
    if (transcript.trim()) void sendMessage(transcript);
  };

  if (!open) return null;

  const suggestions = getCannedConversations();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white/70 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-5">
        <span className="text-sm font-semibold text-stone-800">Talk to Sentinel</span>
        <button
          onClick={handleClose}
          className="rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-900/5 hover:text-stone-800"
          aria-label="Close voice overlay"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-hidden px-6 pb-6">
        <div className="flex justify-center pb-4 pt-2">
          <Waveform state={voiceState} />
        </div>

        <div className="flex flex-col gap-2">
          {suggestions.map((s) => (
            <button
              key={s.key}
              onClick={() => sendMessage(s.utterance)}
              className="flex items-start gap-2 rounded-xl border border-stone-200 bg-white/80 px-4 py-2.5 text-left text-sm text-stone-600 shadow-sm transition-colors hover:border-stone-300 hover:bg-white"
            >
              <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" />
              {s.utterance}
            </button>
          ))}
        </div>

        <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-stone-900 text-white'
                    : 'border border-stone-200 bg-white text-stone-700 shadow-sm'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {isHolding && liveTranscript && (
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl bg-stone-400/70 px-4 py-2.5 text-sm italic text-white">
                {liveTranscript}
              </div>
            </div>
          )}

          {effect && (
            <EffectPanel
              effect={effect}
              clinicianId={clinicianId}
              currentDate={currentDate}
              rescheduledIds={rescheduledIds}
              emailSent={emailSent}
              onSendEmail={() => {
                if (effect.kind === 'email') {
                  sendEmail(effect.email);
                  setEmailSent(true);
                }
              }}
            />
          )}
          <div ref={transcriptEndRef} />
        </div>

        <div className="mt-4 flex items-center gap-2">
          {micSupported && (
            <button
              onMouseDown={startHold}
              onMouseUp={endHold}
              onMouseLeave={() => isHolding && endHold()}
              onTouchStart={startHold}
              onTouchEnd={endHold}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
                isHolding ? 'bg-sky-600 text-white' : 'bg-stone-900 text-white hover:bg-stone-700'
              }`}
              aria-label="Hold to talk"
              title="Hold to talk"
            >
              <Mic className="h-4.5 w-4.5" />
            </button>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(inputText);
            }}
            className="flex flex-1 items-center gap-2"
          >
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={micSupported ? 'Or type to Sentinel…' : 'Type to Sentinel…'}
              className="flex-1 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 outline-none placeholder:text-stone-400 focus:border-stone-400"
            />
            <button
              type="submit"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-900 text-white transition-colors hover:bg-stone-700"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function EffectPanel({
  effect,
  clinicianId,
  currentDate,
  rescheduledIds,
  emailSent,
  onSendEmail,
}: {
  effect: ConverseEffect;
  clinicianId: string;
  currentDate: string;
  rescheduledIds: string[];
  emailSent: boolean;
  onSendEmail: () => void;
}) {
  if (effect.kind === 'reschedule') {
    const schedule = getSchedule('chen', currentDate);
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-800">
          <CalendarClock className="h-4 w-4 text-sky-600" />
          Schedule updated
        </div>
        <div className="space-y-1.5">
          {schedule.map((enc: Encounter) => {
            const moved = effect.encounterIds.includes(enc.id) && rescheduledIds.includes(enc.id);
            return (
              <div
                key={enc.id}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                  moved ? 'bg-stone-50 text-stone-400' : 'text-stone-700'
                }`}
              >
                <span className={moved ? 'line-through' : ''}>
                  {enc.time} · {enc.patient} — {enc.reason}
                </span>
                {moved && <span className="text-xs font-medium text-sky-600">moved</span>}
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-sm text-stone-500">{effect.summary}</p>
      </div>
    );
  }

  if (effect.kind === 'budget') {
    const schedule = getSchedule(clinicianId, currentDate);
    const candidates = schedule.filter((enc) => effect.deferralIds.includes(enc.id));
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-800">
          <Gauge className="h-4 w-4 text-amber-600" />
          Load budget
        </div>
        <div className="flex gap-6">
          <div>
            <p className="text-2xl font-semibold tabular-nums text-stone-900">{effect.booked}</p>
            <p className="text-xs text-stone-400">Booked today</p>
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums text-emerald-600">{effect.recommended}</p>
            <p className="text-xs text-stone-400">Recovery-adjusted budget</p>
          </div>
        </div>
        {candidates.length > 0 && (
          <div className="mt-3 space-y-1.5 border-t border-stone-100 pt-3">
            <p className="text-xs font-medium text-stone-400">Deferral candidates</p>
            {candidates.map((enc) => (
              <div key={enc.id} className="flex items-center justify-between text-sm text-stone-600">
                <span>{enc.time} · {enc.patient} — {enc.reason}</span>
                {enc.telehealthOk && <span className="text-xs text-sky-600">telehealth ok</span>}
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 text-sm text-stone-500">{effect.summary}</p>
      </div>
    );
  }

  const { email } = effect;
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-800">
        <Mail className="h-4 w-4 text-violet-600" />
        {email.subject}
      </div>
      <p className="text-xs text-stone-400">To {email.to}</p>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg bg-emerald-50 p-2.5">
          <p className="mb-1 font-semibold text-emerald-700">Includes</p>
          <ul className="space-y-0.5 text-emerald-700">
            {email.redactionManifest.included.map((item, i) => <li key={i}>• {item}</li>)}
          </ul>
        </div>
        <div className="rounded-lg bg-red-50 p-2.5">
          <p className="mb-1 flex items-center gap-1 font-semibold text-red-700">
            <Lock className="h-3 w-3" /> Excludes
          </p>
          <ul className="space-y-0.5 text-red-700">
            {email.redactionManifest.excluded.map((item, i) => <li key={i}>• {item}</li>)}
          </ul>
        </div>
      </div>
      {emailSent ? (
        <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-emerald-600">
          <CheckCircle2 className="h-4 w-4" /> Sent — only your workload data was included.
        </div>
      ) : (
        <button
          onClick={onSendEmail}
          className="mt-3 rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800"
        >
          Send
        </button>
      )}
    </div>
  );
}
