class AudioTrainer {
  constructor() {
    this.audio = new Audio();
    this.isLocked = false;
    this.showFirstVisitTips();
    this.initEventListeners();
  }

  showFirstVisitTips() {
    if (!localStorage.getItem("visited")) {
      const tips = [
        "上传MP3音频开始训练",
        "滑动调节或点击预设速度",
        "智能静音压缩可跳过空白段落",
        "调试模式可保持控制面板可用",
      ];
      alert("欢迎使用听力训练器！\n\n" + tips.join("\n"));
      localStorage.setItem("visited", "true");
    }
  }

  initEventListeners() {
    document.getElementById("audioFile").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        this.loadAudio(file);
        document.getElementById("fileName").textContent = file.name;
      }
    });

    document
      .getElementById("playBtn")
      .addEventListener("click", () => this.togglePlayback());

    document.getElementById("speed").addEventListener("input", (e) => {
      this.audio.playbackRate = e.target.value;
      document.getElementById("currentSpeed").textContent =
        `${e.target.value}x`;
    });

    document.querySelectorAll(".preset-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        document
          .querySelectorAll(".preset-btn")
          .forEach((b) => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        const speed = parseFloat(e.currentTarget.dataset.speed);
        this.audio.playbackRate = speed;
        document.getElementById("speed").value = speed;
        document.getElementById("currentSpeed").textContent = `${speed}x`;
      });
    });

    document.getElementById("debugMode").addEventListener("change", (e) => {
      this.toggleLockState(!e.target.checked);
      document.getElementById("lockStatus").style.display = e.target.checked
        ? "none"
        : "flex";
    });

    this.audio.addEventListener("timeupdate", () => this.updateTimeDisplay());
  }

  toggleLockState(locked) {
    this.isLocked = locked;
    document.querySelectorAll("input, button").forEach((el) => {
      if (el.id !== "debugMode" && el.id !== "audioFile") {
        el.disabled = locked;
        el.classList.toggle("disabled", locked);
      }
    });
  }

  initSilenceProcessing() {
    const statusEl = document.getElementById("processStatus");
    if (!document.getElementById("reduceSilence").checked) {
      statusEl.textContent = "";
      return;
    }

    statusEl.textContent = "静音检测中...";
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
      const isSilent = dataArray.every((v) => v < 20);

      if (isSilent) {
        if (!silenceStart) silenceStart = this.audio.currentTime;
        statusEl.textContent = `⏳ 检测到静音 (已跳过${(this.audio.currentTime - silenceStart).toFixed(1)}秒)`;
      } else {
        if (silenceStart) {
          const silenceDuration = this.audio.currentTime - silenceStart;
          if (silenceDuration > 0.5) {
            this.audio.currentTime += silenceDuration * 0.7;
            statusEl.textContent = `⏩ 已跳过${silenceDuration.toFixed(1)}秒静音`;
          }
          silenceStart = null;
        }
        statusEl.textContent = "✅ 正常播放中";
      }
      requestAnimationFrame(detectSilence);
    };
    detectSilence();
  }

  updateTimeDisplay() {
    const display = document.getElementById("timeDisplay");
    const format = (seconds) => {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };
    display.textContent = `${format(this.audio.currentTime)} / ${format(this.audio.duration)}`;
    if (this.audio.duration > 0) {
      const progressPercent =
        (this.audio.currentTime / this.audio.duration) * 100;
      document.getElementById("audioProgress").style.width =
        `${progressPercent}%`;
    }
  }
}

// 初始化应用
new AudioTrainer();
