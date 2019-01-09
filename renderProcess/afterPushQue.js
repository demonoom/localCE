(function () {
    const {ipcRenderer} = require('electron');
    const remote = require('electron').remote;

    console.log(remote.getGlobal('loginUser').sid);
})()