// Web Audio API Weather Ambient Soundscape Synthesizer
// Zero external assets required — native browser synthesis

class WeatherAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private gainNode: GainNode | null = null;
  private activeNodes: (AudioNode | number)[] = [];
  private currentMode: "rain" | "wind" | "storm" | "sunny" = "rain";

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public play(condition: string, volume: number = 0.3) {
    this.stop();
    this.initContext();
    if (!this.ctx) return;

    this.isPlaying = true;
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.8);
    this.gainNode.connect(this.ctx.destination);

    const condLower = condition.toLowerCase();
    if (condLower.includes("thunder") || condLower.includes("lightning") || condLower.includes("hail")) {
      this.currentMode = "storm";
      this.synthesizeRain(this.gainNode);
      this.synthesizeWind(this.gainNode, 0.4);
      this.scheduleThunder(this.gainNode);
    } else if (condLower.includes("rain") || condLower.includes("drizzle") || condLower.includes("shower")) {
      this.currentMode = "rain";
      this.synthesizeRain(this.gainNode);
    } else if (condLower.includes("wind") || condLower.includes("fog") || condLower.includes("snow") || condLower.includes("cold")) {
      this.currentMode = "wind";
      this.synthesizeWind(this.gainNode, 0.5);
    } else {
      this.currentMode = "sunny";
      this.synthesizeSunnyBreeze(this.gainNode);
    }
  }

  public setVolume(vol: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  public stop() {
    if (this.gainNode && this.ctx) {
      try {
        this.gainNode.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      } catch (e) {
        // ignore
      }
    }
    this.activeNodes.forEach((node) => {
      if (typeof node === "number") {
        window.clearTimeout(node);
      } else {
        try {
          (node as any).stop?.();
          (node as any).disconnect?.();
        } catch (e) {
          // ignore
        }
      }
    });
    this.activeNodes = [];
    this.isPlaying = false;
  }

  public getStatus() {
    return {
      isPlaying: this.isPlaying,
      mode: this.currentMode,
    };
  }

  // Synthesize realistic steady rain using filtered noise
  private synthesizeRain(destination: GainNode) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to simulate raindrops hitting surfaces
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 1100;
    bandpass.Q.value = 0.5;

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 400;

    whiteNoise.connect(bandpass);
    bandpass.connect(highpass);
    highpass.connect(destination);

    whiteNoise.start(0);
    this.activeNodes.push(whiteNoise, bandpass, highpass);
  }

  // Synthesize atmospheric wind using lowpass sweeping noise
  private synthesizeWind(destination: GainNode, intensity: number = 0.3) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02; // Brown noise approximation
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const windSource = this.ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 350;

    // LFO to make wind swell naturally
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.18; // Slow wind gusts
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 240 * intensity;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    windSource.connect(filter);
    filter.connect(destination);

    windSource.start(0);
    lfo.start(0);
    this.activeNodes.push(windSource, filter, lfo, lfoGain);
  }

  // Synthesize calm sunny ambient pad
  private synthesizeSunnyBreeze(destination: GainNode) {
    if (!this.ctx) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.value = 261.63; // C4
    osc2.frequency.value = 329.63; // E4

    const padGain = this.ctx.createGain();
    padGain.gain.value = 0.08;

    osc1.connect(padGain);
    osc2.connect(padGain);
    padGain.connect(destination);

    osc1.start(0);
    osc2.start(0);
    this.activeNodes.push(osc1, osc2, padGain);
  }

  // Occasional thunder rumble
  private scheduleThunder(destination: GainNode) {
    if (!this.ctx || !this.isPlaying) return;
    const delay = Math.random() * 8000 + 4000;
    const timerId = window.setTimeout(() => {
      if (!this.isPlaying || !this.ctx) return;
      this.triggerThunderStrike(destination);
      this.scheduleThunder(destination);
    }, delay);
    this.activeNodes.push(timerId);
  }

  private triggerThunderStrike(destination: GainNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(90, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 1.8);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(140, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 2.0);

    const tGain = this.ctx.createGain();
    tGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    tGain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 0.2);
    tGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.4);

    osc.connect(filter);
    filter.connect(tGain);
    tGain.connect(destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 2.5);
  }
}

export const weatherAudio = new WeatherAudioSynthesizer();
