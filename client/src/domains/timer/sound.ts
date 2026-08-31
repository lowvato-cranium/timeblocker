// The "system ding" is synthesized rather than a bundled audio asset — a
// short two-note chime via the Web Audio API needs no file to ship or host.
function playTone(ctx: AudioContext, frequency: number, startTime: number, duration: number) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

export function playDefaultDing() {
  const AudioContextCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioContextCtor();
  const now = ctx.currentTime;
  playTone(ctx, 988, now, 0.35); // B5
  playTone(ctx, 784, now + 0.18, 0.4); // G5
}

export function playCustomSound(url: string) {
  const audio = new Audio(url);
  audio.play().catch(() => {
    // Autoplay can be blocked with no prior user interaction on the page;
    // failing silently is preferable to an unhandled rejection.
  });
}

export function playNotificationSound(customSoundUrl: string | null) {
  if (customSoundUrl) {
    playCustomSound(customSoundUrl);
  } else {
    playDefaultDing();
  }
}
