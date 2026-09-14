var electron = require('electron')
    , app = electron.app
    , dialog = electron.dialog
    , browserWindow = electron.BrowserWindow;

var str = require("../utils/stringUtils.js");

var path = require("path");

var wins = {}

var prot = 0;

var _initc = false;

exports.init = function () {
    var _dir = path.parse(__dirname).dir;
    
    app.commandLine.appendSwitch('disable-web-security');
    wins["main"] = new browserWindow({
        'width': 910, 'height': 570, 'minWidth': 910, 'minHeight': 570,
        'webPreferences': {
            'nodeIntegration': true,
            'contextIsolation': false,
            'webSecurity': false
        },
        'show': false, 'frame': false
    });
    
    wins["main"].loadURL("file://" + _dir + "/assets/html/index.html");
    //wins["main"].loadURL("file://" + _dir + "/assets/html/test.html");
    
    wins["main"].on('closed', function () {
        wins["main"] = null;
        app.quit();
    });
    
    wins["main"].webContents.on('did-finish-load', function () {
        wins["main"].show();
    });
    
    _initc = true;
    if (prot != 0) { exports.start(prot); }
}
exports.start = function (p) {
    prot = p;
    if (!_initc) { return; }
    
    wins["main"].webContents.on('did-finish-load', function () {
        wins["main"].webContents.executeJavaScript("window.winid='main';window.localprot='" + prot + "';window.serverurl='http://localhost:" + prot + "';");
        wins["main"].webContents.executeJavaScript("init();");
    });

   
}

electron.ipcMain.on("winMessage", function (e, args) {
    switch (args[1]) {
        case "MINIMZE": wins[args[0]].minimize(); break;
        //case "MINIMZE": wins[args[0]].minimize(); break;
        case "CLOSE": wins[args[0]].close(); ; break;
    }
});
electron.ipcMain.on("openDialog", function (e, type, args) {
    var win = browserWindow.fromWebContents(e.sender);
    switch (type) {
        case "save":
            dialog.showSaveDialog(win, args).then(function(result) {
                e.sender.send("openDialog-back", type, result.filePath);
            });
            break;
        case "open":
            dialog.showOpenDialog(win, args).then(function(result) {
                e.sender.send("openDialog-back", type, result.filePaths);
            });
            break;
    }
});

var initPreview = function () {
    if (wins["preview"]) { return; }
    var _dir = path.parse(__dirname).dir;
    
    wins["preview"] = new browserWindow({
        'width': 450, 'height': 600,
        'webPreferences': { 'nodeIntegration': true, 'contextIsolation': false, 'webSecurity': false },
        'show': false, 'frame': false
    });
    wins["preview"].loadURL("file://" + _dir + "/assets/html/preview.html");
}

electron.ipcMain.on("openPreview", function (e, params) {
    initPreview();
    wins["preview"].webContents.on('did-finish-load', function () {
        wins["preview"].webContents.executeJavaScript("window.info={};");
        //wins["preview"].webContents.executeJavaScript("window.info.hwnd="++";");
        wins["preview"].webContents.executeJavaScript("window.winid='preview';window.localprot='" + prot + "';window.serverurl='http://localhost:" + prot + "';");
        wins["preview"].webContents.executeJavaScript("window.params='" + params + "';");
        wins["preview"].show();
        var hwnd = wins["preview"].getNativeWindowHandle();
        //wins["preview"].webContents.executeJavaScript("window.info.hwnd="+ hwnd.readUIntBE(0, 3)+";");
        console.log(hwnd.toString('hex'));
        wins["preview"].webContents.executeJavaScript("init();");
    });
});
electron.ipcMain.on("test", function (e, p) {
    if (p == 1) { wins["preview"].hide(); }
    if (p == 2) { wins["preview"].show(); }
});