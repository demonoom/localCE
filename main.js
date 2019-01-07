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
    useCapture()

    win = new BrowserWindow({
        width: 412,
        height: 462,
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
        // app.quit();
    });

    win.on('ready-to-show', () => {
        win.show();
        win.focus();
    });

    win.setMenuBarVisibility(false);
}

function loginSuccess() {
    const size = electronScreen.getPrimaryDisplay().size;
    let win_ball = new BrowserWindow({
        width: 100,
        height: 100,
        // frame: false,
        // resizable: false,
        // transparent: true,  //使窗口透明
        x: size.width - 100,
        y: size.height / 2 - 150
    });

    win_ball.webContents.openDevTools();

    win_ball.loadURL(url.format({
        pathname: path.join(__dirname, './views/ball.html'),
        protocol: 'file',
        slashes: true
    }));
}

//登陆成功
ipcMain.on('loginSuccess', () => {
    loginSuccess();
    win.hide();
});

