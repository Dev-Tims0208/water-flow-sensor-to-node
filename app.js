var http = require("http");
var fs = require("fs");

var index = fs.readFileSync("index.html");

var SerialPort = require("serialport");

const parsers = SerialPort.parsers;
const parser = new parsers.Readline({
  delimiter: "\r\n",
});

// port from pc COM 9
var port = new SerialPort("COM9", {
  baudRate: 9600,
  dataBits: 8,
  parity: "none",
  stopBits: 1,
  flowControl: false,
});

port.pipe(parser);

parser.on("data", function (data) {
  console.log(data);
});

var app = http.createServer(function (req, res) {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(index);
});

var io = require("socket.io").listen(app);
io.on("connection", function (data) {
  console.log("node is listening");
});

parser.on("data", function (data) {
  console.log(data);
  io.emit("data", data);
});

// app.listen(3000);
// serve app using external ip 0.0.0.0:3000
app.listen(3000, "0.0.0.0");
