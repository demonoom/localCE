(function () {
    const shot_btn = document.querySelector('#screenShot');
    const push_que = document.querySelector('#pushQue');
    const {ipcRenderer} = require('electron');
    const remote = require('electron').remote;

    ////截屏
    shot_btn.onclick = () => {
        alert(1)
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
    })
})();
