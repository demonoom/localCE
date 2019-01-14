let msgArr = [];
$(function () {
    const remote = require('electron').remote;
    const {ipcRenderer} = require('electron');

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
    }
});

function img_onclick(e) {
    console.log(e.src);
    var arr = msgArr.filter((e) => {
        return e.message.attachment != null
    }).map((e) => {
        return e.message.attachment.address;
    });
    $("#preview_img").attr("src", e.src);
    $("#mask").show();
}
