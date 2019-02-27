let msgArr = [];
let this_src;
$(function () {
    const remote = require('electron').remote;
    const {ipcRenderer} = require('electron');

    //关闭
    $('.icon_close').click(() => {
        $("#mask").hide();
    });

    //下一张
    $('.icon_right').click(() => {
        var arr = msgArr.filter((e) => {
            return e.message.attachment != null
        }).map((e) => {
            return {
                src: e.message.attachment.address,
                name: e.message.fromUser.userName
            }
        });
        for (var i = 0; i <= arr.length; i++) {
            if (arr[i].src === this_src) {
                if (i != arr.length - 1) {
                    $("#preview_img").attr("src", arr[i + 1].src);
                    this_src = $("#preview_img").attr('src');
                    $('#userName').empty();
                    $('#userName').append(`<span>${arr[i + 1].name}</span>`);
                    break
                }
            }
        }
    });

    //上一张
    $('.icon_left').click(() => {
        var arr = msgArr.filter((e) => {
            return e.message.attachment != null
        }).map((e) => {
            return {
                src: e.message.attachment.address,
                name: e.message.fromUser.userName
            }
        });

        for (var i = 0; i <= arr.length; i++) {
            if (arr[i].src === this_src) {
                if (i != 0) {
                    $("#preview_img").attr("src", arr[i - 1].src);
                    this_src = $("#preview_img").attr('src');
                    $('#userName').empty();
                    $('#userName').append(`<span>${arr[i - 1].name}</span>`);
                    break
                }
            }
        }
    });

    $('.icon_blackClose').click(function () {
        remote.getCurrentWindow().close();
    })

    $('.icon_min').click(function () {
        remote.getCurrentWindow().minimize()
    })

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
        var historyScroll = document.querySelector('#content').scrollHeight;
        arr.forEach((e, i) => {
            if (e.message.attachment != null && e.message.content === '[图片]') {
                //图片
                htmlStr += `<li>
                    <div class="userImg">
                        <img src=${e.message.fromUser.avatar} alt="">
                    </div>
                    <div class="imgCont">
                        <span>${e.message.fromUser.userName}</span>            
                        <img data-name=${JSON.stringify(e.message.fromUser.userName)} onclick="img_onclick(this)" src=${e.message.attachment.address} alt="">
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

        //如果不是停在最下部，就不滚动到最低
        if (document.querySelector('#content').scrollTop < historyScroll - document.body.clientHeight) {
            return
        }

        document.querySelector('#content').scrollTop = document.querySelector('#content').scrollHeight

    }
});

function img_onclick(e) {
    this_src = e.src;
    $("#preview_img").attr("src", e.src);
    $('#userName').empty();
    $('#userName').append($(e).attr('data-name'));
    $("#mask").show();
}
