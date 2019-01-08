(function () {
    const shot_btn = document.querySelector('#screenShot');
    const push_que = document.querySelector('#pushQue');
    const {ipcRenderer} = require('electron');
    const remote = require('electron').remote;

    ////截屏
    shot_btn.onclick = () => {
        // 获取屏幕数量
        const displays = require('electron').screen.getAllDisplays();
        // 每个屏幕都截图一个
        // desktopCapturer.getSources可以一次获取所有桌面的截图
        const getDesktopCapturer = displays.map((display, i) => {
            return new Promise((resolve, reject) => {
                require('electron').desktopCapturer.getSources({
                    types: ['screen'],
                    thumbnailSize: display.size
                }, (error, sources) => {
                    if (!error) {
                        return resolve({
                            display,
                            thumbnail: sources[i].thumbnail.toDataURL()
                        })
                    }
                    return reject(error)
                })
            })
        });

        Promise.all(getDesktopCapturer)
            .then(sources => {
                let imgBlob = getBlobBydataURI(sources[0].thumbnail);
                getOnlineSrc(imgBlob);
            })
            .catch(error => console.log(error))
    };

    //截图推题
    push_que.onclick = () => {
        ipcRenderer.send('capture-screen');
    };

    //连接推题消息
    let connection = new ClazzConnection();
    connection.clazzWsListener = {
        onError: function (errorMsg) {
            //强制退出课堂
            console.log(errorMsg);
        },

        onWarn: function (warnMsg) {
            message.warn(warnMsg);
        },
        // 显示消息
        onMessage: function (info) {
            var data = info.data;
            console.log(info);
        }
    };
    //构建登录课堂的协议信息
    const loginPro = {
        "command": "teacherLogin",
        "data": {
            "password": remote.getGlobal('loginUser').password,
            "account": remote.getGlobal('loginUser').account,
            "classType": 'A', //A
            "classCode": '580', //班级
            "userId": remote.getGlobal('loginUser').account.slice(2, remote.getGlobal('loginUser').account.length)
        }
    };

    //连接登入课堂
    connection.connect(loginPro);

    //截屏推题，发送消息
    ipcRenderer.on('pushQue', (e, msg) => {
        let obj = {
            "command": "pushImageSubject",
            "data": {
                "img": msg.src,
                "subjectType": msg.subjectType,
                "answer": msg.word,
            }
        };
        connection.send(obj);
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
    const getOnlineSrc = (imgBlob) => {
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
                let obj = {
                    "command": "pushHandout",
                    "data": {
                        "url": responseStr,
                    }
                };
                connection.send(obj);
            },
            error: function (responseStr) {
                console.log(responseStr);
            }
        });
    };
})();
