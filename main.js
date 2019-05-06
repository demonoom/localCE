//项目入口文件
const electron = require('electron');
const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const path = require('path');
const url = require('url');
const {useCapture} = require('./mainProcess/capture-main');
const createTray = require('./mainProcess/tray');
const autoStart = require('./public/self-startimg')
let electronScreen;
const gotTheLock = app.requestSingleInstanceLock();
let win = null;

let hello_win = null;

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (win) {
            if (win.isMinimized()) win.restore();
            win.focus();
        }
    });
    app.on('ready', function () {
        electronScreen = require('electron').screen;
        // showClassBall()
        autoStart()  //自启动
        create_helloWin();
        setTimeout(() => {
            hello_win.hide();
            showClassBall()
        }, 2000)
    });

    app.on('window-all-closed', function () {
        if (process.platform !== 'darwin') {
            app.quit()
        }
    });

    app.on('activate', function () {
        if (win === null) {
            showClassBall()
        }
    });
    app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
}

function create_helloWin() {
    const size = electronScreen.getPrimaryDisplay().size;
    hello_win = new BrowserWindow({
        width: size.width,
        height: size.height,
        x: 0,
        y: 0,
        transparent: true,
        frame: false,
        movable: false,
        resizable: false,
        enableLargerThanScreen: true,
        hasShadow: false,
        webPreferences: {
            webSecurity: false
        }
    });
    hello_win.setAlwaysOnTop(true, 'screen-saver');
    // hello_win.setVisibleOnAllWorkspaces(true);
    hello_win.setFullScreenable(false);

    hello_win.loadURL(url.format({
        pathname: path.join(__dirname, './views/hello.html'),
        slashes: true,
        protocol: 'file'
    }));

    hello_win.setSkipTaskbar(true);

    // hello_win.webContents.openDevTools();
}

function ant_createWin() {
    // 初始化截图
    useCapture();

    win = new BrowserWindow({
        width: 350,
        height: 394,
        title: '小蚂蚁教学助手',
        resizable: false,
        icon: './images/logoo.png'
    });

    win.loadURL(url.format({
        pathname: path.join(__dirname, './views/login.html'),
        slashes: true,
        protocol: 'file'
    }));

    // win.webContents.openDevTools();

    win.on('close', (event) => {
        if (win) {
            win.hide();
            win = null;
        }
    });

    win.on('ready-to-show', () => {
        win.show();
        win.focus();
    });

    win.setMenuBarVisibility(false);
}

let win_ball = null;

function showClassBall() {
    const size = electronScreen.getPrimaryDisplay().size;
    win_ball = new BrowserWindow({
        width: 108,
        height: 436,
        frame: false,
        resizable: false,
        transparent: true,  //使窗口透明
        alwaysOnTop: true,
        x: size.width - 108,
        y: size.height / 2 - 260
    });

    // win_ball.webContents.openDevTools();

    win_ball.loadURL(url.format({
        pathname: path.join(__dirname, './views/ball_new.html'),
        protocol: 'file',
        slashes: true
    }));

    win_ball.setSkipTaskbar(true);

    win_ball.setMaximizable(false)

    createTray(win_ball, app);
};

let win_afterPushQue = null;

/**
 * 推题之后选择知识点
 */
function afterPushQue() {
    console.log('afterPushQue');
    const size = electronScreen.getPrimaryDisplay().size;
    win_afterPushQue = new BrowserWindow({
        width: size.width,
        height: size.height,
        title: '小蚂蚁教学助手',
        transparent: true,  //使窗口透明
        alwaysOnTop: true,
        icon: './images/logoo.png',
        // minimizable: false,
        maximizable: false,
        // closable: false,
    });

    win_afterPushQue.loadURL(url.format({
        pathname: path.join(__dirname, './views/afterPushQue.html'),
        protocol: 'file',
        slashes: true
    }));

    win_afterPushQue.setMenuBarVisibility(false);
    // win_afterPushQue.webContents.openDevTools();
    // win_afterPushQue.setSkipTaskbar(true);

    win_afterPushQue.on('close', (event) => {
        if (win_afterPushQue) {
            win_afterPushQue = null;
        }
    });
}

let win_publicScreen = null;

function openPubWin() {
    if(!!win_publicScreen) {
        win_publicScreen.focus()
    } else {
        const size = electronScreen.getPrimaryDisplay().size;
        win_publicScreen = new BrowserWindow({
            // minWidth: 750,
            // minHeight: 700,
            width: size.width,
            height: size.height,
            icon: './images/logoo.png',
            title: '小蚂蚁教学助手'
        });

        win_publicScreen.loadURL(url.format({
            pathname: path.join(__dirname, './views/classDanmu.html'),
            protocol: 'file',
            slashes: true
        }));

        win_publicScreen.setMenuBarVisibility(false);

        // win_publicScreen.webContents.openDevTools();

        win_publicScreen.on('close', (event) => {
            if (win_publicScreen) {
                win_publicScreen = null;
            }
        });
    }

    win_publicScreen.on('closed', () => {
        win_publicScreen = null;
    })
}

