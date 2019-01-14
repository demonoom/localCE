$(function () {
    const remote = require('electron').remote;
    const {ipcRenderer} = require('electron');

    //获取本地消息记录，加载历史消息
    var msgArr = remote.getGlobal('loginUser').msgArr;
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
                    <div>
                        <img src=${e.message.fromUser.avatar} alt="">
                        <span>${e.message.fromUser.userName}</span>            
                    </div>
                    <div>
                        <img src=${e.message.attachment.address} alt="">
                    </div>
                </li>`
            } else {
                //文字
                htmlStr += `<li>
                    <div>
                        <img src=${e.message.fromUser.avatar} alt="">
                        <span>${e.message.fromUser.userName}</span>            
                    </div>
                    <div>
                        ${e.message.content}
                    </div>
                </li>`
            }
        });
        $('#content>ul').empty();
        $('#content>ul').append(htmlStr);
    }
});
