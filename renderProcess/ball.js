(function () {
    const shot_btn = document.querySelector('#screenShot');
    const push_que = document.querySelector('#pushQue');
    const {ipcRenderer} = require('electron');

    shot_btn.onclick = () => {
        alert(1)
    };
    //截图推题
    push_que.onclick = () => {
        ipcRenderer.send('capture-screen')
    }
})();
