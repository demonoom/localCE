const {Tray, Menu, dialog} = require('electron');
var path = require('path');

function createTray(win,app) {
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

    tray.setToolTip('本地开课助手');

    tray.setContextMenu(menu)
}

module.exports = createTray