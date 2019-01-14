let msgArr = [];
let this_src;
$(function () {
    const remote = require('electron').remote;
    const {ipcRenderer} = require('electron');

    $('.icon_close').click(() => {
        $("#mask").hide();
    });

    $('.icon_right').click(() => {
        var arr = msgArr.filter((e) => {
            return e.message.attachment != null
        }).map((e) => {
            return e.message.attachment.address;
        });
        for (var i = 0; i <= arr.length; i++) {
            if (arr[i] === this_src) {
                if (i != arr.length - 1) {
                    $("#preview_img").attr("src", arr[i + 1]);
                    this_src = $("#preview_img").attr('src');
                    break
                }
            }
        }
    });

    $('.icon_left').click(() => {
        var arr = msgArr.filter((e) => {
            return e.message.attachment != null
        }).map((e) => {
            return e.message.attachment.address;
        });

        for (var i = 0; i <= arr.length; i++) {
            if (arr[i] === this_src) {
                if (i != 0) {
                    $("#preview_img").attr("src", arr[i - 1]);
                    this_src = $("#preview_img").attr('src');
                    break
                }
            }
        }
    });

    //获取本地消息记录，加载历史消息
    msgArr = remote.getGlobal('loginUser').msgArr;
    if (msgArr.length !== 0) {
        buildMesList(msgArr);
    }

    /**
     * 接受弹幕
     */
    ipcRenderer.on('classDanmu', (e, info) => {
        msgArr.push(info);
        buildMesList(msgArr);
    });

    /**
     * 构建消息列表
     * @param arr
     */
    function buildMesList(arr) {
        $('.empty').hide();
        let htmlStr = '';
        arr.forEach((e, i) => {
            if (e.message.attachment != null && e.message.content === '[图片]') {
                //图片
                htmlStr += `<li>
                    <div class="userImg">
                        <img src=${e.message.fromUser.avatar} alt="">
                    </div>
                    <div class="imgCont">
                        <span>${e.message.fromUser.userName}</span>            
                        <img onclick="img_onclick(this)" src=${e.message.attachment.address} alt="">
                    </div>
                </li>`
            } else {
                //文字
                htmlStr += `<li>
                    <div class="userImg">
                        <img src=${e.message.fromUser.avatar} alt="">
                    </div>
                    <div class="textCont">
                        <span>${e.message.fromUser.userName}</span>            
                        <div>${e.message.content}</div>
                    </div>
                </li>`
            }
        });
        $('#content>ul').empty();
        $('#content>ul').append(htmlStr);

        document.querySelector('#content').scrollTop = document.querySelector('#content').scrollHeight

    }
});

function img_onclick(e) {
    this_src = e.src;
    $("#preview_img").attr("src", e.src);
    $("#mask").show();
}
