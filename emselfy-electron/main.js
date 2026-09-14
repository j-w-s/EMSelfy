//using system
var electron = require('electron'),
    app = electron.app,
    browserWindow = electron.BrowserWindow,
    fs = require("fs"),
    http = require("http"),
    path = require("path");

//using me
var str = require("./utils/stringUtils.js");

var core = {
    server: require('./core/server.js'),
    window: require('./core/window.js')
};

//config
var config = require("./utils/configUtils.js").getConfig();

var welcomeStr = fs.readFileSync(__dirname + "/config/welcome.txt", "utf8").toString();

//띳침덜쯤[얇있꼬] 무樓淃커
console.log("EmCodes.club charitable project!");
console.log(str.format(welcomeStr, config["version"], config["publication"]));

app.on('ready', function () {
    core.window.init();
});

app.commandLine.appendSwitch("enable-usermedia-screen-capturing");

// Flash not supported on Linux - skipped
// app.commandLine.appendSwitch('ppapi-flash-path', path.parse(__dirname).dir + '/pepflashplayer.dll');
var server = http.createServer(core.server.server);

var prot = config.listen.min;
var isinit = false;

var listen = function () {
    server.listen(prot, "localhost", undefined, function () {
        if (isinit) return;
        isinit = true;
        core.server.init(prot);
        core.window.start(prot);
    });
}

server.on("error", function (e) {
    prot++;
    if (prot < config.listen.max) { listen(); return; }
    console.log("[Error]server unable to listen!");
});

listen();

//process.on('uncaughtException', function (err) {
//    console.log(str.format("node.js uncaughtException.\n{0}", err));
//});