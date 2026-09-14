var ipc = {
    invoke: function (cmd, args) {
        return window.__TAURI__.core.invoke(cmd, args);
    },
};

$(function () {
    var winMain = $('.win-div');
    var win = $(window);
    win.on('resize', function () {
        winMain.css({ width: win.width() - 2, height: win.height() - 2 });
    }).trigger('resize');

    $('#win_btn_min').on('click', function () {
        ipc.invoke('win_minimize');
    });

    $('#win_btn_close').on('click', function () {
        ipc.invoke('win_close');
    });
});
