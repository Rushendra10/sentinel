// components/voice/Waveform.tsx — the pulsing center of the voice overlay.
// Pure CSS animation, state-driven (idle/listening/thinking/speaking).
'use client';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

const STATE_META: Record<VoiceState, { color: string; label: string; speed: string }> = {
  idle: { color: '#a8a29e', label: 'Tap a suggestion, hold to talk, or type below', speed: '3.2s' },
  listening: { color: '#0284c7', label: 'Listening…', speed: '1.1s' },
  thinking: { color: '#d97706', label: 'Thinking…', speed: '1.6s' },
  speaking: { color: '#059669', label: 'Speaking…', speed: '0.9s' },
};

export function Waveform({ state }: { state: VoiceState }) {
  const meta = STATE_META[state];
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex h-36 w-36 items-center justify-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute inset-0 rounded-full"
            style={{
              border: `1.5px solid ${meta.color}`,
              opacity: state === 'idle' ? 0.18 : 0.35,
              animation: state === 'idle' ? 'none' : `voiceRing ${meta.speed} ease-out ${i * 0.35}s infinite`,
            }}
          />
        ))}
        <div
          className="relative flex h-20 w-20 items-center justify-center rounded-full transition-colors duration-300"
          style={{ backgroundColor: `${meta.color}22` }}
        >
          <div
            className="h-9 w-9 rounded-full transition-all duration-300"
            style={{
              backgroundColor: meta.color,
              animation: state === 'idle' ? 'none' : `voicePulse ${meta.speed} ease-in-out infinite`,
            }}
          />
        </div>
      </div>
      <p className="text-sm font-medium text-stone-500">{meta.label}</p>
    </div>
  );
}
