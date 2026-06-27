export interface AssemblyAISpeechCallbacks {
  onTurn?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export class AssemblyAISpeechService {
  private socket: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private callbacks: AssemblyAISpeechCallbacks = {};
  private isListening = false;

  constructor(callbacks: AssemblyAISpeechCallbacks) {
    this.callbacks = callbacks;
  }

  public async start() {
    if (this.isListening) return;

    try {
      const tokenRes = await fetch('/api/assemblyai/token');
      if (!tokenRes.ok) {
        const errJson = await tokenRes.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errJson.error || `HTTP ${tokenRes.status}`);
      }

      const { token } = await tokenRes.json();
      if (!token) throw new Error('No token returned from server');

      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const wsUrl = `wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&speech_model=universal-3-5-pro&token=${token}`;
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isListening = true;
        this.initAudioPipeline();
      };

      this.socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'Turn') {
            this.callbacks.onTurn?.(msg.transcript || '', !!msg.end_of_turn);
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      this.socket.onerror = (err) => {
        console.error('AssemblyAI WebSocket Error:', err);
        this.callbacks.onError?.('AssemblyAI connection error.');
      };

      this.socket.onclose = () => {
        this.cleanup();
      };
    } catch (err: any) {
      console.error('AssemblyAI Start Error:', err);
      this.callbacks.onError?.(err?.message || 'Failed to start AssemblyAI speech recognition.');
      this.cleanup();
    }
  }

  private initAudioPipeline() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const sampleRate = this.audioContext.sampleRate;

      if (!this.mediaStream) return;
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      let pcmBuffer: number[] = [];

      this.scriptProcessor.onaudioprocess = (e) => {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        
        const targetSampleRate = 16000;
        const compression = sampleRate / targetSampleRate;
        const length = Math.floor(inputData.length / compression);

        for (let i = 0; i < length; i++) {
          const sample = inputData[Math.floor(i * compression)];
          const s = Math.max(-1, Math.min(1, sample));
          const pcm16 = s < 0 ? s * 0x8000 : s * 0x7FFF;
          pcmBuffer.push(pcm16);
        }

        if (pcmBuffer.length >= 1600) {
          const int16Array = new Int16Array(pcmBuffer);
          this.socket.send(int16Array.buffer);
          pcmBuffer = [];
        }
      };

      source.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);
    } catch (err: any) {
      console.error('Audio pipeline initialization error:', err);
    }
  }

  public stop() {
    if (!this.isListening) return;
    this.isListening = false;

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify({ type: 'Terminate' }));
      } catch (e) {}
    }

    setTimeout(() => {
      this.cleanup();
    }, 200);
  }

  private cleanup() {
    this.isListening = false;

    if (this.scriptProcessor) {
      try {
        this.scriptProcessor.disconnect();
      } catch (e) {}
      this.scriptProcessor = null;
    }

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }

    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach(t => t.stop());
      } catch (e) {}
      this.mediaStream = null;
    }

    if (this.socket) {
      try {
        if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
          this.socket.close();
        }
      } catch (e) {}
      this.socket = null;
    }
  }
}
