// Web Audio API synthesized musical ringtones (no external MP3 downloads needed)

class RingtoneManager {
  private audioCtx: AudioContext | null = null;
  private isRinging: boolean = false;
  private timerId: any = null;

  private getContext(): AudioContext | null {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  // Melodic chime note
  private playNote(freq: number, startTime: number, duration: number, gainValue = 0.15) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      // Soft marimba / chime attack and decay
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(gainValue, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {}
  }

  // Incoming call melody (pleasant 4-note harp/marimba chime loop)
  public startIncomingRingtone() {
    this.stop();
    this.isRinging = true;

    const playPattern = () => {
      if (!this.isRinging) return;
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Notes: E5 (659Hz), G#5 (830Hz), B5 (987Hz), E6 (1318Hz)
      this.playNote(659.25, now, 0.4, 0.2);
      this.playNote(830.61, now + 0.18, 0.4, 0.2);
      this.playNote(987.77, now + 0.36, 0.4, 0.2);
      this.playNote(1318.51, now + 0.54, 0.7, 0.25);

      if (navigator.vibrate) {
        try { navigator.vibrate([400, 200, 400]); } catch {}
      }

      this.timerId = setTimeout(playPattern, 2400);
    };

    playPattern();
  }

  // Outgoing call ringback tone (gentle European/US dial pulse)
  public startOutgoingRingback() {
    this.stop();
    this.isRinging = true;

    const playPulse = () => {
      if (!this.isRinging) return;
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      this.playNote(440, now, 1.2, 0.08);
      this.playNote(480, now, 1.2, 0.08);

      this.timerId = setTimeout(playPulse, 3500);
    };

    playPulse();
  }

  public stop() {
    this.isRinging = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}

export const ringtone = new RingtoneManager();