let win_statistics = null

function open_statistics() {
    if(!!win_statistics) {
        win_statistics.reload()
        win_statistics.focus()
    } else {
        // http://192.168.50.29:8091/#/classPractice?userId=23836&vid=35246
        let url_tongji = 'http://jiaoxue.maaee.com:8091/#/classPractice?userId=' + global.loginUser.colUid + '&vid=' + global.loginUser.vid;
        const size = electronScreen.getPrimaryDisplay().size;
        win_statistics = new BrowserWindow({
            // width: 400,
            // height: 600,
            width: size.width,
            height: size.height,
            title: '小蚂蚁教学助手',
            resizable: false,
            icon: './images/logoo.png',
            webPreferences: {
                // nodeIntegration: false  //加载带有jquery的项目时
            }
        });

        win_statistics.loadURL(url.format({
            pathname: path.join(__dirname, './views/publicWebView.html'),
            protocol: 'file',
            slashes: true
        }));

        win_statistics.webContents.on('did-finish-load', () => {
            win_statistics.webContents.send('webviewSrc', {
                type: 'tongji',
                src: url_tongji
            });
        });

        win_statistics.setMenuBarVisibility(false);

        // win_statistics.webContents.openDevTools();
    }

    win_statistics.on('closed', () => {
        win_statistics = null;
    })

}

//展示登陆页面
ipcMain.on('showLogin', (event) => {
    if (!win) {
        ant_createWin()
    }
});

//开课成功,销毁login窗口
ipcMain.on('loginSuccess', () => {
    if (win) {
        win.hide();
        win = null;
    }
    win_ball.webContents.send('loginSuccess')
});

ipcMain.on('capture-screen', (e, {type = 'start', screenId, src, word, subjectType} = {}) => {
    if (type === 'complete') {
        //选取图片完毕，获得线上地址,发送至渲染进程发送消息服务
        win_ball.webContents.send('pushQue', {src, word, subjectType});
        global.loginUser.subjectType = subjectType;
        afterPushQue();
    }
});

ipcMain.on('netword_error', () => {
    dialog.showErrorBox('推题失败', '请检查网络情况后重新推题');
});

//下课
ipcMain.on('class_over', () => {
    console.log('class_over');
    if (!!win_afterPushQue) {
        win_afterPushQue.close()
    }
    if (!!win_publicScreen) {
        //公屏
        win_publicScreen.close()
    }
    if (!!win_statistics) {
        //统计-
        win_statistics.close()
    }
    if (!!win_antPlate) {
        //蚁盘-
        win_antPlate.close()
    }
    if (!!ar_window) {
        //ar-
        ar_window.close()
    }
    if (!!bp_window) {
        //展台-
        bp_window.close()
    }
    if (!!choose_stu_window) {
        //选人-
        choose_stu_window.close()
    }
    global.loginUser.msgArr = [];
    global.loginUser.honeySwitch = 'switch-off'
});

//课堂统计
ipcMain.on('open_statistics', () => {
    if(!!win_statistics) {
        win_statistics.reload()
        win_statistics.focus()
    } else {
        let url_tongji = 'http://jiaoxue.maaee.com:8091/#/classPractice?userId=' + global.loginUser.colUid + '&vid=' + global.loginUser.vid;
        const size = electronScreen.getPrimaryDisplay().size;
        win_statistics = new BrowserWindow({
            // width: 400,
            // height: 600,
            width: size.width,
            height: size.height,
            title: '小蚂蚁教学助手',
            resizable: false,
            icon: './images/logoo.png',
            webPreferences: {
                // nodeIntegration: false  //加载带有jquery的项目时
            }
        });

        win_statistics.loadURL(url.format({
            pathname: path.join(__dirname, './views/publicWebView.html'),
            protocol: 'file',
            slashes: true
        }));

        win_statistics.webContents.on('did-finish-load', () => {
            win_statistics.webContents.send('webviewSrc', {
                type: 'tongji',
                src: url_tongji
            });
        });

        win_statistics.setMenuBarVisibility(false);
    }

    win_statistics.on('closed', () => {
        win_statistics = null;
    })

});

//蚁盘
let win_antPlate = null
ipcMain.on('open_antPlate', () => {
    if(!!win_antPlate) {
        win_antPlate.focus()
    } else {
        let url_antPlate = 'http://jiaoxue.maaee.com:8091/#/antPlate?ident=' + global.loginUser.colUid + '&fileId=-1&title=蚁盘&phoneType=3';
        const size = electronScreen.getPrimaryDisplay().size;
        win_antPlate = new BrowserWindow({
            width: size.width,
            height: size.height,
            title: '小蚂蚁教学助手',
            resizable: false,
            icon: './images/logoo.png',
        });

        win_antPlate.loadURL(url.format({
            pathname: path.join(__dirname, './views/publicWebView.html'),
            protocol: 'file',
            slashes: true
        }));

        win_antPlate.webContents.on('did-finish-load', () => {
            win_antPlate.webContents.send('webviewSrc', {
                type: 'antPlate',
                src: url_antPlate
            });
        });

        // win_antPlate.webContents.openDevTools();

        win_antPlate.setMenuBarVisibility(false);
    }

    win_antPlate.on('closed', () => {
        win_antPlate = null;
    })
});

