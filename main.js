//项目入口文件
const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const url = require('url');
const {useCapture} = require('./mainProcess/capture-main');
const createTray = require('./mainProcess/tray');
let electronScreen;
const gotTheLock = app.requestSingleInstanceLock();
const {autoUpdater} = require('electron-updater');
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
        setTimeout(function () {
            checkForUpdates();
        }, 5000);
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
        width: 129,
        height: 253,
        frame: false,
        resizable: false,
        transparent: true,  //使窗口透明
        alwaysOnTop: true,
        x: size.width - 129,
        y: size.height / 2 - 100
    });

    // win_ball.webContents.openDevTools();

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
        title: '设置知识点，公布答案',
        resizable: false,
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

    // win_afterPushQue.webContents.openDevTools();

    win_afterPushQue.setSkipTaskbar(true)
}

function open_statistics() {
    // http://192.168.50.29:8091/#/classPractice?userId=23836&vid=35246
    // http://jiaoxue.maaee.com:8091/#/classPractice?userId=23836&vid=35255
    let url = 'http://jiaoxue.maaee.com:8091/#/classPractice?userId=' + global.loginUser.account.slice(2, global.loginUser.account.length) + '&vid=' + global.loginUser.vid;

    let win_statistics = new BrowserWindow({
        width: 400,
        height: 600,
        title: '课堂统计',
        // resizable: false,
        icon: './images/logoo.png',
        webPreferences: {
            nodeIntegration: false  //加载带有jquery的项目时
        }
    });

    win_statistics.loadURL(url);

    win_statistics.setMenuBarVisibility(false);

    win_statistics.webContents.openDevTools();
}

/**
 * 自动更新
 */
function checkForUpdates() {
    try {
        // 配置安装包远端服务器
        autoUpdater.setFeedURL("http://60.205.86.217/upload5/winRelease/");
        // 下面是自动更新的整个生命周期所发生的事件
        autoUpdater.on('error', function (message) {
            console.log("error:" + message);
        });
        autoUpdater.on('checking-for-update', function (message) {
            console.log("checking-for-update:" + message);
        });
        autoUpdater.on('update-available', function (message) {
            console.log("update-available:" + message);
            var msg = {};
            msg.command = 'update-available';
            mainWindow.webContents.send('auto-update', msg);
        });
        autoUpdater.on('update-not-available', function (message) {
            console.log("update-not-available:" + message);
        });
        // 更新下载进度事件
        autoUpdater.on('download-progress', function (progressObj) {
            console.log("download-progress:" + progressObj);
            var msg = {};
            msg.command = 'download-progress';
            msg.progressObj = progressObj;
            mainWindow.webContents.send('auto-update', msg);
        });
        // 更新下载完成事件
        autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) {
            console.log("update-downloaded");
            var msg = {};
            msg.command = 'update-downloaded';
            mainWindow.webContents.send('auto-update', msg);
            autoUpdater.quitAndInstall();
        });
        //执行自动更新检查
        autoUpdater.checkForUpdates();
    } catch (e) {
        console.log(e);
    }
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
        icon: './images/logoo.png'
    });

    win_statistics.loadURL(url);

    win_statistics.setMenuBarVisibility(false);

    // win_statistics.webContents.openDevTools();
});

//公布答案
ipcMain.on('updateClassSubjectAnswer', () => {
    //关闭小窗口
    //打开大窗口
    setTimeout(function () {
        open_statistics()
    }, 1000)
    win_afterPushQue.destroy();
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


