import express from "express";
var cors = require("cors");
const app = express();

const https = require("httpolyglot");
import fs from "fs";
import path from "path";

import { Server } from "socket.io";
import { createWorker } from "./lib/worker";
import { socketInit } from "./socket/socket";

import { apis } from "./routes/apis";
import { meets } from "./data/data";

// middleware
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true, //access-control-allow-credentials:true
    optionSuccessStatus: 200,
  })
);
app.use(express.json());

// paths
app.use("/api", apis);

// SSL cert for HTTPS access
const options = {
  key: fs.readFileSync("./src/ssl/key.pem", "utf-8"),
  cert: fs.readFileSync("./src/ssl/cert.pem", "utf-8"),
};

const httpsServer = https.createServer(options, app);

httpsServer.listen(3003, () => {
  console.log("listening on port: " + 3003);
});

const io = new Server(httpsServer, {
  cors: { origin: ["http://localhost:3000"], credentials: true },
});

// socket.io namespace (could represent a room?)
const connections = io.of("/mediasoup");

// We create a Worker as soon as our application starts
createWorker();

// sockets events called here
socketInit(connections);

setInterval(() => {
  console.log(meets);
  for (const roomId of Object.keys(meets)) {
    if (meets[roomId].peers?.length == 0) {
      console.log("closing room - ", roomId);
      meets[roomId].router?.close();
      setTimeout(() => {
        delete meets[roomId];
      }, 5000);
    }
  }
}, 10000);