ipcMain.on('public_screen', () => {
    openPubWin();
});

//公布答案
ipcMain.on('updateClassSubjectAnswer', () => {
    //关闭小窗口
    //打开大窗口
    setTimeout(function () {
        open_statistics()
    }, 1000);
    win_afterPushQue.destroy();
    win_afterPushQue = null;
});

//消息转发到afterPushQue
ipcMain.on('clazzWsListener', (e, info) => {
    if (win_afterPushQue) {
        win_afterPushQue.webContents.send('clazzWsListener', info);
    }
});

//跳转ar页面
let ar_window = null
ipcMain.on('toArPage', (e) => {
    if (!!ar_window) {
        ar_window.focus()
    } else {
        const {width, height} = electron.screen.getPrimaryDisplay().workArea;
        ar_window = new BrowserWindow({
            width: width,
            height: height,
            webPreferences: {webSecurity: false},
            title: '小蚂蚁教学助手',
            icon: './images/logoo.png'
        });
        ar_window.setMenu(null);
        // ar_window.openDevTools();

        ar_window.loadURL(url.format({
            pathname: path.join(__dirname, './views/publicWebView.html'),
            protocol: 'file',
            slashes: true
        }));

        var url_webview = "https://www.maaee.com:6443/arBook/arsycplay_old.html?vid=" + global.loginUser.colUid;
        // https://www.maaee.com:6443/arBook/arsycPlay.html

        ar_window.webContents.on('did-finish-load', () => {
            ar_window.webContents.send('webviewSrc', {
                type: 'ar',
                src: url_webview
            })
            ;
        });
    }

    ar_window.on('closed', () => {
        ar_window = null;
    })
});

//跳转展台页面
let bp_window
ipcMain.on('toBoothPage', (e) => {
    if(!!bp_window) {
        bp_window.focus()
    } else {
        const {width, height} = electron.screen.getPrimaryDisplay().workArea;
        bp_window = new BrowserWindow({
            width: width,
            height: height,
            webPreferences: {webSecurity: false},
            title: '小蚂蚁教学助手',
            icon: './images/logoo.png'
        });
        bp_window.setMenu(null);
        // bp_window.openDevTools();
        var url_webview = "https://www.maaee.com:6443/classOther/zhantai/openZhantaiQr.html?vid=" + global.loginUser.colUid;

        bp_window.loadURL(url.format({
            pathname: path.join(__dirname, './views/publicWebView.html'),
            protocol: 'file',
            slashes: true
        }));

        bp_window.webContents.on('did-finish-load', () => {
            bp_window.webContents.send('webviewSrc', {
                type: 'zhantai',
                src: url_webview
            });
        });
    }

    bp_window.on('closed', () => {
        bp_window = null;
    })
});

//跳转到选人
let choose_stu_window
ipcMain.on('choose_stu', () => {
    if(!!choose_stu_window) {
        choose_stu_window.focus()
    } else {
        const {width, height} = electron.screen.getPrimaryDisplay().workArea;
        choose_stu_window = new BrowserWindow({
            width,
            height,
            transparent: true,  //使窗口透明
            webPreferences: {
                webSecurity: false,
            },
            title: '小蚂蚁教学助手',
            icon: './images/logoo.png',
        });
        choose_stu_window.setMenu(null);
        // choose_stu_window.openDevTools();
        var url_choose = "https://www.maaee.com:6443/luckDraw/?classId=" + global.loginUser.classCode;
        // var url_choose = "http://192.168.50.30:6443/luckDraw/?classId=" + global.loginUser.classCode;

        choose_stu_window.loadURL(url.format({
            pathname: path.join(__dirname, './views/publicWebView.html'),
            protocol: 'file',
            slashes: true
        }));

        choose_stu_window.webContents.on('did-finish-load', () => {
            choose_stu_window.webContents.send('webviewSrc', {
                type: 'xuanren',
                src: url_choose
            });
        });
    }

    choose_stu_window.on('closed', () => {
        choose_stu_window = null;
    })
});

/**
 * 消息转发到公屏
 */
ipcMain.on('classDanmu', (e, info) => {
    if (win_publicScreen) {
        win_publicScreen.webContents.send('classDanmu', info);
    }
});

//禁言与否
ipcMain.on('stopDanMu', (e, msg) => {
    win_ball.webContents.send('stopDanMu', msg);
});

//全局变量-存储当前登录账号信息
global.loginUser = {
    account: '',
    colUid: '',
    password: '',
    classCode: '',
    vid: '',
    sid: '',
    subjectType: '',
    msgArr: [],
    honeySwitch: 'switch-off'
};


