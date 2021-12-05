var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var http = require("http").Server(app);
const port = process.env.PORT || 3000;
var io = require("socket.io")(http);
var mongoose = require("mongoose");
const { stringify } = require("querystring");
const { sensitiveHeaders } = require("http2");

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

mongoose.Promise = Promise;

// regula expression that specifies a pattern containing some common bad words in English
const CENSOR = /(shit)|(fuck)|(bitch)|(ass)|(cock)|(piss off)/i;

var dbUrl =
  "mongodb+srv://admin:fignbdxcmnfineoacyj@chat-app.cbosh.mongodb.net/Chat-app?retryWrites=true&w=majority";

var Message = mongoose.model("Message", {
  name: String,
  message: String,
});

app.get("/messages", (req, res) => {
  Message.find({}, (err, messages) => {
    res.send(messages);
  });
});

app.get("/messages/:user", (req, res) => {
  var user = req.params.user;
  Message.find({ name: user }, (err, messages) => {
    res.send(messages);
  });
});

app.post("/messages", async (req, res) => {
  try {
    var message = new Message(req.body);

    var savedMessage = await message.save();

    console.log("saved");

    var censored = await Message.findOne({
      message: CENSOR,
    });

    if (censored) {
      // censor the message if it contains a bad word specified above
      console.log("censored found! %s", message.message);
      return Message.deleteOne({ _id: censored.id });
    } else io.emit("message", req.body);

    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
    return console.error(error);
  }
});

io.on("connection", (socket) => {
  console.log("a user connected");
});

mongoose.connect(dbUrl, (err) => {
  console.log("mongo db connection", err);
});

var server = http.listen(3000, () => {
  console.log("server is listening on port", server.address().port);
});
