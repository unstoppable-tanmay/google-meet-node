import {
  Consumer,
  Producer,
  Router,
  Transport,
} from "mediasoup/node/lib/types";
import { Socket } from "socket.io";

export type PeerDetailsType = {
  socketId?: string;

  name: string;
  email: string;
  image?: string;

  isAdmin: boolean;

  audio?: boolean;
  video?: boolean;
  screen?: boolean;

  hand?: boolean;
  
  transports: string[];
  producers: string[];
  consumers: string[];
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

export type RoomSettings = {
  shareScreen: boolean;
  sendChatMessage: boolean;
  sendReaction: boolean;
  turnOnMic: boolean;
  turnOnVideo: boolean;
  hostMustJoinBeforeAll: boolean;
  access: "open" | "trusted";
};

export type ReserveMeetType = { roomId: string; schedule: number };

export type MeetType = {
  [roomId: string]: {
    router: Router | null;
    peers: PeerDetailsType[];
    allowedPeers: PeerDetailsType[];
    admin: PeerDetailsType;
    settings: RoomSettings;
    started: boolean;
    expire: number;
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

export type UserType =
  | {
      image?: string | undefined | null;
      name?: string | undefined | null;
      email?: string | undefined | null;
    }
  | undefined;
