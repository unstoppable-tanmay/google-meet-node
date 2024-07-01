import { Namespace } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

import {
  worker,
  meets,
  peers,
  consumers,
  producers,
  transports,
  setmeets,
  setpeers,
  setconsumers,
  setproducers,
  settransports,
} from "../data/data";
import { PeerDetailsType, RoomSettings } from "../types/types";
import { Router } from "mediasoup/node/lib/Router";
import { mediaCodecs } from "../constants/mediaCodecs";
import { WebRtcTransport } from "mediasoup/node/lib/WebRtcTransport";
import { Transport } from "mediasoup/node/lib/Transport";
import { Consumer } from "mediasoup/node/lib/Consumer";
import { Producer } from "mediasoup/node/lib/Producer";
import { mediaEvents } from "./media-events";

export const socketInit = (
  connections: Namespace<
    DefaultEventsMap,
    DefaultEventsMap,
    DefaultEventsMap,
    any
  >
) => {
  connections.on("connection", async (socket) => {
    console.log(socket.id);

    // all mediasoup related events and transports
    mediaEvents(socket)

    socket.emit("connection-success", {
      socketId: socket.id,
    });

    const removeItems = (
      items: any[],
      socketId: string,
      type: "consumer" | "producer" | "transport"
    ) => {
      return items.filter((e) => e.socketId != socketId);
    };

    socket.on("disconnect", () => {
      // do some cleanup
      console.log(peers[socket.id].peerDetails.name + " disconnected");

      setconsumers(removeItems(consumers, socket.id, "consumer"));
      setproducers(removeItems(producers, socket.id, "producer"));
      settransports(removeItems(transports, socket.id, "transport"));

      if (peers[socket.id]) {
        const { roomName } = peers[socket.id];
        delete peers[socket.id];

        // remove socket from room
        meets[roomName] = {
          ...meets[roomName],
          peers: meets[roomName].peers!.filter(
            (peer) => peer.socketId !== socket.id
          ),
        };
      }
    });

    socket.on(
      "joinRoom",
      async (
        {
          roomName,
          peerDetails,
          roomSettings,
        }: {
          roomName: string;
          peerDetails: PeerDetailsType;
          roomSettings: RoomSettings;
        },
        callback
      ) => {
        // create Router if it does not exist
        // const router1 = rooms[roomName] && rooms[roomName].get('data').router || await createRoom(roomName, socket.id)
        if (!meets[roomName]) {
          socket.emit("room-not-exist", { message: "room not exist" });
          return;
        }

        const router1 = await createRoom(
          roomName,
          roomSettings,
          socket.id,
          peerDetails
        );

        peers[socket.id] = {
          socket,
          roomName, // Name for the Router this Peer joined
          transports: [],
          producers: [],
          consumers: [],
          peerDetails: peerDetails,
        };

        // get Router RTP Capabilities
        const rtpCapabilities = router1.rtpCapabilities;

        // call callback from the client and send back the rtpCapabilities
        callback({ rtpCapabilities });
      }
    );

    const createRoom = async (
      roomName: string,
      roomSettings: RoomSettings,
      socketId: string,
      peerDetails: PeerDetailsType
    ) => {
      // worker.createRouter(options)
      // options = { mediaCodecs, appData }
      // mediaCodecs -> defined above
      // appData -> custom application data - we are not supplying any
      // none of the two are required
      let router1: Router;
      // let peers: string[] = [];
      if (meets[roomName].router) {
        router1 = meets[roomName].router!;
        meets[roomName] = {
          ...meets[roomName],
          peers: [...meets[roomName].peers, peerDetails],
          // users: [...meets[roomName].users, peerDetails],
        };
      } else {
        router1 = await worker.createRouter({ mediaCodecs });
        meets[roomName] = {
          ...meets[roomName],
          router: router1,
          peers: [...meets[roomName].peers, peerDetails],
          // users: [...meets[roomName].users, peerDetails],
        };
      }

      // console.log(`Router ID: ${router1.id}`, peers.length);

      return router1;
    };
  });
};