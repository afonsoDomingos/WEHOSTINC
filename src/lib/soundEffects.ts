// Web Audio API Sound Effects for Webmail Notifications & Actions
// Zero dependencies, works offline, lightweight and clean

class SoundEffectManager {
  private audioCtx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioCtx) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          this.audioCtx = new AudioCtxClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  // 🔔 Som de novo e-mail recebido (Chime melódico cristalino de 2 tons)
  playNewEmailSound(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Primeiro tom (Mi - 659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.25, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);

      // Segundo tom mais alto (Lá - 880.00 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, now + 0.12);
      gain2.gain.setValueAtTime(0, now + 0.12);
      gain2.gain.linearRampToValueAtTime(0.3, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.7);
    } catch (e) {
      console.warn('[SoundEffects] Error playing new email sound:', e);
    }
  }

  // 🚀 Som de e-mail enviado com sucesso (Whoosh suave / tom ascendente positivo)
  playSendEmailSound(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      
      // Sweep ascendente de frequência (300Hz -> 900Hz)
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.22);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('[SoundEffects] Error playing send email sound:', e);
    }
  }

  // 🗑️ Som de e-mail eliminado / movido para lixeira (Pop / tom suave descendente)
  playDeleteEmailSound(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';

      // Sweep descendente rápido (500Hz -> 180Hz)
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      console.warn('[SoundEffects] Error playing delete email sound:', e);
    }
  }

  // ⭐ Som de estrela (Toggle favorito) - pop leve bidirecional
  playStarSound(isStarring: boolean): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      // Adicionar estrela: tom sobe; remover: tom desce
      osc.frequency.setValueAtTime(isStarring ? 440 : 600, now);
      osc.frequency.exponentialRampToValueAtTime(isStarring ? 880 : 300, now + 0.1);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.warn('[SoundEffects] Error playing star sound:', e);
    }
  }

  // 📌 Som de clique mecânico (Fixar / desafixar mensagem)
  playPinSound(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Dois cliques rápidos como um "snap"
      [0, 0.06].forEach((offset, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(i === 0 ? 900 : 700, now + offset);
        gain.gain.setValueAtTime(0.07, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.05);
      });
    } catch (e) {
      console.warn('[SoundEffects] Error playing pin sound:', e);
    }
  }

  // 🔔 Som de login com sucesso (Acorde triunfante de 3 tons)
  playLoginSuccessSound(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99]; // Dó - Mi - Sol (acorde maior)
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.2, now + i * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.5);
      });
    } catch (e) {
      console.warn('[SoundEffects] Error playing login success sound:', e);
    }
  }

  // 📁 Som de mudança de pasta (Swoosh neutro suave)
  playFolderSwitchSound(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.12);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.warn('[SoundEffects] Error playing folder switch sound:', e);
    }
  }

  // 🤖 Som de IA concluída (Tom positivo duplo ascendente)
  playAICompleteSound(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const pairs = [[440, 0], [660, 0.14]];
      pairs.forEach(([freq, offset]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + offset);
        gain.gain.setValueAtTime(0, now + offset);
        gain.gain.linearRampToValueAtTime(0.2, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.28);
      });
    } catch (e) {
      console.warn('[SoundEffects] Error playing AI complete sound:', e);
    }
  }

  // 📎 Som de ficheiro anexado (Clique seco curto)
  playAttachSound(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {
      console.warn('[SoundEffects] Error playing attach sound:', e);
    }
  }
}

export const soundEffects = new SoundEffectManager();
