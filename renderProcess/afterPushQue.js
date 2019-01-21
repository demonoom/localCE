let konwLedegArr = [];
(function () {
    const {ipcRenderer} = require('electron');
    const remote = require('electron').remote;
    const requestLittleAntApi = require('../public/webServiceUtil');
    let subjectType = remote.getGlobal('loginUser').subjectType;
    var timer;
    ipcRenderer.on('clazzWsListener', (e, info) => {
        console.log(info, 'clazzWsListener');
        if (info == undefined) {
            return;
        }
        if (info.command == 'studentSubjectsCommit' || info.command == 'braceletPushAnswer') {
            var studentId = info.data.uid;
            console.log(remote.getGlobal('loginUser').classCode);
            getStudentInfoById(studentId);
        }
    });
    var clazzId = remote.getGlobal('loginUser').classCode;
    initStudentInfo(clazzId, requestLittleAntApi);
    getDoSubjectTagsByUserId();
    if (subjectType === 'C') {
        $('#choose_ans').show();
        $('#judge_ans').hide();
    } else {
        $('#choose_ans').hide();
        $('#judge_ans').show();
    }

    var recorder;

    $('#record').click((e) => {
        e.preventDefault();
        var num = 10;
        timer = setInterval(() => {
            if (num > 0) {
                num -= 1;
                if (num === 0) {
                    $('#record_stop').html('');
                    $('#record_stop_wrap').hide();
                    return
                }
                $('#record_stop_wrap').show();
                $('#record_stop').html('<div class="title">正在录音</div><img src="../images/icon_record.gif"/><div>可点击任意区域结束录音<span  class="time">倒计时 ' + num + '</span></div>');
            } else {
                clearInterval(timer);
                stopRecordAndUpload();
            }
        }, 1000);
        HZRecorder.get(function (rec) {
            recorder = rec;
            recorder.start();
        });
    });

    $('#record_stop_wrap').click(() => {
        clearInterval(timer);
        stopRecordAndUpload();
    });

    //输入框聚焦时显示
    $('#knowledge').focus(() => {
        $('.select_list').show()
    });

    $('#knowledge').click(() => {
        $('.select_list').show()
    });

    //输入框失焦时隐藏
    $('#knowledge').blur(() => {
        $('.select_list').hide()
    });

    //输入框输入时立马隐藏
    document.querySelector('#knowledge').oninput = () => {
        $('.select_list').hide()
    };

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
                layer.msg('请选择正确答案');
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
                layer.msg('请选择正确答案');
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
     * 停止录音并上传
     */
    function stopRecordAndUpload() {
        $('#record_stop').html('');
        $('#record_stop_wrap').hide();
        recorder.stop();
        recorder.upload();
    }

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
                    $('#announceAnswer').show();

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

    /**
     * public List<DoSubjectTag> getDoSubjectTagsByUserId(String searchKeywords,String pageNo,String userId)
     * 搜索此人所能看到的标签
     */
    function getDoSubjectTagsByUserId() {
        let param = {
            "method": "getDoSubjectTagsByUserId",
            "searchKeywords": '',
            "pageNo": -1,
            "userId": remote.getGlobal('loginUser').colUid,
        };
        requestLittleAntApi(JSON.stringify(param), {
            onResponse: function (result) {
                if (result.success) {
                    if (result.response.length != 0) {
                        buildTags(result.response);
                    }
                } else {
                    layer.msg(result.msg);
                }
            },
            onError: function (error) {
                // message.error(error);
            }
        });
    };

    /**
     * 构建历史标签
     * @param arr
     */
    function buildTags(arr) {
        let htmlstr = '';
        arr.forEach((v, i) => {
            htmlstr += `<li onmousedown="tagOnMouseDown(this)" onclick="tagOnClick(this)">${v.tagTitle}</li>`;
        })
        $('.select_list').empty();
        $('.select_list').append(htmlstr);
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

function getStudentInfoById(studentId) {
    $("#avatarDiv" + studentId).addClass("student_avatar-active");
    $("#imageTip" + studentId).show();
    $("#signTip" + studentId).remove();

}

function initStudentInfo(classId, requestLittleAntApi) {

    let param = {
        "method": "getClassStudents",
        "clazzId": classId,
    };
    requestLittleAntApi(JSON.stringify(param), {
        onResponse: function (result) {
            if (result.success) {
                console.log(result);
                var students = result.response;
                if (students == undefined || students.length == 0) {
                    return;
                }
                for (var i = 0; i < students.length; i++) {
                    var user = students[i];
                    var template = $("#student_template");
                    template.find("#student_name").text(user.userName);
                    template.find("#student_avatar").attr("src", user.avatar);
                    template.find(".student_item").attr("id", "itemId" + user.colUid);
                    template.find("#student_avatar").parent().attr("id", "avatarDiv" + user.colUid);
                    template.find(".imageTip").attr("id", "imageTip" + user.colUid);
                    template.find(".signTip").attr("id", "signTip" + user.colUid);
                    $("#student_list_container").append(template.html());
                    template.find(".imageTip").attr("id", "imageTip" + -1);
                    template.find(".signTip").attr("id", "signTip" + -1);
                    template.find(".student_item").attr("id", "itemId" + -1);

                }
            } else {
                layer.msg(result.msg);
            }
        },
        onError: function (error) {
            // message.error(error);
        }
    });

}

function tagOnClick(e) {
    $('#knowledge').val($(e).html());
    $('.select_list').hide()
}

function tagOnMouseDown(e) {
    if (e && e.preventDefault)
        e.preventDefault();
    //IE阻止默认事件
    else
        window.event.returnValue = false;
}
