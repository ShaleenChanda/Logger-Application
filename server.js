const express = require("express"); // import the Express.js module
const http = require("http"); // import the built-in Node.js http module
const app = express(); // create an instance of the Express application
const server = http.Server(app); // create a Node.js HTTP server instance and pass the Express app as argument
const io = require("socket.io")(server); // import and initialize Socket.io with the server instance
const fs = require("fs"); // import the built-in Node.js file system module

let bite_size = 256; // set the size of the data chunk to read from the file

app.set("view engine", "ejs"); // set the view engine to use EJS templates
app.use(express.static("public")); // serve static files from the "public" folder

app.get("/", (req, res) => { // set up a route for the root URL
  res.render("index"); // render the index.ejs template
});


// This function reads a chunk of data from a file and emits it to the client
function readsome(socket, file, readbytes) {
  try {
    var stats = fs.fstatSync(file.descriptor); // get information about the file
    if (stats.size < readbytes + 1) { // if the file size is smaller than the next read position, wait for 3 seconds
    //  console.log(
        "Hehe I am much faster than your writer..! I will sleep for a while, I deserve it!"
    //  );
      setTimeout(() => readsome(socket, file, readbytes), 3000); // call readsome function after 3 seconds
    } else { // otherwise read the next chunk of data
      fs.read(
        file.descriptor,
        new Buffer.alloc(bite_size), // create a new buffer to hold the data
        0,
        bite_size,
        readbytes,
        (err, bytecount, buff) =>
          processsome(err, bytecount, buff, socket, file, readbytes) // call the processsome function with the read data
      );
    }
  } catch (err) {
    console.log(err); // log any errors that occur
  }
}

// This function processes the received data and emits it to the client
function processsome(err, bytecount, buff, socket, file, readbytes) {
  if (err) {
    console.log(err); // log any errors that occur
    socket.emit("read-failed", { err }); // emit a 'read-failed' event to the client with the error object
    return;
  }
 // console.log("Read ", bytecount, " and will process it now.");

  // Here we will process our incoming data:
  // Do whatever you need. Just be careful about not using beyond the bytecount in buff.
  //console.log(buff.toString("utf-8", 0, bytecount)); // convert the buffer to a string and log it
  socket.emit("data-received", { // emit a 'data-received' event to the client with the data and file path
    data: buff.toString("utf-8", 0, bytecount),
    filePath: file.path,
  });
  // So we continue reading from where we left:
  readbytes += bytecount; // update the readbytes counter
  process.nextTick(() => readsome(socket, file, readbytes)); // call readsome function asynchronously to read the next chunk of data
}

// When a new client connects to the server through a socket, this event listener is triggered
io.on("connection", (socket) => {

  console.log(socket.id);

  // Get the filepath from the query parameters sent by the client
  filePath = socket.handshake.query.filepath;

  // Log that a new user has connected
  console.log("User connected");

  
  // Initialize variables to hold the file descriptor and the number of bytes already read
  // we could have initialize these variable globally but we wanted this application to support multiple clients thus every socket connection ie every client will havew their own
  // file name and amount of sized they already listened thus making our application to support multiple clients
  let file, readbytes;

  // Try to open the file with the specified filepath in read mode
  try {
    fs.open(`logs/${filePath}`, "r", function (err, fd) {

      // If there was an error opening the file, emit an event to the client indicating that the filepath was incorrect
      if (err) {
        socket.emit("wrong-filepath");

      // If the file was successfully opened, save the file descriptor and start reading data from the file
      } else {
        file = {
          path: filePath,
          descriptor: fd,
        };
        readbytes = 0; //here we pass readbyte size as zero but if we only want to get the new data we can set readbyte to the size of the file thus only new
        // changes will appear on client side
       // console.log(1);
        readsome(socket, file, readbytes);
      }
    });

        //console.log(2);
    // Emit an event to the client indicating that the connection was successful
    socket.emit("user-connected");

  // If there was an error opening the file, emit an event to the client indicating that the filepath was incorrect
  } catch (ex) {
    socket.emit("wrong-filepath");
  }

  // When the client disconnects, close the file descriptor and reset the readbytes and file variables
  socket.on("disconnect", () => {
    console.log(`user with socket ID: ${socket.id} is disconnected`);
    fs.close(file.descriptor);
    console.log("User disconnected");
    // readbytes = 0;
    // file = null;
  });

  
  socket.on("paused", ()=>{
    console.log(`user with socket ID ${socket.id} paused his stream`);
  })
});



// Start the server and listen on port 3000
server.listen(8080, () => {
  console.log("Server listening on port 3000");
});