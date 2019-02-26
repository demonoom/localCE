const {
    ipcRenderer, clipboard, nativeImage, remote,
} = require('electron');

const fs = require('fs');
const {getScreenSources} = require('../public/desktop-capturer');
const {CaptureEditor} = require('../public/capture-editor');
const {getCurrentScreen} = require('../public/utils');

const $canvas = document.getElementById('js-canvas');
const $bg = document.getElementById('js-bg');
const $sizeInfo = document.getElementById('js-size-info');
const $toolbar = document.getElementById('js-toolbar');

const $btnClose = document.getElementById('js-tool-close');
const $btnOk = document.getElementById('js-tool-ok');
// const $btnSave = document.getElementById('js-tool-save')
const $btnReset = document.getElementById('js-tool-reset');

const audio = new Audio();
audio.src = '../assets/audio/capture.mp3';

const currentScreen = getCurrentScreen();

//页面一加载就发送消息通知主进程
ipcRenderer.send('capture-loaded');

//题目类型
let subjectType = 'C';

// 右键取消截屏
document.body.addEventListener('mousedown', (e) => {
    if (e.button === 2) {
        window.close()
    }
}, true);

//初始化选题按钮
const initQue = () => {
    subjectType = 'C';
    $('#judge_answer').hide();
    // $('#choose_answer').show();
    $('#judge_que').removeClass('active');
    $('#choose_que').addClass('active');
    $('#judge_yes').removeClass('active').attr('data-judge', 'false');
    $('#judge_no').removeClass('active').attr('data-judge', 'false');
    $('.choose_selection').each((i, e) => {
        $(e).attr('data-choosen', "false");
        $(e).removeClass('active')
    });
};

//选择题
$('#choose_que').click(function () {
    subjectType = 'C';
    $('#judge_answer').hide();
    // $('#choose_answer').show();
    $('#judge_que').removeClass('active');
    $('#choose_que').addClass('active');
});

//选择题答案
$('.choose_selection').each((i, e) => {
    $(e).click(function () {
        if ($(this).attr('data-choosen') === 'false') {
            $(this).attr('data-choosen', "true");
            $(this).addClass('active')
        } else {
            $(this).attr('data-choosen', "false");
            $(this).removeClass('active')
        }
    })
});

//判断题
$('#judge_que').click(function () {
    subjectType = 'J';
    // $('#judge_answer').show();
    $('#choose_answer').hide();
    $('#judge_que').addClass('active');
    $('#choose_que').removeClass('active');
});

//判断题对
$('#judge_yes').click(function () {
    $(this).addClass('active').attr('data-judge', "true");
    $('#judge_no').removeClass('active').attr('data-judge', "false");
});

//判断题错
$('#judge_no').click(function () {
    $(this).addClass('active').attr('data-judge', "true");
    $('#judge_yes').removeClass('active').attr('data-judge', "false");
});

/**
 * 接收到capture-main.js传递的base64截图之后调用
 */
ipcRenderer.on('passScreenBase64', (e, msg) => {

    getScreenSources({}, (imgSrc) => {
        /*解决不能透明的问题，改成先截取屏幕通过进程传递过来，取消了原来的在desktop-capturer中回调imgSrc的方法 2.26*/
        // let capture = new CaptureEditor($canvas, $bg, imgSrc);
        let capture = new CaptureEditor($canvas, $bg, msg.screenBase64);

        let onDrag = (selectRect) => {
            $toolbar.style.display = 'none';
            $sizeInfo.style.display = 'block';
            $sizeInfo.innerText = `${selectRect.w} * ${selectRect.h}`;
            if (selectRect.y > 35) {
                $sizeInfo.style.top = `${selectRect.y - 30}px`
            } else {
                $sizeInfo.style.top = `${selectRect.y + 10}px`
            }
            $sizeInfo.style.left = `${selectRect.x}px`
        };
        capture.on('start-dragging', onDrag);
        capture.on('dragging', onDrag);

        let onDragEnd = () => {
            if (capture.selectRect) {
                initQue();
                ipcRenderer.send('capture-screen', {
                    type: 'select',
                    screenId: currentScreen.id,
                });
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
        capture.on('end-dragging', onDragEnd);

        ipcRenderer.on('capture-screen', (e, {type, screenId}) => {
            if (type === 'select') {
                if (screenId && screenId !== currentScreen.id) {
                    capture.disable()
                }
            }
        });

        capture.on('reset', () => {
            $toolbar.style.display = 'none';
            $sizeInfo.style.display = 'none'
        });

        $btnClose.addEventListener('click', () => {
            ipcRenderer.send('capture-screen', {
                type: 'close',
            });
            window.close()
        });

        $btnReset.addEventListener('click', () => {
            capture.reset()
        });

        /**
         * base64转成blob对象
         * @param dataURI
         * @returns {Blob}
         */
        const getBlobBydataURI = (dataURI) => {
            var binary = atob(dataURI.split(',')[1]);
            var array = [];
            for (var i = 0; i < binary.length; i++) {
                array.push(binary.charCodeAt(i));
            }
            return new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
        };

        /**
         * 获取线上地址
         * @param imgBlob
         */
        const getOnlineSrc = (imgBlob, word, subjectType) => {
            var cut = new Promise(function (resolve, reject) {
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
                            word,
                            subjectType
                        });
                        resolve('1');
                    },
                    error: function (responseStr) {
                        console.log(responseStr);
                        resolve('0');
                    }
                });
            });
            cut.then((res) => {
                if (res === '0') {
                    ipcRenderer.send('netword_error');
                }
            })
        };

        let selectCapture = () => {
            let url = capture.getImageUrl();
            let imgBlob = getBlobBydataURI(url);
            if (subjectType === 'C') {
                //选择题
                let arr = [];
                let ansStr = '';
                $('.choose_selection').each(function (i, e) {
                    arr.push($(this).attr('data-choosen'))
                });
                if (arr.indexOf('true') === -1) {
                    // layer.msg('请选择选项');
                    // return
                    getOnlineSrc(imgBlob, '', 'C');
                } else {
                    arr.forEach(function (v, i) {
                        if (v === 'true') {
                            if (i == 0) {
                                ansStr += 'A';
                            } else if (i == 1) {
                                ansStr += 'B';
                            } else if (i == 2) {
                                ansStr += 'C';
                            } else if (i == 3) {
                                ansStr += 'D';
                            }
                        }
                    });
                    if (ansStr.length === 1) {
                        //单选
                        getOnlineSrc(imgBlob, ansStr, 'C');
                    } else {
                        //多选
                        getOnlineSrc(imgBlob, ansStr, 'MC');
                    }
                }
            } else {
                //判断题
                if ($('#judge_yes').attr('data-judge') === 'false' && $('#judge_no').attr('data-judge') === 'false') {
                    // layer.msg('请选择选项');
                    // return
                    getOnlineSrc(imgBlob, '', 'J');
                } else if ($('#judge_yes').attr('data-judge') === 'true' && $('#judge_no').attr('data-judge') === 'false') {
                    getOnlineSrc(imgBlob, '正确', 'J');
                } else {
                    getOnlineSrc(imgBlob, '错误', 'J');
                }
            }

            if (!capture.selectRect) {
                return
            }
            remote.getCurrentWindow().hide();

            audio.play();
            audio.onended = () => {
                window.close()
            };
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
    });
});




