import express from "express";

import { validate, schedule } from "node-cron";
import { config } from "dotenv";

var cors = require("cors");
const app = express();

const https = require("httpolyglot");
import fs from "fs";

import { Server } from "socket.io";
import { createWorker } from "./lib/worker";
import { socketInit } from "./socket/socket";

import { apis } from "./routes/apis";
import {
  consumers,
  meets,
  peers,
  producers,
  setconsumers,
  setmeets,
  setpeers,
  setproducers,
  settransports,
  transports,
} from "./data/data";

// dotenv
config();

const port = process.env.PORT || 4000;

// middleware
app.use(
  cors({
    origin: [process.env.FRONTEND_URL ?? ""],
    credentials: true, //access-control-allow-credentials:true
    optionSuccessStatus: 200,
  })
);
app.use(express.json());

// paths
app.use("/api", apis);

// SSL cert for HTTPS access
const options = {
  // key: fs.readFileSync("./src/ssl/key.pem", "utf-8"),
  // cert: fs.readFileSync("./src/ssl/cert.pem", "utf-8"),
};

const httpsServer = https.createServer(options, app);

httpsServer.listen(port, () => {
  console.log("listening on port: " + port);
});

const io = new Server(httpsServer, {
  cors: { origin: [process.env.FRONTEND_URL ?? ""], credentials: true },
});

// socket.io namespace (could represent a room?)
const connections = io.of("/mediasoup");

// We create a Worker as soon as our application starts
createWorker();

// sockets events called here
socketInit(connections);

schedule("*/10 * * * *", (time) => {
  console.log("Running room obserbe");
  for (const roomId of Object.keys(meets)) {
    console.log(meets);
    if (meets[roomId]?.peers?.length == 0 && meets[roomId]?.started) {
      console.log("closing room - ", roomId);
      meets[roomId].router?.close();
      for (const socketId in peers) {
        if (peers[socketId].roomName === roomId) {
          delete peers[socketId];
        }
      }
      transports.map((e) => {
        if (e.roomName == roomId) e.transport.close();
      });
      producers.map((e) => {
        if (e.roomName == roomId) e.producer.close();
      });
      consumers.map((e) => {
        if (e.roomName == roomId) e.consumer.close();
      });

      setTimeout(() => {
        delete meets[roomId];
      }, meets[roomId].expire);
    }
  }
});

// TODO this is for the time of not completed project after completion i have to remove it
const refreshServer = () => {
  setmeets({});
  setpeers({});
  setconsumers([]);
  setproducers([]);
  settransports([]);
};
validate("0 0 * * *") &&
  schedule("0 0 * * *", (time) => {
    console.log("Running server refresh job at midnight");
    refreshServer();
  });
