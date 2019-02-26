const {BrowserWindow, ipcMain, globalShortcut} = require('electron');
const os = require('os');
const path = require('path');
const url = require('url');

let captureWins = [];

let winId = -1;

/**
 * 创建一个全屏窗口加载整个桌面
 * @param e
 * @param args
 */
const captureScreen = (screenBase64) => {
    if (captureWins.length) {
        return
    }
    const {screen} = require('electron');

    let displays = screen.getAllDisplays();
    captureWins = displays.map((display) => {
        let captureWin = new BrowserWindow({
            // window 使用 fullscreen,  mac 设置为 undefined, 不可为 false
            fullscreen: os.platform() === 'win32' || undefined,
            width: display.bounds.width,
            height: display.bounds.height,
            x: display.bounds.x,
            y: display.bounds.y,
            transparent: true,
            frame: false,
            // skipTaskbar: true,
            // autoHideMenuBar: true,
            movable: false,
            resizable: false,
            enableLargerThanScreen: true,
            hasShadow: false,
        });
        captureWin.setAlwaysOnTop(true, 'screen-saver');
        captureWin.setVisibleOnAllWorkspaces(true);
        captureWin.setFullScreenable(false);

        captureWin.loadURL(url.format({
            pathname: path.join(__dirname, '../views/capture.html'),
            slashes: true,
            protocol: 'file'
        }));

        setTimeout(function () {
            captureWin.webContents.send('passScreenBase64', {screenBase64})
        }, 800)

        /**
         * 接收到页面加载完成的消息调用
         * 这里会叠加调用，因此使用e.sender.webContents发送消息，不能使用captureWin.webContents发送消息，否则会报错
         * 发现依旧会多次调用使用winId作为阀值控clear制只调用一次  2.26
         */
        /*ipcMain.on('capture-loaded', (e) => {
            if (winId !== e.sender.id) {
                e.sender.webContents.send('passScreenBase64', {screenBase64});
                winId = e.sender.id;
            }
        });*/

        captureWin.setSkipTaskbar(true);

        let {x, y} = screen.getCursorScreenPoint();
        if (x >= display.bounds.x && x <= display.bounds.x + display.bounds.width && y >= display.bounds.y && y <= display.bounds.y + display.bounds.height) {
            captureWin.focus()
        } else {
            captureWin.blur()
        }
        // 调试用
        // captureWin.openDevTools();

        captureWin.on('closed', () => {
            let index = captureWins.indexOf(captureWin);
            if (index !== -1) {
                captureWins.splice(index, 1)
            }
            captureWins.forEach(win => win.close())
        });
        return captureWin
    })
};

const useCapture = () => {
    globalShortcut.register('Esc', () => {
        if (captureWins) {
            captureWins.forEach(win => win.close());
            captureWins = []
        }
    });

    ipcMain.on('capture-screen', (e, {type = 'start', screenId, src, screenBase64} = {}) => {
        if (type === 'start') {
            captureScreen(screenBase64);
        } else if (type === 'complete') {
            //在main.js中处理，方便传给ball.js
        } else if (type === 'select') {
            captureWins.forEach(win => win.webContents.send('capture-screen', {type: 'select', screenId}))
        }
    });
};

exports.useCapture = useCapture;
exports.captureSceen = captureScreen;
