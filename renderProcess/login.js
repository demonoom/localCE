$(function () {
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
        $.ajax({
            type: "POST",
            url: "https://www.maaee.com/Excoord_For_Education/webservice",
            data: {
                params: JSON.stringify({
                    "method": "getLoginTeachSystemEwm",
                    "uuid": machineId,
                })
            },
            header: {
                "content-type": "application/x-www-form-urlencoded;charset=UTF-8"
            },
            success: function (data) {
                var res = JSON.parse(data);
                if (res.success) {
                    $('#scan_image').attr('src', res.response)
                }

            },
            error: function (e) {
                console.log(e);
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
        $.ajax({
            type: "POST",
            url: "https://www.maaee.com/Excoord_For_Education/webservice",
            data: {
                params: JSON.stringify({
                    "method": "login",
                    "username": $('#act').val().trim(),
                    "password": $('#pwd').val().trim()
                })
            },
            header: {
                "content-type": "application/x-www-form-urlencoded;charset=UTF-8"
            },
            success: function (data) {
                var res = JSON.parse(data);
                if (res.success) {
                    if ($("#act").val() !== "" && $("#pwd").val() !== "") {
                        accountArr.push({
                            account: $("#act").val(),
                            password: $("#pwd").val()
                        });
                    }
                    accountArr = makeArr(accountArr, "account");
                    localStorage.setItem('accountData', JSON.stringify(accountArr));
                    console.log('登录成功');
                    // window.location.href = 'syncClassroom.html?teacherId=' + res.response.colUid + '&teacherName=' + res.response.userName + '';
                } else {
                    layer.msg(res.msg);
                }
            },
            error: function (e) {
                console.log(e);
            }
        });
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
    }

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
            var command = info.command;
            if (command == "allowLoginTeachSystem") {
                var data = info.data;
                var uuid = data.uuid;
                //                   var user = data.user;
                if (uuid == machineId) {
                    console.log('登陆成功');
                    // window.location.href = 'syncClassroom.html?teacherId=' + data.user.colUid + '&teacherName=' + data.user.userName + '';
                } else {
                }
            }
        }
    };
});