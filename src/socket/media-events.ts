import { Socket } from "socket.io";

import {
  meets,
  peers,
  consumers,
  producers,
  transports,
  setconsumers,
  setproducers,
  settransports,
} from "../data/data";
import { WebRtcTransport } from "mediasoup/node/lib/WebRtcTransport";
import { Transport } from "mediasoup/node/lib/Transport";
import { Consumer } from "mediasoup/node/lib/Consumer";
import { Producer } from "mediasoup/node/lib/Producer";
import { Router } from "mediasoup/node/lib/types";
import { getIp, returnIps } from "../lib/getIp";

export const mediaEvents = (socket: Socket) => {
  // Client emits a request to create server side Transport
  // We need to differentiate between the producer and consumer transports
  socket.on("createWebRtcTransport", async ({ consumer }, callback) => {
    // get Room Name from Peer's properties
    const roomName = peers[socket.id].roomName;

    // get Router (Room) object this peer is in based on RoomName
    const router = meets[roomName].router!;

    createWebRtcTransport(router).then(
      (transport) => {
        const castedTransport = transport as WebRtcTransport;
        callback({
          params: {
            id: castedTransport.id,
            iceParameters: castedTransport.iceParameters,
            iceCandidates: castedTransport.iceCandidates,
            dtlsParameters: castedTransport.dtlsParameters,
          },
        });

        // add transport to Peer's properties
        addTransport(castedTransport, roomName, consumer);
      },
      (error) => {
        console.log(error);
      }
    );
  });

  const addTransport = (
    transport: WebRtcTransport,
    roomName: string,
    consumer: Consumer
  ) => {
    settransports([
      ...transports,
      { socketId: socket.id, transport, roomName, consumer },
    ]);

    peers[socket.id] = {
      ...peers[socket.id],
      transports: [...peers[socket.id].transports, transport.id],
    };
  };

  const addProducer = (producer: Producer, roomName: string) => {
    setproducers([...producers, { socketId: socket.id, producer, roomName }]);

    peers[socket.id] = {
      ...peers[socket.id],
      producers: [...peers[socket.id].producers, producer.id],
    };
  };

  const addConsumer = (consumer: Consumer, roomName: string) => {
    // add the consumer to the consumers list
    setconsumers([...consumers, { socketId: socket.id, consumer, roomName }]);

    // add the consumer id to the peers list
    peers[socket.id] = {
      ...peers[socket.id],
      consumers: [...peers[socket.id].consumers, consumer.id],
    };
  };

  socket.on("getProducers", (callback) => {
    //return all producer transports
    const { roomName } = peers[socket.id];

    let producerList: string[] = [];
    producers.forEach((producerData) => {
      if (
        producerData.socketId !== socket.id &&
        producerData.roomName === roomName
      ) {
        producerList = [...producerList, producerData.producer.id];
      }
    });

    // return the producer list back to the client
    callback(producerList);
  });

  const informConsumers = (roomName: string, socketId: string, id: string) => {
    console.log(`just joined, id ${id} ${roomName}, ${socketId}`);
    // A new producer just joined
    // let all consumers to consume this producer
    producers.forEach((producerData) => {
      if (
        producerData.socketId !== socketId &&
        producerData.roomName === roomName
      ) {
        const producerSocket = peers[producerData.socketId].socket;
        // use socket to send producer id to producer
        producerSocket.emit("new-producer", { producerId: id });
      }
    });
  };

  const getTransport = (socketId: string) => {
    const [producerTransport] = transports.filter(
      (transport) => transport.socketId === socketId && !transport.consumer
    );
    return producerTransport.transport;
  };

  // see client's socket.emit('transport-connect', ...)
  socket.on("transport-connect", ({ dtlsParameters }) => {
    console.log("DTLS PARAMS... ", { dtlsParameters });

    getTransport(socket.id).connect({ dtlsParameters });
  });

  // see client's socket.emit('transport-produce', ...)
  socket.on(
    "transport-produce",
    async ({ kind, rtpParameters, appData }, callback) => {
      // call produce based on the prameters from the client
      const producer = await getTransport(socket.id).produce({
        kind,
        rtpParameters,
        appData,
      });

      // add producer to the producers array
      const { roomName } = peers[socket.id];

      addProducer(producer, roomName);

      informConsumers(roomName, socket.id, producer.id);

      console.log("Producer ID: ", producer.id, producer.kind);

      producer.on("transportclose", () => {
        console.log("transport for this producer closed ");
        producer.close();
      });

      // Send back to the client the Producer's id
      callback({
        id: producer.id,
        producersExist: producers.length > 1 ? true : false,
      });
    }
  );

  // see client's socket.emit('transport-recv-connect', ...)
  socket.on(
    "transport-recv-connect",
    async ({ dtlsParameters, serverConsumerTransportId }) => {
      console.log(`DTLS PARAMS: ${dtlsParameters}`);
      const consumerTransport: Transport = transports.find(
        (transportData) =>
          transportData.consumer &&
          transportData.transport.id == serverConsumerTransportId
      )!.transport;
      await consumerTransport.connect({ dtlsParameters });
    }
  );

  socket.on(
    "consume",
    async (
      { rtpCapabilities, remoteProducerId, serverConsumerTransportId },
      callback
    ) => {
      try {
        const { roomName } = peers[socket.id];
        const router = meets[roomName].router!;
        let consumerTransport = transports.find(
          (transportData) =>
            transportData.consumer &&
            transportData.transport.id == serverConsumerTransportId
        )!.transport;
        const producer = producers.find(
          (e) => e.producer.id === remoteProducerId
        );
        console.log("Producer : ", producer);

        // check if the router can consume the specified producer
        if (
          router.canConsume({
            producerId: remoteProducerId,
            rtpCapabilities,
          })
        ) {
          // transport can now consume and return a consumer
          const consumer = await consumerTransport.consume({
            producerId: remoteProducerId,
            rtpCapabilities,
            paused: true,
            appData: producer?.producer.appData,
            // appData: {
            //   socketId: producers.find((e) => e.producer.id == remoteProducerId)
            //     ?.socketId,
            // },
          });

          consumer.on("transportclose", () => {
            console.log("transport close from consumer");
          });

          consumer.on("producerclose", () => {
            console.log("producer of consumer closed");
            socket.emit("producer-closed", { remoteProducerId });

            consumerTransport.close();
            let loctransports = transports.filter(
              (transportData) =>
                transportData.transport.id !== consumerTransport.id
            );
            settransports(loctransports);
            consumer.close();
            let locconsumers = consumers.filter(
              (consumerData) => consumerData.consumer.id !== consumer.id
            );
            setconsumers(locconsumers);
          });

          addConsumer(consumer, roomName);

          // from the consumer extract the following params
          // to send back to the Client
          const params = {
            id: consumer.id,
            producerId: remoteProducerId,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
            serverConsumerId: consumer.id,
            appData: consumer.appData,
          };

          // send the parameters to the client
          callback({ params });
        }
      } catch (error: any) {
        console.log(error.message);
        callback({
          params: {
            error: error,
          },
        });
      }
    }
  );

  socket.on("consumer-resume", async ({ serverConsumerId }) => {
    console.log("consumer resume");
    const { consumer } = consumers.find(
      (consumerData) => consumerData.consumer.id === serverConsumerId
    )!;
    await consumer.resume();
  });

  socket.on("consumer-pause", async ({ serverConsumerId }) => {
    console.log("consumer pause");
    const { consumer } = consumers.find(
      (consumerData) => consumerData.consumer.id === serverConsumerId
    )!;
    await consumer.pause();
  });
};

const createWebRtcTransport = async (router: Router) => {
  console.log(JSON.parse(process.env.LISTIN_IPS || "{}"));
  return new Promise(async (resolve, reject) => {
    try {
      // https://mediasoup.org/documentation/v3/mediasoup/api/#WebRtcTransportOptions
      const webRtcTransport_options = {
        listenIps: [
          // {
          //   ip: "0.0.0.0",
          //   announcedIp: getIp(),
          // },
          ...JSON.parse(process.env.LISTIN_IPS || "[]"),
          // ...returnIps()
        ],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
      };

      // https://mediasoup.org/documentation/v3/mediasoup/api/#router-createWebRtcTransport
      let transport = await router.createWebRtcTransport(
        webRtcTransport_options
      );
      console.log(`transport id: ${transport.id}`);

      transport.on("dtlsstatechange", (dtlsState) => {
        if (dtlsState === "closed") {
          transport.close();
        }
      });

      transport.on("@close", () => {
        console.log("transport closed");
      });

      resolve(transport);
    } catch (error) {
      reject(error);
    }
  });
};
