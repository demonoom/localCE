const WinReg = require('winreg');

const startOnBoot = {
    enableAutoStart: function (name, file, callback) {
        var key = getKey();
        key.set(name, WinReg.REG_SZ, file, callback || noop);
    },
    disableAutoStart: function (name, callback) {
        var key = getKey();
        key.remove(name, callback || noop);
    },
    getAutoStartValue: function (name, callback) {
        var key = getKey();
        key.get(name, function (error, result) {
            if (result) {
                callback(result.value);
            }
            else {
                callback(null, error);
            }
        });
    }
};

function noop() {
}

const RUN_LOCATION = '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';

function getKey() {
    return new WinReg({
        hive: WinReg.HKCU, //CurrentUser,
        key: RUN_LOCATION
    });
}

function autoStart() {
    startOnBoot.getAutoStartValue('MY_CLIENT_AUTOSTART', function (value) {
        if (!value) {
            // startOnBoot.enableAutoStart('NOOM_AUTOSTART', '"C:\\Program Files (x86)\\localClassAssistant\\小蚂蚁教学助手.exe"', function () {
            startOnBoot.enableAutoStart('NOOM_AUTOSTART', process.execPath, function () {
                console.log('开机自动启设置');
            });
        }
    });
}

module.exports = autoStart;