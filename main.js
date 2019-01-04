//项目入口文件
const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');

app.on('ready', () => {
    ant_createWin();
});

let win;

function ant_createWin() {
    win = new BrowserWindow({
        width: 500,
        height: 500,
        title: '本地授课助手',
        // resizable: false,
    });

    win.loadURL(url.format({
        pathname: path.join(__dirname, './views/login.html'),
        slashes: true,
        protocol: 'file'
    }));

    win.webContents.openDevTools();

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