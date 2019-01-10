let konwLedegArr = [];
(function () {
    const {ipcRenderer} = require('electron');
    const remote = require('electron').remote;
    const requestLittleAntApi = require('../public/webServiceUtil');

    $('#add').click(() => {
        if ($('#knowledge').val().trim() == '') {
            layer.msg('请选择知识点')
            return
        }
        //1.清空输入框  2.在ul中显示已选择的标签
        addUpdateKnowledgeList($('#knowledge').val().trim());
        $('#knowledge').val('')
    });

    $('#pushSubjectWithTag').click(() => {
        if (konwLedegArr.length == 0) {
            layer.msg('尚未添加知识点')
            return
        }
        let arr = []
        konwLedegArr.forEach((e, i) => {
            arr.push({
                id: '0',
                tagTitle: e,
                tagContent: e,
                uid: remote.getGlobal('loginUser').account.slice(2, remote.getGlobal('loginUser').account.length),
            })
        })
        pushSubjectWithTag(arr)
    });

    $('#updateClassSubjectAnswer').click(() => {
        updateClassSubjectAnswer();
    });

    /**
     * public boolean pushSubjectWithTag(String sid, String tagIds) throws Exception
     * @param arr
     */
    function pushSubjectWithTag(arr) {
        let param = {
            "method": "pushSubjectWithTag",
            "sid": remote.getGlobal('loginUser').sid,
            "tagIds": JSON.stringify(arr),
        };
        requestLittleAntApi(JSON.stringify(param), {
            onResponse: function (result) {
                if (result.success) {
                    //公布答案
                    $('#set_knowledge').hide()
                    $('#announceAnswer').show()
                } else {
                    layer.msg(result.msg);
                }
            },
            onError: function (error) {
                // message.error(error);
            }
        });
    }

    function addUpdateKnowledgeList(str) {
        if (konwLedegArr.indexOf(str) == -1) {
            if (konwLedegArr.length === 9) {
                layer.msg('最多只能添加9个知识点')
                return
            }
            konwLedegArr.push($('#knowledge').val().trim());
            let htmlStr = '';
            konwLedegArr.forEach((e, i) => {
                htmlStr += `<li>
                    ${e}
                </li><i onclick="removeKnowLedge(this)">x</i>`
            })
            $('#knowledge_list').empty();
            $('#knowledge_list').append(htmlStr);
        }
    }

    /**
     * public boolean updateClassSubjectAnswer(String vid,String sid,String answer)
     */
    function updateClassSubjectAnswer() {
        let param = {
            "method": "updateClassSubjectAnswer",
            "sid": remote.getGlobal('loginUser').sid,
            "vid": remote.getGlobal('loginUser').vid,
            "answer": 'A',
        };
        requestLittleAntApi(JSON.stringify(param), {
            onResponse: function (result) {
                console.log(result);
                if (result.success) {

                } else {
                    layer.msg(result.msg);
                }
            },
            onError: function (error) {
                // message.error(error);
            }
        });
    }
})()

function removeKnowLedge(str) {
    let word = $(str).prev().html()
    konwLedegArr = konwLedegArr.filter((e) => {
        return e != word.trim()
    })
    let htmlStr = '';
    konwLedegArr.forEach((e, i) => {
        htmlStr += `<li>
                    ${e}<i class="close" onclick="removeKnowLedge(this)"></i>
                </li>`
    })
    $('#knowledge_list').empty();
    $('#knowledge_list').append(htmlStr);
}