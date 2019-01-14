//项目入口文件
const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const url = require('url');
const {useCapture} = require('./mainProcess/capture-main');
const createTray = require('./mainProcess/tray');
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
        create_helloWin()
        setTimeout(() => {
            hello_win.hide()
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
    hello_win.setVisibleOnAllWorkspaces(true);
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
        //resizable: false,
        icon: './images/logoo.png'
    });

    win.loadURL(url.format({
        pathname: path.join(__dirname, './views/login.html'),
        slashes: true,
        protocol: 'file'
    }));

    win.webContents.openDevTools();

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
        width: 118,
        height: 231,
        // frame: false,
        // resizable: false,
        // transparent: true,  //使窗口透明
        alwaysOnTop: true,
        x: size.width - 118,
        y: size.height / 2 - 100
    });

    win_ball.webContents.openDevTools();

    win_ball.loadURL(url.format({
        pathname: path.join(__dirname, './views/ball_new.html'),
        protocol: 'file',
        slashes: true
    }));

    win_ball.setSkipTaskbar(true)

    createTray(win_ball, app);
};

let win_afterPushQue = null;

/**
 * 推题之后选择知识点
 */
function afterPushQue() {
    console.log('afterPushQue');
    win_afterPushQue = new BrowserWindow({
        width: 354,
        height: 356,
        title: '本地授课助手',
       // resizable: false,
        icon: './images/logoo.png',
        minimizable: false,
        maximizable: false,
        closable: false,
    });

    win_afterPushQue.loadURL(url.format({
        pathname: path.join(__dirname, './views/afterPushQue.html'),
        protocol: 'file',
        slashes: true
    }));

    win_afterPushQue.setMenuBarVisibility(false);

    win_afterPushQue.webContents.openDevTools();

    win_afterPushQue.setSkipTaskbar(true)
}

let win_publicScreen = null;

function openPubWin() {
    win_publicScreen = new BrowserWindow({
        width: 800,
        height: 600,
        icon: './images/logoo.png',
        title: ''
    });

    /*win_publicScreen.loadURL(url.format({
        pathname: path.join(__dirname, './views/afterPushQue.html'),
        protocol: 'file',
        slashes: true
    }));*/

    win_publicScreen.setMenuBarVisibility(false);

    // win_publicScreen.webContents.openDevTools();
}

function open_statistics() {
    // http://192.168.50.29:8091/#/classPractice?userId=23836&vid=35246
    // http://jiaoxue.maaee.com:8091/#/classPractice?userId=23836&vid=35255
    let url = 'http://jiaoxue.maaee.com:8091/#/classPractice?userId=' + global.loginUser.account.slice(2, global.loginUser.account.length) + '&vid=' + global.loginUser.vid;

    let win_statistics = new BrowserWindow({
        width: 400,
        height: 600,
        title: '课堂统计',
        resizable: false,
        icon: './images/logoo.png',
        webPreferences: {
            nodeIntegration: false  //加载带有jquery的项目时
        }
    });

    win_statistics.loadURL(url);

    win_statistics.setMenuBarVisibility(false);

    // win_statistics.webContents.openDevTools();
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

//下课
ipcMain.on('class_over', () => {
    console.log('class_over')
});

//课堂统计
ipcMain.on('open_statistics', () => {
    let url = 'http://jiaoxue.maaee.com:8091/#/classPractice?userId=' + global.loginUser.account.slice(2, global.loginUser.account.length) + '&vid=' + global.loginUser.vid;

    let win_statistics = new BrowserWindow({
        width: 400,
        height: 600,
        title: '课堂统计',
        resizable: false,
        icon: './images/logoo.png',
        webPreferences: {
            nodeIntegration: false  //加载带有jquery的项目时
        }
    });

    win_statistics.loadURL(url);

    win_statistics.setMenuBarVisibility(false);

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
});

//消息转发到afterPushQue
ipcMain.on('clazzWsListener', (e, info) => {
    if (win_afterPushQue) {
        win_afterPushQue.webContents.send('clazzWsListener', info);
    }
});

//全局变量-存储当前登录账号信息
global.loginUser = {
    account: '',
    password: '',
    classCode: '',
    vid: '',
    sid: '',
    subjectType: ''
};


