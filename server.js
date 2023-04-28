const express = require("express");
const http = require("http");
const app = express();
const server = http.Server(app);
const io = require("socket.io")(server);
const fs = require("fs");

let bite_size = 256,
  readbytes,
  file;

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("index");
});

function readsome(socket) {
  try {
    var stats = fs.fstatSync(file); // yes sometimes async does not make sense!
    if (stats.size < readbytes + 1) {
      console.log(
        "Hehe I am much faster than your writer..! I will sleep for a while, I deserve it!"
      );
      setTimeout(() => readsome(socket), 3000);
    } else {
      fs.read(
        file,
        new Buffer.alloc(bite_size),
        0,
        bite_size,
        readbytes,
        (err, bytecount, buff) => processsome(err, bytecount, buff, socket)
      );
    }
  } catch (err) {
    console.log(err);
  }
}

function processsome(err, bytecount, buff, socket) {
  console.log("Read", bytecount, "and will process it now.");

  // Here we will process our incoming data:
  // Do whatever you need. Just be careful about not using beyond the bytecount in buff.
  console.log(buff.toString("utf-8", 0, bytecount));
  socket.emit("data-received", { data: buff.toString("utf-8", 0, bytecount) });
  // So we continue reading from where we left:
  readbytes += bytecount;
  process.nextTick(() => readsome(socket));
}

io.on("connection", (socket) => {
  filePath = socket.handshake.query.filepath;
  console.log("User connected");
  try {
    fs.open(`logs/${filePath}`, "r", function (err, fd) {
      file = fd;
      readbytes = 0;
      readsome(socket);
    });
    socket.emit("user-connected");
  } catch (ex) {
    socket.emit("wrong-filepath");
  }

  socket.on("disconnect", () => {
    fs.close(file);
    console.log("User disconnected");
    readbytes = 0;
    file = null;
  });
});

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
