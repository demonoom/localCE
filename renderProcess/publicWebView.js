(function () {
    const {ipcRenderer} = require('electron');
    /**
     * 接受webviewSrc消息后，向webview注入src
     */
    ipcRenderer.on('webviewSrc', (e, info) => {
        $('#conentIframe').attr("src", info.src);
    });
})();