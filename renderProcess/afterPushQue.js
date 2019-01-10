let konwLedegArr = [];
(function () {
    const {ipcRenderer} = require('electron');
    const remote = require('electron').remote;
    const requestLittleAntApi = require('../public/webServiceUtil');
    let subjectType = remote.getGlobal('loginUser').subjectType;

    if (subjectType === 'C') {
        $('#choose_ans').show();
        $('#judge_ans').hide();
    } else {
        $('#choose_ans').hide();
        $('#judge_ans').show();
    }

    $('#add').click(() => {
        if ($('#knowledge').val().trim() == '') {
            layer.msg('请选择知识点');
            return
        }
        if ($('#knowledge').val().trim().length > 6) {
            layer.msg('知识点不能超过六个字');
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
        let arr = [];
        konwLedegArr.forEach((e, i) => {
            arr.push({
                id: '0',
                tagTitle: e,
                tagContent: e,
                uid: remote.getGlobal('loginUser').account.slice(2, remote.getGlobal('loginUser').account.length),
            })
        });
        pushSubjectWithTag(arr)
    });

    $('#updateClassSubjectAnswer').click(() => {
        if (subjectType === 'C') {
            //选择题
            let arr = [];
            let ansStr = '';
            $('.choose_selection').each(function (i, e) {
                arr.push($(this).attr('data-choosen'))
            });
            if (arr.indexOf('true') === -1) {
                layer.msg('请选择选项');
                return
            } else {
                arr.forEach(function (v, i) {
                    if (v === 'true') {
                        if (i == 0) {
                            ansStr += 'A,';
                        } else if (i == 1) {
                            ansStr += 'B,';
                        } else if (i == 2) {
                            ansStr += 'C,';
                        } else if (i == 3) {
                            ansStr += 'D,';
                        }
                    }
                });
                updateClassSubjectAnswer(ansStr.slice(0, ansStr.length - 1));
            }
        } else {
            //判断题
            if ($('#judge_yes').attr('data-judge') === 'false' && $('#judge_no').attr('data-judge') === 'false') {
                layer.msg('请选择选项');
                return
            } else if ($('#judge_yes').attr('data-judge') === 'true' && $('#judge_no').attr('data-judge') === 'false') {
                updateClassSubjectAnswer('正确');
            } else {
                updateClassSubjectAnswer('错误');
            }
        }
    });

    //选择题答案
    $('.choose_selection').each((i, e) => {
        $(e).click(function () {
            if ($(this).attr('data-choosen') === 'false') {
                $(this).attr('data-choosen', "true");
                $(this).addClass('active')
            } else {
                $(this).attr('data-choosen', "false");
                $(this).removeClass('active')
            }
        })
    });

    //判断题对
    $('#judge_yes').click(function () {
        $(this).addClass('active').attr('data-judge', "true");
        $('#judge_no').removeClass('active').attr('data-judge', "false");
    });

    //判断题错
    $('#judge_no').click(function () {
        $(this).addClass('active').attr('data-judge', "true");
        $('#judge_yes').removeClass('active').attr('data-judge', "false");
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
                    console.log(remote.getGlobal('loginUser').sid);
                    console.log(remote.getGlobal('loginUser').vid);
                    $('#set_knowledge').hide();
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
            if (konwLedegArr.length === 4) {
                layer.msg('最多只能添加4个知识点')
                return
            }
            konwLedegArr.push($('#knowledge').val().trim());
            let htmlStr = '';
            konwLedegArr.forEach((e, i) => {
                htmlStr += `<li>
                    <span>${e}</span><i class="close" onclick="removeKnowLedge(this)"></i>
                </li>`
            })
            $('#knowledge_list').empty();
            $('#knowledge_list').append(htmlStr);
        }
    }

    /**
     * public boolean updateClassSubjectAnswer(String vid,String sid,String answer)
     */
    function updateClassSubjectAnswer(answer) {
        let param = {
            "method": "updateClassSubjectAnswer",
            "sid": remote.getGlobal('loginUser').sid,
            "vid": remote.getGlobal('loginUser').vid,
            "answer": answer,
        };
        requestLittleAntApi(JSON.stringify(param), {
            onResponse: function (result) {
                if (result.success) {
                    layer.msg('公布成功');
                    ipcRenderer.send('updateClassSubjectAnswer', '');
                } else {
                    layer.msg(result.msg);
                }
            },
            onError: function (error) {
                // message.error(error);
            }
        });
    }
})();

function removeKnowLedge(str) {
    let word = $(str).prev().html()
    konwLedegArr = konwLedegArr.filter((e) => {
        return e != word.trim()
    });
    let htmlStr = '';
    konwLedegArr.forEach((e, i) => {
        htmlStr += `<li>
                    <span>${e}</span><i class="close" onclick="removeKnowLedge(this)"></i>
                </li>`
    });
    $('#knowledge_list').empty();
    $('#knowledge_list').append(htmlStr);
}
