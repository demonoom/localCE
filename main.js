//项目入口文件
const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const url = require('url');
const {useCapture} = require('./mainProcess/capture-main');
let electronScreen;

app.on('ready', () => {
    ant_createWin();
    electronScreen = require('electron').screen;
});

let win = null;

function ant_createWin() {
    // 初始化截图
    useCapture();

    win = new BrowserWindow({
        width: 350,
        height: 387,
        title: '本地授课助手',
        resizable: false,
    });

    win.loadURL(url.format({
        pathname: path.join(__dirname, './views/login.html'),
        slashes: true,
        protocol: 'file'
    }));

    // win.webContents.openDevTools();

    win.on('close', () => {
        win = null;
        app.quit();
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
        width: 100,
        height: 100,
        frame: false,
        resizable: false,
        transparent: true,  //使窗口透明
        alwaysOnTop: true,
        x: size.width - 100,
        y: size.height / 2 - 150
    });

    // win_ball.webContents.openDevTools();

    win_ball.loadURL(url.format({
        pathname: path.join(__dirname, './views/ball.html'),
        protocol: 'file',
        slashes: true
    }));
}

//開課成功
ipcMain.on('showClassBall', () => {
    showClassBall();
    win.hide()
});

ipcMain.on('capture-screen', (e, {type = 'start', screenId, src, word, subjectType} = {}) => {
    if (type === 'complete') {
        //选取图片完毕，获得线上地址,发送至渲染进程发送消息服务
        win_ball.webContents.send('pushQue', {src, word, subjectType})
    }
});

//全局变量-存储当前登录账号信息
global.loginUser = {
    account: '',
    password: '',
    classCode: '',
};

