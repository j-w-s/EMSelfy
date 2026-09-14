window.jQuery = window.$ = require("../jslib/jquery.js");
require("../jslib/jquery-ui-1.11.4.custom/jquery-ui.min.js");;
require("../js/ui.js");;

window.electron = require('electron');

var ipc = electron.ipcRenderer;

$(function () {
    var winMain = $(".win-div");
    var win = $(window);
    win.on("resize", function () {
        winMain.css({ width: win.width() - 2, height: win.height() - 2 });
    }).trigger("resize");
    
    $("#win_btn_min").on("click", function () {
        ipc.send("winMessage" , [window.winid, "MINIMZE"]); //最小化窗口
    });
    
    $("#win_btn_close").on("click", function () {
        ipc.send("winMessage" , [window.winid, "CLOSE"]); //关闭窗口
    });
    
   
});

