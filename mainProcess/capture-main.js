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
const captureScreen = () => {
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

    ipcMain.on('capture-screen', (e, {type = 'start', screenId, src} = {}) => {
        if (type === 'start') {
            captureScreen();
        } else if (type === 'complete') {
            //在main.js中处理，方便传给ball.js
        } else if (type === 'select') {
            captureWins.forEach(win => win.webContents.send('capture-screen', {type: 'select', screenId}))
        }
    });
};

exports.useCapture = useCapture;
exports.captureSceen = captureScreen;
