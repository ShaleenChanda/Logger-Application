const express = require("express");
const http = require("http");
const app = express();
const server = http.Server(app);
const io = require("socket.io")(server);
const fs = require("fs");

let bite_size = 256;

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("index");
});

function readsome(socket, file, readbytes) {
  try {
    var stats = fs.fstatSync(file.descriptor); // yes sometimes async does not make sense!
    if (stats.size < readbytes + 1) {
      console.log(
        "Hehe I am much faster than your writer..! I will sleep for a while, I deserve it!"
      );
      setTimeout(() => readsome(socket, file, readbytes), 3000);
    } else {
      fs.read(
        file.descriptor,
        new Buffer.alloc(bite_size),
        0,
        bite_size,
        readbytes,
        (err, bytecount, buff) =>
          processsome(err, bytecount, buff, socket, file, readbytes)
      );
    }
  } catch (err) {
    console.log(err);
  }
}

function processsome(err, bytecount, buff, socket, file, readbytes) {
  if (err) {
    console.log(err);
    socket.emit("read-failed", { err });
    return;
  }
  console.log("Read ", bytecount, " and will process it now.");

  // Here we will process our incoming data:
  // Do whatever you need. Just be careful about not using beyond the bytecount in buff.
  console.log(buff.toString("utf-8", 0, bytecount));
  socket.emit("data-received", {
    data: buff.toString("utf-8", 0, bytecount),
    filePath: file.path,
  });
  // So we continue reading from where we left:
  readbytes += bytecount;
  process.nextTick(() => readsome(socket, file, readbytes));
}

io.on("connection", (socket) => {
  filePath = socket.handshake.query.filepath;
  console.log("User connected");
  let file, readbytes;
  try {
    fs.open(`logs/${filePath}`, "r", function (err, fd) {
      if (err) {
        socket.emit("wrong-filepath");
      } else {
        file = {
          path: filePath,
          descriptor: fd,
        };
        readbytes = 0;
        readsome(socket, file, readbytes);
      }
    });
    socket.emit("user-connected");
  } catch (ex) {
    socket.emit("wrong-filepath");
  }

  socket.on("disconnect", () => {
    fs.close(file.de);
    console.log("User disconnected");
    readbytes = 0;
    file = null;
  });
});

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
