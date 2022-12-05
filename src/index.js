const http = require("http");
const finalhandler = require("finalhandler");
const ejs = require("ejs");
const Router = require("router");
const DeviceDetector = require("node-device-detector");
const ClientHints = require("node-device-detector/client-hints");
const detectorVersion = require("node-device-detector/package.json").version;
const InfoDevice = require("node-device-detector/parser/device/info-device");
console.log({ detectorVersion });
const bodyParser = require("body-parser");

const routerOpts = {};
const router = Router(routerOpts);
const clientHints = new ClientHints();
const detector = new DeviceDetector({
  clientIndexes: true
});
const infoDevice = new InfoDevice();

infoDevice.setSizeConvertObject(true);
infoDevice.setResolutionConvertObject(true);

const port = 8080;
const timeout = 3e5;

const server = http.createServer(function onRequest(req, res) {
  router(req, res, finalhandler(req, res));
});

server.listen({ port, timeout }, (err, result) => {
  console.log("server listen port %s", port);
});

router.get("/", (req, res) => {
  let upHeaders = ClientHints.getHeaderClientHints();
  for (let headerName in upHeaders) {
    res.setHeader(headerName, upHeaders[headerName]);
  }
  let headers = [];
  for (let headerName in req.headers) {
    let value = req.headers[headerName];
    if (
      headerName.indexOf("sec-ch-") !== -1 ||
      headerName.indexOf("x-requested-with") !== -1
    ) {
      headers.push(headerName + ":" + value);
    }
  }

  let data = { version: detectorVersion, headers: headers.join("\n") };
  let options = { cache: false };
  let filename = __dirname + "/views/index.html";

  ejs.renderFile(filename, data, options, (err, str) => {
    return res.end(str);
  });
});

const api = Router();
router.use("/api/", api);
api.use(bodyParser.json());

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
    deviceInfoResult = infoDevice.info(
      deviceResult.device.brand,
      deviceResult.device.model
    );
  }

  res.end(
    JSON.stringify({
      useragent,
      deviceResultTime: time1 - time0 + " ms.",
      deviceResult,
      botResult,
      botResultTime: time2 - time1 + " ms.",
      deviceInfoResult
    })
  );
});
