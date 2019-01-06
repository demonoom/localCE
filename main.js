//项目入口文件
const {app, BrowserWindow, ipcMain, globalShortcut} = require('electron');
const os = require('os');
const path = require('path');
const url = require('url');
const {useCapture} = require('./public/capture-main');
let electronScreen;

app.on('ready', () => {
    ant_createWin();
    electronScreen = require('electron').screen;

    //注册退出截屏快捷键
    globalShortcut.register('Esc', () => {
        if (captureWin) {
            captureWin.close();
            captureWin = null
        }
    });
});

let win = null;

function ant_createWin() {
    // 初始化截图
    useCapture();

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
        app.quit();
    });

    win.on('ready-to-show', () => {
        win.show();
        win.focus();
    });

    win.setMenuBarVisibility(false);
}

function loginSuccess() {
    const size = electronScreen.getPrimaryDisplay().size;
    let win = new BrowserWindow({
        width: 100,
        height: 100,
        frame: false,
        resizable: false,
        transparent: true,  //使窗口透明
        x: size.width - 100,
        y: size.height / 2 - 150
    });

    // win.webContents.openDevTools();

    win.loadURL(url.format({
        pathname: path.join(__dirname, './views/ball.html'),
        protocol: 'file',
        slashes: true
    }));
}

let captureWin = null;

function captureScreen(e, args) {
    if (captureWin) {
        return
    }
    const {screen} = require('electron');
    let {width, height} = screen.getPrimaryDisplay().bounds;
    captureWin = new BrowserWindow({
        // window 使用 fullscreen,  mac 设置为 undefined, 不可为 false
        fullscreen: os.platform() === 'win32' || undefined, // win
        width,
        height,
        x: 0,
        y: 0,
        transparent: true,
        frame: false,
        skipTaskbar: true,
        autoHideMenuBar: true,
        movable: false,
        resizable: false,
        enableLargerThanScreen: true, // mac
        hasShadow: false,
    });

    captureWin.setAlwaysOnTop(true, 'screen-saver'); // mac
    captureWin.setVisibleOnAllWorkspaces(true); // mac
    captureWin.setFullScreenable(false);// mac

    captureWin.loadFile(path.join(__dirname, './views/capture.html'));

    captureWin.openDevTools();

    captureWin.on('closed', () => {
        captureWin = null
    })
}

//登陆成功
ipcMain.on('loginSuccess', () => {
    loginSuccess();
    win.hide();
});

//截屏推题
ipcMain.on('capture-screen', () => {
    captureScreen()
});
