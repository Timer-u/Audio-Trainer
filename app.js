class AudioTrainer {
    constructor() {
        this.audio = new Audio();
        this.isLocked = false;
        this.initEventListeners();
    }

    initEventListeners() {
        // 文件选择
        document.getElementById('audioFile').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.loadAudio(file);
        });

        // 播放控制
        document.getElementById('playBtn').addEventListener('click', () => this.togglePlayback());

        // 速度控制
        document.getElementById('speed').addEventListener('input', (e) => {
            this.audio.playbackRate = e.target.value;
        });

        // 预设速度按钮
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const speed = parseFloat(btn.dataset.speed);
                this.audio.playbackRate = speed;
                document.getElementById('speed').value = speed;
            });
        });

        // 调试模式切换
        document.getElementById('debugMode').addEventListener('change', (e) => {
            this.toggleLockState(!e.target.checked);
        });

        // 时间更新显示
        this.audio.addEventListener('timeupdate', () => {
            this.updateTimeDisplay();
        });
    }

    loadAudio(file) {
        const url = URL.createObjectURL(file);
        this.audio.src = url;
        this.audio.addEventListener('loadedmetadata', () => {
            this.updateTimeDisplay();
        });
    }

    togglePlayback() {
        const btnIcon = document.querySelector('#playBtn i');
        if (this.audio.paused) {
            this.audio.play();
            btnIcon.textContent = 'pause';
            if (!document.getElementById('debugMode').checked) {
                this.toggleLockState(true);
            }
            this.initSilenceProcessing();
        } else {
            this.audio.pause();
            btnIcon.textContent = 'play_arrow';
        }
    }

    toggleLockState(locked) {
        this.isLocked = locked;
        document.querySelectorAll('input, button').forEach(el => {
            if (el.id !== 'debugMode' && el.id !== 'audioFile') {
                el.disabled = locked;
                el.classList.toggle('disabled', locked);
            }
        });
    }

    initSilenceProcessing() {
        if (!document.getElementById('reduceSilence').checked) return;

        const context = new (window.AudioContext || window.webkitAudioContext)();
        const source = context.createMediaElementSource(this.audio);
        const analyser = context.createAnalyser();
        
        source.connect(analyser);
        analyser.connect(context.destination);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        let silenceStart = null;

        const detectSilence = () => {
            analyser.getByteFrequencyData(dataArray);
            const isSilent = dataArray.every(v => v < 20);

            if (isSilent) {
                if (!silenceStart) silenceStart = this.audio.currentTime;
            } else {
                if (silenceStart) {
                    const silenceDuration = this.audio.currentTime - silenceStart;
                    if (silenceDuration > 0.5) {
                        this.audio.currentTime += silenceDuration * 0.7;
                    }
                    silenceStart = null;
                }
            }
            requestAnimationFrame(detectSilence);
        };
        detectSilence();
    }

    updateTimeDisplay() {
        const display = document.getElementById('timeDisplay');
        const format = (seconds) => {
            const m = Math.floor(seconds / 60);
            const s = Math.floor(seconds % 60);
            return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };
        display.textContent = `${format(this.audio.currentTime)} / ${format(this.audio.duration)}`;
    }
}

// 初始化应用
new AudioTrainer();