$(function () {
    const {ipcRenderer, remote} = require('electron');

    /**
     * 接受webviewSrc消息后，向webview注入src
     */
    ipcRenderer.on('webviewSrc', (e, info) => {
        $('#conentIframe').attr("src", info.src);
    });

    $('.icon_blackClose').click(function () {
        remote.getCurrentWindow().close();
    })

    $('.icon_min').click(function () {
        remote.getCurrentWindow().minimize()
    })
    $('.icon_refresh').click(()=>{
        remote.getCurrentWindow().reload();
    })
});
