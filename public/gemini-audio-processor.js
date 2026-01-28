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
                    type: 'input_audio',
                    buffer: inputChannel
                });
            }
        }

        // Handle Output (Speaker) <- Read from Buffer (STEREO - both channels)
        if (output && output.length > 0) {
            const leftChannel = output[0];
            const rightChannel = output[1] || output[0]; // Fallback to left if no right

            if (this.buffer.length >= leftChannel.length) {
                // Fill both output channels for stereo
                for (let i = 0; i < leftChannel.length; i++) {
                    const sample = this.buffer[i];
                    leftChannel[i] = sample;
                    if (output[1]) rightChannel[i] = sample; // Copy to right channel
                }
                // Remove used data
                this.buffer = this.buffer.slice(leftChannel.length);
                this.hasStarted = true;
            } else if (this.hasStarted && this.buffer.length > 0) {
                // Buffer underrun but we have some data
                for (let i = 0; i < this.buffer.length; i++) {
                    const sample = this.buffer[i];
                    leftChannel[i] = sample;
                    if (output[1]) rightChannel[i] = sample; // Copy to right channel
                }
                this.buffer = [];
            } else {
                // Silence
            }
        }

        return true;
    }

    handleMessage(event) {
        if (event.data.type === 'output_audio') {
            // Receive float32 audio from WebSocket (via main thread)
            const newAudio = new Float32Array(event.data.buffer);
            // Append to buffer
            // Note: In production, use a RingBuffer for performance
            // Javascript arrays are okay for small buffers
            this.buffer = [...this.buffer, ...newAudio];
        }
        if (event.data.type === 'clear') {
            this.buffer = [];
            this.hasStarted = false;
        }
    }
}

registerProcessor('gemini-audio-processor', GeminiAudioProcessor);
