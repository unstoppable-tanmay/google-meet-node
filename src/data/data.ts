import {
  ConsumerType,
  MeetType,
  PeersType,
  ProducerType,
  TransportType,
} from "../types/types";
import { AppData } from "mediasoup-client/lib/types";
import { Worker } from "mediasoup/node/lib/Worker";

/**
 * Worker
 * |-> Router(s)
 *     |-> Producer Transport(s)
 *         |-> Producer
 *     |-> Consumer Transport(s)
 *         |-> Consumer
 **/
export let worker: Worker<AppData>;
export let meets: MeetType = {};
export let peers: PeersType = {};
export let transports: TransportType[] = [];
export let producers: ProducerType[] = [];
export let consumers: ConsumerType[] = [];

export const setworker = (setworker: Worker) => {
  worker = setworker;
};
export const setmeets = (setmeets: MeetType) => {
  meets = setmeets;
};
export const setpeers = (setpeers: PeersType) => {
  peers = setpeers;
};
export const settransports = (settransports: TransportType[]) => {
  transports = settransports;
};
export const setproducers = (setproducers: ProducerType[]) => {
  producers = setproducers;
};
export const setconsumers = (setconsumers: ConsumerType[]) => {
  consumers = setconsumers;
};
