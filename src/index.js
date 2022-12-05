import * as http from 'http';
import finalhandler from 'finalhandler';
import ejs from 'ejs';
import Router from 'router';
import bodyParser from 'body-parser';
import DeviceDetector from 'node-device-detector';
import InfoDevice from 'node-device-detector/parser/device/info-device';
import ClientHints from 'node-device-detector/client-hints';
var detectorVersion = '2.0.9';
console.log({ detectorVersion: detectorVersion });
var routerOpts = {};
var router = Router(routerOpts);
var clientHints = new ClientHints();
var detector = new DeviceDetector({
    clientIndexes: true
});
var infoDevice = new InfoDevice();
infoDevice.setSizeConvertObject(true);
infoDevice.setResolutionConvertObject(true);
var port = 8080;
var timeout = 3e5;
var server = http.createServer(function onRequest(req, res) {
    router(req, res, finalhandler(req, res));
});
server.listen({ port: port, timeout: timeout }, function () {
    console.log("server listen port %s", port);
});
router.get("/", function (req, res) {
    var upHeaders = ClientHints.getHeaderClientHints();
    for (var headerName in upHeaders) {
        res.setHeader(headerName, upHeaders[headerName]);
    }
    var headers = [];
    for (var headerName in req.headers) {
        var value = req.headers[headerName];
        if (headerName.indexOf("sec-ch-") !== -1 ||
            headerName.indexOf("x-requested-with") !== -1) {
            headers.push(headerName + ":" + value);
        }
    }
    var data = { version: detectorVersion, headers: headers.join("\n") };
    var options = { cache: false };
    var filename = __dirname + "/views/index.html";
    ejs.renderFile(filename, data, options, function (err, str) {
        return res.end(str);
    });
});
var api = Router();
router.use("/api/", api);
api.use(bodyParser.json());
api.post("/detect", function (req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "origin, content-type, accept");
    var _a = req.body, useragent = _a.useragent, aboutDevice = _a.aboutDevice, enableIndex = _a.enableIndex, headers = _a.headers;
    var customHeaders = {};
    headers.split("\n").forEach(function (item) {
        var partStr = item.split(":", 2);
        customHeaders[partStr[0]] = partStr[1];
    });
    detector.deviceIndexes = Boolean(enableIndex);
    var time0 = new Date().getTime();
    var clientHintData = clientHints.parse(customHeaders);
    var deviceResult = detector.detect(useragent, clientHintData);
    var time1 = new Date().getTime();
    var botResult = detector.parseBot(useragent);
    var time2 = new Date().getTime();
    var deviceInfoResult = null;
    if (aboutDevice) {
        deviceInfoResult = infoDevice.info(deviceResult.device.brand, deviceResult.device.model);
    }
    res.end(JSON.stringify({
        useragent: useragent,
        deviceResultTime: time1 - time0 + " ms.",
        deviceResult: deviceResult,
        botResult: botResult,
        botResultTime: time2 - time1 + " ms.",
        deviceInfoResult: deviceInfoResult
    }));
});
//# sourceMappingURL=index.js.map