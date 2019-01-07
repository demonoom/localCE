const {
    ipcRenderer, clipboard, nativeImage, remote,
} = require('electron')

const fs = require('fs')
const {getScreenSources} = require('../public/desktop-capturer')
const {CaptureEditor} = require('../public/capture-editor')
const {getCurrentScreen} = require('../public/utils')

const $canvas = document.getElementById('js-canvas')
const $bg = document.getElementById('js-bg')
const $sizeInfo = document.getElementById('js-size-info')
const $toolbar = document.getElementById('js-toolbar')

const $btnClose = document.getElementById('js-tool-close')
const $btnOk = document.getElementById('js-tool-ok')
// const $btnSave = document.getElementById('js-tool-save')
const $btnReset = document.getElementById('js-tool-reset')

const audio = new Audio()
audio.src = '../assets/audio/capture.mp3'

const currentScreen = getCurrentScreen()

// 右键取消截屏
document.body.addEventListener('mousedown', (e) => {
    if (e.button === 2) {
        window.close()
    }
}, true)

// console.time('capture')
getScreenSources({}, (imgSrc) => {

    // console.timeEnd('capture')


    let capture = new CaptureEditor($canvas, $bg, imgSrc)

    let onDrag = (selectRect) => {
        $toolbar.style.display = 'none'
        $sizeInfo.style.display = 'block'
        $sizeInfo.innerText = `${selectRect.w} * ${selectRect.h}`
        if (selectRect.y > 35) {
            $sizeInfo.style.top = `${selectRect.y - 30}px`
        } else {
            $sizeInfo.style.top = `${selectRect.y + 10}px`
        }
        $sizeInfo.style.left = `${selectRect.x}px`
    }
    capture.on('start-dragging', onDrag)
    capture.on('dragging', onDrag)

    let onDragEnd = () => {
        if (capture.selectRect) {
            ipcRenderer.send('capture-screen', {
                type: 'select',
                screenId: currentScreen.id,
            })
            const {
                r, b,
            } = capture.selectRect;
            //b是鼠标距离上边框的距离  r是鼠标距离左边框的距离
            $toolbar.style.display = 'flex';
            if (b >= window.screen.height - 80) {
                $toolbar.style.top = `${200}px`;
            } else {
                $toolbar.style.top = `${b + 15}px`;
            }
            $toolbar.style.right = `${window.screen.width / 2 - 200}px`;
        }
    };
    capture.on('end-dragging', onDragEnd)

    ipcRenderer.on('capture-screen', (e, {type, screenId}) => {
        if (type === 'select') {
            if (screenId && screenId !== currentScreen.id) {
                capture.disable()
            }
        }
    })

    capture.on('reset', () => {
        $toolbar.style.display = 'none'
        $sizeInfo.style.display = 'none'
    })

    $btnClose.addEventListener('click', () => {
        ipcRenderer.send('capture-screen', {
            type: 'close',
        })
        window.close()
    })

    $btnReset.addEventListener('click', () => {
        capture.reset()
    })

    const getBlobBydataURI = (dataURI) => {
        var binary = atob(dataURI.split(',')[1]);
        var array = [];
        for (var i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
    };

    let selectCapture = () => {
        if (!capture.selectRect) {
            return
        }
        let url = capture.getImageUrl();
        let imgBlob = getBlobBydataURI(url);
        remote.getCurrentWindow().hide();

        audio.play();
        audio.onended = () => {
            window.close()
        };

        let formData = new FormData();
        formData.append("filePath", imgBlob, "file_" + Date.parse(new Date()) + ".png");

        $.ajax({
            type: "POST",
            url: "http://60.205.86.217:8890/Excoord_Upload_Server/file/upload",
            enctype: 'multipart/form-data',
            data: formData,
            // 告诉jQuery不要去处理发送的数据
            processData: false,
            // 告诉jQuery不要去设置Content-Type请求头
            contentType: false,
            success: function (responseStr) {
                ipcRenderer.send('capture-screen', {
                    type: 'complete',
                    src: responseStr,
                })
            },
            error: function (responseStr) {
                console.log(responseStr);
            }
        });
        //创建图片写入剪贴板  在Linux报错
        // clipboard.writeImage(nativeImage.createFromDataURL(url));
    };
    $btnOk.addEventListener('click', selectCapture);

    /*$btnSave.addEventListener('click', () => {
        let url = capture.getImageUrl();

        remote.getCurrentWindow().hide();
        remote.dialog.showSaveDialog({
            filters: [{
                name: 'Images',
                extensions: ['png', 'jpg', 'gif'],
            }],
        }, (path) => {
            if (path) {
                // eslint-disable-next-line no-buffer-constructor
                fs.writeFile(path, new Buffer(url.replace('data:image/png;base64,', ''), 'base64'), () => {
                    ipcRenderer.send('capture-screen', {
                        type: 'complete',
                        url,
                        path,
                    })
                    window.close()
                })
            } else {
                ipcRenderer.send('capture-screen', {
                    type: 'cancel',
                    url,
                })
                window.close()
            }
        })
    });*/

    window.addEventListener('keypress', (e) => {
        if (e.code === 'Enter') {
            selectCapture()
        }
    })
})



