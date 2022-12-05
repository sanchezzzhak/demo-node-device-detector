"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const finalhandler_1 = __importDefault(require("finalhandler"));
const ejs_1 = __importDefault(require("ejs"));
const router_1 = __importDefault(require("router"));
const body_parser_1 = __importDefault(require("body-parser"));
const node_device_detector_1 = __importDefault(require("node-device-detector"));
const info_device_1 = __importDefault(require("node-device-detector/parser/device/info-device"));
const client_hints_1 = __importDefault(require("node-device-detector/client-hints"));
const detectorVersion = '2.0.9';
console.log({ detectorVersion });
const routerOpts = {};
const router = (0, router_1.default)(routerOpts);
const clientHints = new client_hints_1.default();
const detector = new node_device_detector_1.default({
    clientIndexes: true
});
const infoDevice = new info_device_1.default();
infoDevice.setSizeConvertObject(true);
infoDevice.setResolutionConvertObject(true);
const port = 8080;
const timeout = 3e5;
const server = http_1.default.createServer(function onRequest(req, res) {
    router(req, res, (0, finalhandler_1.default)(req, res));
});
server.listen({ port, timeout }, () => {
    console.log("server listen port %s", port);
});
router.get("/", (req, res) => {
    let upHeaders = client_hints_1.default.getHeaderClientHints();
    for (let headerName in upHeaders) {
        res.setHeader(headerName, upHeaders[headerName]);
    }
    let headers = [];
    for (let headerName in req.headers) {
        let value = req.headers[headerName];
        if (headerName.indexOf("sec-ch-") !== -1 ||
            headerName.indexOf("x-requested-with") !== -1) {
            headers.push(headerName + ":" + value);
        }
    }
    let data = { version: detectorVersion, headers: headers.join("\n") };
    let options = { cache: false };
    let filename = __dirname + "/views/index.html";
    ejs_1.default.renderFile(filename, data, options, (err, str) => {
        return res.end(str);
    });
});
const api = (0, router_1.default)();
router.use("/api/", api);
api.use(body_parser_1.default.json());
api.post("/detect", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "origin, content-type, accept");
    let { useragent, aboutDevice, enableIndex, headers } = req.body;
    let customHeaders = {};
    headers.split("\n").forEach((item) => {
        let partStr = item.split(":", 2);
        customHeaders[partStr[0]] = partStr[1];
    });
    detector.deviceIndexes = Boolean(enableIndex);
    let time0 = new Date().getTime();
    const clientHintData = clientHints.parse(customHeaders);
    let deviceResult = detector.detect(useragent, clientHintData);
    let time1 = new Date().getTime();
    let botResult = detector.parseBot(useragent);
    let time2 = new Date().getTime();
    let deviceInfoResult = null;
    if (aboutDevice) {
        deviceInfoResult = infoDevice.info(deviceResult.device.brand, deviceResult.device.model);
    }
    res.end(JSON.stringify({
        useragent,
        deviceResultTime: time1 - time0 + " ms.",
        deviceResult,
        botResult,
        botResultTime: time2 - time1 + " ms.",
        deviceInfoResult
    }));
});
//# sourceMappingURL=index.js.map