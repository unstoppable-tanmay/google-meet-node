import {
  Consumer,
  Producer,
  Router,
  Transport,
} from "mediasoup/node/lib/types";
import { Socket } from "socket.io";

export type PeerDetailsType = {
  id?: string;
  name: string;
  socketId: string;
  isAdmin: boolean;

  audio: boolean;
  video: boolean;
  screen: boolean;

  effect: string;
};

export type PeersType = {
  [socketId: string]: {
    roomName: string;
    socket: Socket;
    transports: string[];
    producers: string[];
    consumers: string[];
    peerDetails: PeerDetailsType;
  };
};

export type Settings = {
  shareScreen: boolean;
  sendChatMessage: boolean;
  sendReaction: boolean;
  turnOnMic: boolean;
  turnOnVideo: boolean;
  hostMustJoinBeforeAll: boolean;
  access: "open" | "trusted";
};

export type MessageType = {
  roomName: string;
  socketId: string;
  message: string;
};

export type MeetType = {
  [roomId: string]: {
    router: Router;
    peers: string[];
    settings: Settings;
    message?: MessageType[];
  };
};

export type TransportType = {
  socketId: string;
  roomName: string;
  transport: Transport;
  consumer: Consumer;
};

export type ProducerType = {
  socketId: string;
  roomName: string;
  producer: Producer;
};

export type ConsumerType = {
  socketId: string;
  roomName: string;
  consumer: Consumer;
};
