$(function () {
    const {ipcRenderer} = require('electron');
    const remote = require('electron').remote;
    const requestLittleAntApi = require('../public/webServiceUtil');

    var machineId = '';
    var simple = new SimpleWebsocketConnection();
    simple.connect();
    machineId = createMachineId();
    getLoginTeachSystemEwm();

    //存储登录过的账号密码
    var accountArr = [];
    accountArr = JSON.parse(localStorage.getItem("accountData")) == null ? accountArr : JSON.parse(localStorage.getItem("accountData"));

    /**
     * 创建uuid
     * @returns {string}
     */
    function createMachineId() {
        var s = [];
        var hexDigits = "0123456789abcdef";
        for (var i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
        s[8] = s[13] = s[18] = s[23] = "-";

        var uuid = s.join("");
        return uuid;
    };

    /**
     * 获取二维码
     */
    function getLoginTeachSystemEwm() {
        let param = {
            "method": "getLoginTeachSystemEwm",
            "uuid": machineId,
        };
        requestLittleAntApi(JSON.stringify(param), {
            onResponse: function (result) {
                if (result.success) {
                    $('#scan_image').attr('src', result.response)
                }
            },
            onError: function (error) {
                // message.error(error);
            }
        });
    }

    //账号登录
    $('#account').on('click', function () {
        $('.account').show();
        $('#account').addClass('active');
        $('#scan').removeClass('active');
        $('.scan').hide();
    });

    //扫码登录
    $('#scan').on('click', function () {
        $('.scan').show();
        $('#scan').addClass('active');
        $('#account').removeClass('active');
        $('.account').hide();
    });

    //登录事件
    $('#login').on('click', function () {
        if ($('#act').val().trim() == '') {
            alert('请输入账号');
            return;
        } else if ($('#pwd').val().trim() == '') {
            alert('请输入密码');
            return;
        }
        let param = {
            "method": 'login',
            "username": $('#act').val().trim(),
            "password": $('#pwd').val().trim()
        };
        requestLittleAntApi(JSON.stringify(param), {
            onResponse: function (result) {
                if (result.success) {
                    if ($("#act").val() !== "" && $("#pwd").val() !== "") {
                        accountArr.push({
                            account: $("#act").val(),
                            password: $("#pwd").val()
                        });
                        remote.getGlobal('loginUser').account = $("#act").val();
                        remote.getGlobal('loginUser').password = $("#pwd").val();
                        remote.getGlobal('loginUser').colUid = result.response.colUid;
                    }
                    accountArr = makeArr(accountArr, "account");
                    localStorage.setItem('accountData', JSON.stringify(accountArr));
                    getTeacherClasses();
                } else {
                    layer.msg(result.msg);
                }
            },
            onError: function (error) {
                // message.error(error);
            }
        });
    });

    /**
     * 后退
     */
    $('#goback').on('click',function () {
        $('#logo_content').show();
        $('#classList').hide();
        $('#account').click();
        $('#act').val('');
        $('#pwd').val('');
    });

    /**
     * 去重
     * @param arr
     * @returns {*}
     */
    function makeArr(arr, properties) {
        for (var i = 0; i < arr.length - 1; i++) {
            for (var j = i + 1; j < arr.length; j++) {
                if (arr[i][properties] == arr[j][properties]) {
                    arr.splice(j, 1);
                    j--;
                }
            }
        }
        return arr
    };

    /**
     * 记录账号被点击
     * @param account
     * @returns {*}
     */
    getInputValue = function (account, password) {
        $("#act").val(account);
        $("#pwd").val(password);
    };

    accountArr = makeArr(accountArr, "account");

    accountArr.forEach(function (v, i) {
        $("#actData").append(`<div onClick='getInputValue("${v.account}","${v.password}")'>${v.account}</div>`)
    });

    $("#act").blur(function () {
        setTimeout(function () {
            $("#actData").css("display", "none");
        }, 300)
    });

    $("#act").focus(function () {
        accountArr = JSON.parse(localStorage.getItem("accountData")) == null ? accountArr : JSON.parse(localStorage.getItem("accountData"));
        $("#actData").css("display", "block");
    });

    /**
     * socket 监听
     * @type {{onError: SimpleWebsocketConnection.msgWsListener.onError, onWarn: SimpleWebsocketConnection.msgWsListener.onWarn, onMessage: SimpleWebsocketConnection.msgWsListener.onMessage}}
     */
    simple.msgWsListener = {
        onError: function (errorMsg) {

        }, onWarn: function (warnMsg) {

        }, onMessage: function (info) {
            console.log(info);
            var command = info.command;
            if (command == "allowLoginTeachSystem") {
                var data = info.data;
                var uuid = data.uuid;
                //                   var user = data.user;
                if (uuid == machineId) {
                    remote.getGlobal('loginUser').account = data.user.colAccount;
                    remote.getGlobal('loginUser').password = data.user.colPasswd;
                    remote.getGlobal('loginUser').colUid = data.user.colUid;
                    getTeacherClasses();
                } else {

                }
            }
        }
    };

    /**
     * 开课
     */
    $('#openClassBtn').click(function () {
        ipcRenderer.send('loginSuccess', '');
    });

    /**
     * 获取班级名称以及classCode
     */
    const getTeacherClasses = () => {
        let param = {
            "method": "getTeacherClasses",
            "ident": remote.getGlobal('loginUser').colUid,
        };
        requestLittleAntApi(JSON.stringify(param), {
            onResponse: function (result) {
                if (result.success) {
                    if (result.response.length === 0) {
                        layer.msg('该老师没有班级，无法开课')
                    } else {
                        buildClass(result.response)
                    }
                } else {
                    layer.msg(result.msg);
                }
            },
            onError: function (error) {
                // message.error(error);
            }
        });
    };

    const buildClass = (arr) => {
        remote.getGlobal('loginUser').classCode = arr[0].split('#')[0];
        let htmlStr = '';
        arr.forEach((e, i) => {
            htmlStr += `<li>
                <span>${e.split('#')[1]}</span>
                <i onclick="classCheck(this,${e.split('#')[0]})" class="${i === 0 ? 'active check_i' : 'check_i'}"></i>
            </li>`
        });
        $('#class_list-ul').empty();
        $('#class_list-ul').append(htmlStr);
        $('#logo_content').hide();
        $('#classList').show();
    };

    /**
     * 渲染进程监听到窗口失去焦点
     */
    remote.getCurrentWindow().addListener('blur', () => {
        $("#act").blur();
    });
});

function classCheck(e, classCode) {
    require('electron').remote.getGlobal('loginUser').classCode = classCode;
    $('.check_i').each(function () {
        $(this).removeClass('active')
    });
    $(e).addClass('active');
}
