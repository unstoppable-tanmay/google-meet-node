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

  audio: boolean;
  video: boolean;
  screen: boolean;

  hand: boolean;
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
  hostManagement: boolean;
  shareScreen: boolean;
  sendChatMessage: boolean;
  sendReaction: boolean;
  turnOnMic: boolean;
  turnOnVideo: boolean;
  hostMustJoinBeforeAll: boolean;
  access: "open" | "trusted";
};

export type AdminType = {
  name: string;
  email: string;
  image?: string;
};

export type MeetTransactType = {
  peers: PeerDetailsType[];
  admin: AdminType;
  settings: RoomSettings;
  started: boolean;
  expire: number;
};

export type MeetType = {
  [roomId: string]: {
    router: Router | null;
    peers: PeerDetailsType[];
    raisedPeers: PeerDetailsType[];
    askingpeers: PeerDetailsType[];
    allowedPeers: PeerDetailsType[];
    admin: AdminType;
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
