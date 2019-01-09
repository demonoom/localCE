//项目入口文件
const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const url = require('url');
const {useCapture} = require('./mainProcess/capture-main');
const createTray = require('./mainProcess/tray');
let electronScreen;
const gotTheLock = app.requestSingleInstanceLock();
let win = null;

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
        ant_createWin();
        electronScreen = require('electron').screen;
        // setTimeout(function () {
        //     checkForUpdates();
        // }, 5000);
    });

    app.on('window-all-closed', function () {
        if (process.platform !== 'darwin') {
            app.quit()
        }
    });

    app.on('activate', function () {
        if (win === null) {
            ant_createWin();
        }
    });
    app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
}

function ant_createWin() {
    // 初始化截图
    useCapture();

    win = new BrowserWindow({
        width: 350,
        height: 394,
        title: '本地授课助手',
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
        // win = null;
        // app.quit();

        win.hide();
        //隐藏任务栏图标
        win.setSkipTaskbar(true)
        event.preventDefault()
    });

    win.on('ready-to-show', () => {
        win.show();
        win.focus();
    });

    win.setMenuBarVisibility(false);

    createTray(win, app);
}

let win_ball = null;

function showClassBall() {
    const size = electronScreen.getPrimaryDisplay().size;
    win_ball = new BrowserWindow({
        width: 140,
        height: 100,
        frame: false,
        resizable: false,
        transparent: true,  //使窗口透明
        alwaysOnTop: true,
        x: size.width - 200,
        y: size.height / 2 - 200
    });

    // win_ball.webContents.openDevTools();

    win_ball.loadURL(url.format({
        pathname: path.join(__dirname, './views/ball.html'),
        protocol: 'file',
        slashes: true
    }));

    win_ball.setSkipTaskbar(true)
}

function afterPushQue() {
    let win_afterPushQue = new BrowserWindow({
        width: 400,
        height: 600,
        title: '123',
        resizable: false,
        icon: './images/logoo.png'
    });

    win_afterPushQue.loadURL(url.format({
        pathname: path.join(__dirname, './views/afterPushQue.html'),
        protocol: 'file',
        slashes: true
    }));

    win_afterPushQue.setMenuBarVisibility(false);

    // win_afterPushQue.webContents.openDevTools();
}

//開課成功
ipcMain.on('showClassBall', (event) => {
    showClassBall();
    win.close();
});

ipcMain.on('capture-screen', (e, {type = 'start', screenId, src, word, subjectType} = {}) => {
    if (type === 'complete') {
        //选取图片完毕，获得线上地址,发送至渲染进程发送消息服务
        win_ball.webContents.send('pushQue', {src, word, subjectType})
        afterPushQue();
    }
});

//下课
ipcMain.on('class_over', () => {
    win.destroy();
    app.quit();
});

//课堂统计
ipcMain.on('open_statistics', () => {
    let url = 'https://www.maaee.com/ant_service/edu/subject_result_web?uid=' + global.loginUser.account.slice(2, global.loginUser.account.length) + '&vid=' + global.loginUser.vid;

    let win_statistics = new BrowserWindow({
        width: 400,
        height: 600,
        title: '课堂统计',
        resizable: false,
        icon: './images/logoo.png'
    });

    win_statistics.loadURL(url);

    win_statistics.setMenuBarVisibility(false);

    // win_statistics.webContents.openDevTools();
});

//全局变量-存储当前登录账号信息
global.loginUser = {
    account: '',
    password: '',
    classCode: '',
    vid: '',
    sid: '',
};

