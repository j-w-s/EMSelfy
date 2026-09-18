//using system
const fs = require('fs');
const http = require('http');

//using me
const str = require('./utils/stringUtils.js');

const core = {
    server: require('./core/server.js'),
};

//config
const config = require('./utils/configUtils.js').getConfig();

const welcomeStr = fs.readFileSync(__dirname + '/config/welcome.txt', 'utf8');

console.log('EmCodes.club charitable project!');
console.log(str.format(welcomeStr, config['version'], config['publication']));

const server = http.createServer(core.server.server);

let prot = config.listen.min;
let isinit = false;

const listen = function () {
    server.listen(prot, 'localhost', undefined, () => {
        if (isinit) return;
        isinit = true;
        core.server.init(prot);
        console.log('PORT:' + prot);
    });
};

server.on('error', (e) => {
    prot++;
    if (prot < config.listen.max) {
        listen();
        return;
    }
    console.log('[Error]server unable to listen!');
});

listen();
