const {Tray, Menu, dialog, ipcMain} = require('electron');
//const {autoUpdater} = require('electron-updater');
var path = require('path');

function createTray(win, app) {
    // 创建系统托盘图标对象
    let tray = new Tray(path.join(__dirname, '../images/logo(1).png'));

    //创建系统托盘的上下文菜单--右键菜单
    const menu = Menu.buildFromTemplate([
        {
            label: '关闭',
            click: () => {
                dialog.showMessageBox({
                    type: 'info',
                    title: '退出提示',
                    message: '请问是否真的需要推出',
                    buttons: ['确定', '取消']
                }, (index) => {
                    if (index == 0) {
                        //销毁图标
                        tray.destroy();
                        //销毁窗体
                        win.destroy()
                        app.quit()
                    }
                })
            }
        }
    ]);

    //为系统托盘图标添加事件
    tray.on('click', () => {

    });

    tray.setToolTip('小蚂蚁教学助手');

    tray.setContextMenu(menu);

    setTimeout(function () {
        checkForUpdates(tray);
    }, 5000);

    /**
     * 登录成功之后也检查更新
     */
    ipcMain.on('loginSuccess', () => {
        checkForUpdates(tray);
    });


    /**
     * 自动更新
     */
    function checkForUpdates(tray) {
        try {
            // 配置安装包远端服务器
            //autoUpdater.setFeedURL("http://172.16.2.35:5000/files/");
            autoUpdater.setFeedURL("http://60.205.86.217/upload5/localTeachingRelease/");
            // 下面是自动更新的整个生命周期所发生的事件
            autoUpdater.on('error', function (message) {
                console.log('error' + message)
            });
            autoUpdater.on('checking-for-update', function (message) {
                console.log('checking-for-update' + message)
            });
            autoUpdater.on('update-available', function (message) {
                console.log('update-available' + message)
                tray.displayBalloon({
                    title: '小蚂蚁开课助手',
                    content: '发现可用更新，即将为您自动更新'
                })
            });
            autoUpdater.on('update-not-available', function (message) {
                console.log('update-not-available' + message)
            });
            // 更新下载进度事件
            autoUpdater.on('download-progress', function (progressObj) {
                console.log('download-progress' + progressObj);
            });
            // 更新下载完成事件
            autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) {
                tray.displayBalloon({
                    title: '小蚂蚁开课助手',
                    content: '更新下载完成，即将为您安装'
                })
                setTimeout(function () {
                    autoUpdater.quitAndInstall();
                }, 2000)
            });
            //执行自动更新检查
            autoUpdater.checkForUpdates();
        } catch (e) {
            console.log(e);
        }
    }
}

module.exports = createTray;
