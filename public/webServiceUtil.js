var isDebug = false;
var localDomain = "192.168.50.71";   //请求地址

// //小蚂蚁webService地址
const apiWebServiceURLOfLocals = "http://" + localDomain + ":9006/Excoord_ApiServer/webservice";
const apiWebServiceURLOfRemote = "https://www.maaee.com/Excoord_For_Education/webservice";
var apiWebServiceURL = isDebug ? apiWebServiceURLOfLocals : apiWebServiceURLOfRemote;

function requestLittleAntApi(data, listener) {
    $.ajax({
        type: "post",
        url: apiWebServiceURL,
        data: {params: data},
        dataType: "json",
        success: function (result) {
            listener.onResponse(result);
        }, error: function (error) {
            listener.onError(error);
        }
    });
}

module.exports = requestLittleAntApi;



