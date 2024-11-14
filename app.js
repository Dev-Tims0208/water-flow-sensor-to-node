var http = require("http");
var fs = require("fs");

var index = fs.readFileSync("index.html");
var history = fs.readFileSync("history.html");

var SerialPort = require("serialport");

const parsers = SerialPort.parsers;
const parser = new parsers.Readline({
  delimiter: "\r\n",
});

// port from pc COM 9
var port = new SerialPort("COM8", {
  baudRate: 9600,
  dataBits: 8,
  parity: "none",
  stopBits: 1,
  flowControl: false,
});

port.pipe(parser);

parser.on("data", function (data) {});

var app = http.createServer(function (req, res) {
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(index);
  } else if (req.url === "/history") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(history);
  } else if (req.url === "/data.json") {
    res.writeHead(200, { "Content-Type": "application/json" });
    var loadedValue = fs.readFileSync("data.json", "utf8");
    res.end(loadedValue);
  } else {
    res.writeHead(404, { "Content-Type": "text/html" });
    res.end("404 Not Found");
  }
});

var io = require("socket.io").listen(app);
io.on("connection", function (data) {
  console.log("node is listening");
});

parser.on("data", function (data) {
  var _currentDate = new Date();
  var _key = _currentDate
    .toISOString()
    .replace(/T/, " ")
    .replace(/\..+/, "")
    .substr(0, 10);
  //convert into cubic meter from milliliters
  var waterFlowInSeconds = data / 1000000;

  var _value = {};

  //load value from text file if exists, create if not with a default value of 0
  if (!fs.existsSync("data.json")) {
    _value[_key] = {
      accumulatedValue: 0,
      currentWaterFlow: Number(waterFlowInSeconds).toFixed(6),
    };
  } else {
    //open data.json file and load data
    var loadedValue = fs.readFileSync("data.json", "utf8");
    _value = JSON.parse(loadedValue);

    //check if key exists in _value
    if (_value[_key] == undefined) {
      _value[_key] = {
        accumulatedValue: 0,
        currentWaterFlow: Number(waterFlowInSeconds).toFixed(6),
      };
    } else {
      //add new value to loaded data
      var calc = Number(_value[_key].accumulatedValue) + waterFlowInSeconds;
      _value[_key] = {
        accumulatedValue: Number(calc).toFixed(6),
        currentWaterFlow: Number(waterFlowInSeconds).toFixed(6),
      };
    }
  }
  //stringify data to json
  var _valueString = JSON.stringify(_value);

  //save data to text file
  fs.writeFileSync("data.json", _valueString);

  //send new data to client
  io.emit("data", _valueString);
});

// app.listen(3000);
// serve app using external ip 0.0.0.0:3000
app.listen(3000, "0.0.0.0");
