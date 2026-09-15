const ipc = {
    invoke(cmd, args) {
        return window.__TAURI__.core.invoke(cmd, args);
    },
};

$(function () {
    const $winMain = $('.win-div');
    const $win = $(window);

    $win.on('resize', function () {
        $winMain.css({ width: $win.width() - 2, height: $win.height() - 2 });
    }).trigger('resize');

    $('#win_btn_min').on('click', () => ipc.invoke('win_minimize'));
    $('#win_btn_close').on('click', () => ipc.invoke('win_close'));
});
