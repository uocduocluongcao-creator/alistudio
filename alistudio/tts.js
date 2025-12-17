// ElevenLabs TTS Logic for AliStudio

const textInput = document.getElementById('text-input');
const voiceSelect = document.getElementById('voice-select');
const stabilityInput = document.getElementById('stability');
const stabilityValue = document.getElementById('stability-value');
const similarityInput = document.getElementById('similarity');
const similarityValue = document.getElementById('similarity-value');
const speakBtn = document.getElementById('speak-btn');
const stopBtn = document.getElementById('stop-btn');
const downloadBtn = document.getElementById('download-btn');
const visualizer = document.getElementById('visualizer');

const API_KEY = 'sk_87cfe203464e933c43f88042b9e5b6fed7e00c22ffe42cef';

let audioContext;
let analyser;
let source;
let audioBuffer;
let audioBlob; // Store the blob for downloading
let isPlaying = false;
let animationId;

// Initialize Visualizer Bars
function initVisualizer() {
    visualizer.innerHTML = '';
    for (let i = 0; i < 20; i++) {
        const bar = document.createElement('div');
        bar.classList.add('bar');
        bar.style.height = '10%';
        visualizer.appendChild(bar);
    }
}

// Fetch Voices from ElevenLabs
async function fetchVoices() {
    voiceSelect.innerHTML = '<option value="">Đang tải...</option>';
    try {
        const response = await fetch('https://api.elevenlabs.io/v1/voices', {
            headers: {
                'xi-api-key': API_KEY
            }
        });

        if (!response.ok) throw new Error('Invalid API Key');

        const data = await response.json();
        voiceSelect.innerHTML = '';

        // Sort voices
        data.voices.sort((a, b) => a.name.localeCompare(b.name));

        data.voices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.voice_id;
            option.textContent = `${voice.name} (${voice.category})`;
            voiceSelect.appendChild(option);
        });

    } catch (error) {
        console.error(error);
        voiceSelect.innerHTML = '<option value="">Lỗi kết nối API</option>';
    }
}

// Automatically fetch voices on load
fetchVoices();

// Stream Audio from ElevenLabs
async function speak() {
    if (isPlaying) return;

    const text = textInput.value.trim();
    const voiceId = voiceSelect.value;

    if (!text || !voiceId) {
        alert('Vui lòng nhập văn bản và chọn giọng đọc');
        return;
    }

    speakBtn.disabled = true;
    downloadBtn.disabled = true; // Disable download while generating
    speakBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
        </svg>
        Đang xử lý...
    `;

    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'xi-api-key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                model_id: "eleven_multilingual_v2",
                voice_settings: {
                    stability: parseFloat(stabilityInput.value),
                    similarity_boost: parseFloat(similarityInput.value)
                }
            })
        });

        if (!response.ok) throw new Error('TTS Request Failed');

        const arrayBuffer = await response.arrayBuffer();

        // Store blob for download
        audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
        downloadBtn.disabled = false; // Enable download button

        playAudio(arrayBuffer);

    } catch (error) {
        console.error(error);
        alert('Có lỗi xảy ra khi tạo giọng đọc.');
        resetUI();
    }
}

// Play Audio with Web Audio API
async function playAudio(arrayBuffer) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    try {
        // We need to copy the buffer because decodeAudioData detaches it
        const bufferCopy = arrayBuffer.slice(0);
        audioBuffer = await audioContext.decodeAudioData(bufferCopy);

        source = audioContext.createBufferSource();
        source.buffer = audioBuffer;

        analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;

        source.connect(analyser);
        analyser.connect(audioContext.destination);

        source.onended = () => {
            resetUI();
        };

        source.start(0);
        isPlaying = true;

        speakBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="10 8 16 12 10 16 10 8"></polygon>
            </svg>
            Đang đọc...
        `;

        startVisualizer();

    } catch (error) {
        console.error(error);
        resetUI();
    }
}

function stopAudio() {
    if (source) {
        source.stop();
    }
    resetUI();
}

function downloadAudio() {
    if (!audioBlob) return;

    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'alistudio_tts.mp3';
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
}

function resetUI() {
    isPlaying = false;
    speakBtn.disabled = false;
    speakBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        Đọc ngay
    `;
    stopVisualizer();
}

// Visualizer
function startVisualizer() {
    if (!analyser) return;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const bars = document.querySelectorAll('.bar');

    function animate() {
        if (!isPlaying) return;

        analyser.getByteFrequencyData(dataArray);

        // Map frequency data to bars (we have 20 bars, dataArray has 32 bins)
        for (let i = 0; i < bars.length; i++) {
            const value = dataArray[i];
            const height = (value / 255) * 100;
            bars[i].style.height = `${Math.max(10, height)}%`;
        }

        animationId = requestAnimationFrame(animate);
    }
    animate();
}

function stopVisualizer() {
    cancelAnimationFrame(animationId);
    const bars = document.querySelectorAll('.bar');
    bars.forEach(bar => {
        bar.style.height = '10%';
    });
}

// Event Listeners
speakBtn.addEventListener('click', speak);
stopBtn.addEventListener('click', stopAudio);
downloadBtn.addEventListener('click', downloadAudio);

stabilityInput.addEventListener('input', () => {
    stabilityValue.textContent = stabilityInput.value;
});

similarityInput.addEventListener('input', () => {
    similarityValue.textContent = similarityInput.value;
});

// Init
initVisualizer();
