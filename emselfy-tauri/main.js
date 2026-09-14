//using system
var fs = require('fs'),
    http = require('http');

//using me
var str = require('./utils/stringUtils.js');

var core = {
    server: require('./core/server.js'),
};

//config
var config = require('./utils/configUtils.js').getConfig();

var welcomeStr = fs.readFileSync(__dirname + '/config/welcome.txt', 'utf8').toString();

console.log('EmCodes.club charitable project!');
console.log(str.format(welcomeStr, config['version'], config['publication']));

var server = http.createServer(core.server.server);

var prot = config.listen.min;
var isinit = false;

var listen = function () {
    server.listen(prot, 'localhost', undefined, function () {
        if (isinit) return;
        isinit = true;
        core.server.init(prot);
        console.log('PORT:' + prot);
    });
};

server.on('error', function (e) {
    prot++;
    if (prot < config.listen.max) {
        listen();
        return;
    }
    console.log('[Error]server unable to listen!');
});

listen();
