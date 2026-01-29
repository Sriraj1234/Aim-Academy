class GeminiAudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.buffer = [];
        this.hasStarted = false;
        // Bind message handler to receive audio from main thread
        this.port.onmessage = this.handleMessage.bind(this);
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];

        // Handle Input (Microphone) -> Send to Main Thread
        if (input && input.length > 0) {
            const inputChannel = input[0];
            // Downsample or process if needed (Input is usually 44.1k/48k, Gemini wants 16k)
            // For simplicity, we send chunks to main thread to resample/encode
            // Optimization: We can do simple decimation here if ratios match
            if (inputChannel.length > 0) {
                this.port.postMessage({
                    type: 'audioChunk',
                    audio: inputChannel
                });
            }
        }

        // Handle Output (Speaker) <- Read from Buffer
        if (output && output.length > 0) {
            const outputChannel = output[0];

            if (this.buffer.length >= outputChannel.length) {
                // Fill output buffer
                for (let i = 0; i < outputChannel.length; i++) {
                    outputChannel[i] = this.buffer[i];
                }
                // Remove used data
                this.buffer = this.buffer.slice(outputChannel.length);
                this.hasStarted = true;
            } else if (this.hasStarted && this.buffer.length > 0) {
                // Buffer underrun but we have some data
                for (let i = 0; i < this.buffer.length; i++) {
                    outputChannel[i] = this.buffer[i];
                }
                this.buffer = [];
            } else {
                // Silence
            }
        }

        return true;
    }

    handleMessage(event) {
        if (event.data.type === 'audioData') {
            // Receive PCM Int16 audio from Gemini API (via main thread)
            // Convert ArrayBuffer to Int16Array, then to Float32 for WebAudio
            const int16Data = new Int16Array(event.data.audio);
            const floatData = new Float32Array(int16Data.length);

            // Convert Int16 PCM to Float32 (-1.0 to 1.0 range)
            for (let i = 0; i < int16Data.length; i++) {
                floatData[i] = int16Data[i] / 32768.0;
            }

            // Append to buffer for playback
            this.buffer = [...this.buffer, ...floatData];
        }
        if (event.data.type === 'clear') {
            this.buffer = [];
            this.hasStarted = false;
        }
    }
}

registerProcessor('gemini-audio-processor', GeminiAudioProcessor);
