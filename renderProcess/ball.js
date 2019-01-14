(function () {
    const shot_btn = document.querySelector('#screenShot');
    const push_que = document.querySelector('#pushQue');
    const statistics = document.querySelector('#statistics');
    const publicScreen = document.querySelector('#publicScreen');
    const clock = document.querySelector('#clock');
    const startClass = document.querySelector('#startClass');
    const AR = document.querySelector("#AR");
    const booth = document.querySelector("#booth");
    const {ipcRenderer} = require('electron');
    const remote = require('electron').remote;
    var timer = null;

    //开课，调用登陆页面
    startClass.onclick = () => {
        ipcRenderer.send('showLogin')
    };

    //截屏
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

    //统计
    statistics.onclick = () => {
        ipcRenderer.send('open_statistics')
    };

    //公屏
    publicScreen.onclick = () => {
        ipcRenderer.send('public_screen')
    };

    //下课
    clock.onclick = () => {
        let obj = {
            "command": "classOver",
        };
        connection.send(obj);
        $('#startClass').show();
        $('#content').hide();
        ipcRenderer.send('class_over');
        clearTimeout(timer);
        overClass()
    };

    AR.onclick = function () {
        ipcRenderer.send('toArPage');
    };

    booth.onclick = function () {
        ipcRenderer.send('toBoothPage');
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
            if (info.command === 'teacherLogin') {
                remote.getGlobal('loginUser').vid = data.vid
            } else if (info.command === "pushImageSubjectTo") {
                console.log(data);
                remote.getGlobal('loginUser').sid = data.sid
            } else if (info.command === 'studentSubjectsCommit' || info.command === 'pushSubjecShowContentUrl') {
                ipcRenderer.send('clazzWsListener', info);
            } else if (info.command === 'classDanmu') {
                //公屏   公屏消息需要两步处理  1.如果窗口被打开，将新消息Push过去加到后方  2.在全局构建本地消息数据存储
                var msg = info.data;
                var arr = remote.getGlobal('loginUser').msgArr;
                arr.push(msg);
                remote.getGlobal('loginUser').msgArr = arr;
                ipcRenderer.send('classDanmu', info.data)
            }
        }
    };

    //截屏推题，发送消息
    ipcRenderer.on('pushQue', (e, msg) => {
        let obj = {
            "command": "pushImageSubjectTo",
            "data": {
                "img": msg.src,
                "subjectType": msg.subjectType,
                // "answer": msg.word,
            }
        };
        connection.send(obj);
    });

    //禁言与否
    ipcRenderer.on('stopDanMu', (e, msg) => {
        if (msg == 0) {
            //解除禁言
            let obj = {
                "command": "screen_lock",
                "data": {
                    "screen_lock": false,
                }
            };
            connection.send(obj);
        } else if (msg == 1) {
            //禁言
            let obj = {
                "command": "screen_lock",
                "data": {
                    "screen_lock": true,
                }
            };
            connection.send(obj);
        }
    });

    ipcRenderer.on('loginSuccess', () => {
        //构建登录课堂的协议信息
        const loginPro = {
            "command": "teacherLogin",
            "data": {
                "password": remote.getGlobal('loginUser').password,
                "account": remote.getGlobal('loginUser').account,
                "classType": 'A', //A
                "classCode": remote.getGlobal('loginUser').classCode, //班级
                "userId": remote.getGlobal('loginUser').account.slice(2, remote.getGlobal('loginUser').account.length)
            }
        };

        //连接登入课堂
        connection.connect(loginPro);
        $('#startClass').hide();
        $('#content').show();

        setTimeout(function () {
            //默认禁言
            let obj = {
                "command": "screen_lock",
                "data": {
                    "screen_lock": true,
                }
            };
            connection.send(obj);
        }, 2000);

        //开启计时器
        timer = setTimeout(() => {
            openClass();
        }, 1000 * 60 * 37);
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

    const openClass = () => {
        $('#overClass').addClass('overClass');
    };

    const overClass = () => {
        $('#overClass').removeClass('overClass');
    }

})();
