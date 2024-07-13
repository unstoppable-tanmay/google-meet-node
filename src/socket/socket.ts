import { Namespace } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

import {
  worker,
  meets,
  peers,
  consumers,
  producers,
  transports,
  setconsumers,
  setproducers,
  settransports,
} from "../data/data";
import { PeerDetailsType, RoomSettings } from "../types/types";
import { Router } from "mediasoup/node/lib/Router";
import { mediaCodecs } from "../constants/mediaCodecs";
import { mediaEvents } from "./media-events";
import { manageEvents } from "./manage-events";

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
    mediaEvents(socket);

    // manage all events
    manageEvents(socket, connections);

    socket.on("start-meet", () => {
      socket.emit("connection-success", {
        socketId: socket.id,
      });
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
      console.log(socket.id + " disconnected");

      setconsumers(removeItems(consumers, socket.id, "consumer"));
      setproducers(removeItems(producers, socket.id, "producer"));
      settransports(removeItems(transports, socket.id, "transport"));

      if (peers[socket.id]) {
        const { roomName } = peers[socket.id];
        delete peers[socket.id];

        // remove socket from room
        meets[roomName] = {
          ...meets[roomName],
          peers: meets[roomName]?.peers?.filter(
            (peer) => peer.socketId !== socket.id
          ),
        };

        socket
          .to(meets[roomName].peers.map((e) => e.socketId!))
          .emit("meet-update", { meet: meets[roomName] });
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

        socket.join(roomName);

        const router1 = await createRouter(
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

        socket.to(roomName).emit("new-join", {
          socketId: socket.id,
          peerDetails,
          meetDetails: meets[roomName],
        });

        // get Router RTP Capabilities
        const rtpCapabilities = router1.rtpCapabilities;

        // socket
        //   .to(roomName)
        //   .emit("room-update", meets[roomName] as MeetTransactType);

        // call callback from the client and send back the rtpCapabilities
        callback({ rtpCapabilities, meetDetails: meets[roomName] });
      }
    );

    const createRouter = async (
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
        };
      } else {
        router1 = await worker.createRouter({
          mediaCodecs,
          appData: { roomName },
        });
        meets[roomName] = {
          ...meets[roomName],
          router: router1,
          started: true,
          peers: [...meets[roomName].peers, peerDetails],
        };
      }

      return router1;
    };
  });
};
