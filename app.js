var express = require("express");
var app = express();

var port = process.env.PORT || 3000;

app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/node_modules"));

app.get("/", function(req, res) {
  res.send("index");
});

var server = require("http").createServer(app);
var io = require("socket.io")(server);
var chat = require("./lib/chat");

server.listen(port, function() {
  console.log("Сервер express запущен, порт : %d", port);
  chat.create(io, function() {
    console.log("Сервер чата запущен, порт : %d", port);
  });
});
