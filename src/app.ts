import express from "express";
const app = express();

const https = require("httpolyglot");
import fs from "fs";
import path from "path";

import { Server } from "socket.io";
import { createWorker } from "./lib/worker";
import { socketInit } from "./socket/socket";

app.get("*", (req, res, next) => {
  const path = "/sfu/";

  if (req.path.indexOf(path) == 0 && req.path.length > path.length)
    return next();

  res.send(
    `You need to specify a room name in the path e.g. 'https://127.0.0.1/sfu/room'`
  );
});

app.use("/sfu/:room", express.static(path.join(__dirname, "public")));

// SSL cert for HTTPS access
const options = {
  key: fs.readFileSync("./src/ssl/key.pem", "utf-8"),
  cert: fs.readFileSync("./src/ssl/cert.pem", "utf-8"),
};

const httpsServer = https.createServer(options, app);
httpsServer.listen(3000, () => {
  console.log("listening on port: " + 3000);
});

const io = new Server(httpsServer);

// socket.io namespace (could represent a room?)
const connections = io.of("/mediasoup");

// We create a Worker as soon as our application starts
createWorker();

// sockets events called here
socketInit(connections)
