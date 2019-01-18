function recrodFun() {
    this.startRecord = () => {
        window.navigator.mediaDevices.getUserMedia({
            audio: {
                sampleRate: 44100, // 采样率
                channelCount: 2,   // 声道
                volume: 1.0        // 音量
            }
        }).then(mediaStream => {
            console.log(mediaStream);
            this.beginRecord(mediaStream);
        }).catch(err => {
            // 如果用户电脑没有麦克风设备或者用户拒绝了，或者连接出问题了等
            // 这里都会抛异常，并且通过err.name可以知道是哪种类型的错误
            console.error(err);
        });
    };

    this.beginRecord = (mediaStream) => {
        let audioContext = new (window.AudioContext || window.webkitAudioContext);
        let mediaNode = audioContext.createMediaStreamSource(mediaStream);
        // 这里connect之后就会自动播放了
        mediaNode.connect(audioContext.destination);
    };
}

module.exports = recrodFun;
