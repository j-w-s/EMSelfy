const ipc = {
    invoke(cmd, args) {
        return window.__TAURI__.core.invoke(cmd, args);
    },
};

function initWinControls() {
    const $winMain = $('.win-div');
    const $win = $(window);

    $win.on('resize', () => {
        $winMain.css({ width: $win.width() - 2, height: $win.height() - 2 });
    }).trigger('resize');

    $('#win_btn_min').on('click', () => appIpc.invoke('win_minimize'));
    $('#win_btn_max').on('click', () => appIpc.invoke('win_toggle_maximize'));
    $('#win_btn_close').on('click', () => appIpc.invoke('win_close'));
    $('.win-title').on('dblclick', (e) => {
        if ($(e.target).closest('.win-btn').length) return;
        appIpc.invoke('win_toggle_maximize');
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWinControls);
} else {
    initWinControls();
}
