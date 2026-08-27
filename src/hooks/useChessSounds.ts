const audioCtx = () => {
  if (!(window as any).__chessAudioCtx) {
    (window as any).__chessAudioCtx = new AudioContext();
  }
  return (window as any).__chessAudioCtx as AudioContext;
};

function playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.15) {
  const ctx = audioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, volume = 0.08) {
  const ctx = audioCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(800, ctx.currentTime);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

export type ChessSoundType = "move" | "capture" | "check" | "checkmate" | "castle" | "promote" | "illegal" | "gameStart" | "gameEnd" | "timeout" | "draw";

export function playChessSound(type: ChessSoundType) {
  try {
    switch (type) {
      case "move":
        playTone(600, 0.08, "sine", 0.12);
        playNoise(0.05, 0.06);
        break;
      case "capture":
        playNoise(0.12, 0.15);
        playTone(300, 0.1, "triangle", 0.1);
        break;
      case "check":
        playTone(880, 0.06, "square", 0.1);
        setTimeout(() => playTone(1100, 0.1, "square", 0.08), 70);
        break;
      case "checkmate":
        playTone(523, 0.15, "sine", 0.15);
        setTimeout(() => playTone(659, 0.15, "sine", 0.15), 150);
        setTimeout(() => playTone(784, 0.25, "sine", 0.18), 300);
        break;
      case "castle":
        playTone(500, 0.06, "sine", 0.1);
        setTimeout(() => playTone(600, 0.08, "sine", 0.1), 80);
        playNoise(0.06, 0.05);
        break;
      case "promote":
        playTone(400, 0.1, "sine", 0.12);
        setTimeout(() => playTone(600, 0.1, "sine", 0.12), 100);
        setTimeout(() => playTone(800, 0.15, "sine", 0.14), 200);
        break;
      case "illegal":
        playTone(200, 0.15, "sawtooth", 0.08);
        break;
      case "gameStart":
        playTone(440, 0.1, "sine", 0.1);
        setTimeout(() => playTone(660, 0.12, "sine", 0.12), 120);
        break;
      case "gameEnd":
        playTone(660, 0.12, "sine", 0.1);
        setTimeout(() => playTone(440, 0.2, "sine", 0.1), 150);
        break;
      case "timeout":
        playTone(300, 0.3, "sawtooth", 0.12);
        setTimeout(() => playTone(200, 0.4, "sawtooth", 0.1), 300);
        break;
      case "draw":
        playTone(440, 0.15, "sine", 0.1);
        setTimeout(() => playTone(440, 0.15, "sine", 0.1), 200);
        break;
    }
  } catch {
    // Audio not available
  }
}
