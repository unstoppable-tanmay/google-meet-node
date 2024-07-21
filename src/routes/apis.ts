import { Router, Request, Response } from "express";
import { meets, peers, setmeets } from "../data/data";
import { createRoomId } from "../lib/roomId";

import z from "zod";
import { validate } from "../lib/helper";

export const apis = Router();

// Create Meet For Later
const createMeetForLeterSchema = z.object({
  user: z.object({
    name: z.string(),
    email: z.string().email(),
    image: z.string().optional(),
  }),
  settings: z.object({
    hostManagement: z.boolean(),
    shareScreen: z.boolean(),
    sendChatMessage: z.boolean(),
    sendReaction: z.boolean(),
    turnOnMic: z.boolean(),
    turnOnVideo: z.boolean(),
    hostMustJoinBeforeAll: z.boolean(),
    access: z.enum(["open", "trusted"]),
  }),
});
apis.post(
  "/createMeetForLeter",
  validate(createMeetForLeterSchema),
  (req: Request, res: Response) => {
    const data: z.infer<typeof createMeetForLeterSchema> = req.body;

    try {
      const id = createRoomId([...Object.keys(meets)]);

      meets[id] = {
        router: null,
        started: false,
        admin: {
          ...data.user,
        },
        allowedPeers: [],
        askingpeers: [],
        raisedPeers: [],
        expire: 2 * 60 * 60 * 1000,
        settings: data.settings,
        peers: [],
      };

      res
        .status(200)
        .json({ data: { id }, success: true, message: "Room Created" });
    } catch (error) {
      res
        .status(500)
        .json({ data: { error }, success: true, message: "Room Created" });
    }
  }
);

// Create Meet For Later With Schedule
const createMeetForLeterWithScheduleSchema = z.object({
  user: z.object({
    name: z.string(),
    email: z.string().email(),
    image: z.string().optional(),
  }),
  settings: z.object({
    hostManagement: z.boolean(),
    shareScreen: z.boolean(),
    sendChatMessage: z.boolean(),
    sendReaction: z.boolean(),
    turnOnMic: z.boolean(),
    turnOnVideo: z.boolean(),
    hostMustJoinBeforeAll: z.boolean(),
    access: z.enum(["open", "trusted"]),
  }),
  schedule: z.number(),
});
apis.post(
  "/createMeetForLeterWithSchedule",
  validate(createMeetForLeterWithScheduleSchema),
  (req: Request, res: Response) => {
    const data: z.infer<typeof createMeetForLeterWithScheduleSchema> = req.body;

    try {
      const id = createRoomId([...Object.keys(meets)]);

      meets[id] = {
        router: null,
        started: false,
        admin: {
          ...data.user,
        },
        allowedPeers: [],
        askingpeers: [],
        raisedPeers: [],
        expire: data.schedule,
        settings: data.settings,
        peers: [],
      };

      res
        .status(200)
        .json({ data: { id }, success: true, message: "Room Created" });
    } catch (error) {
      res
        .status(500)
        .json({ data: { error }, success: true, message: "Room Created" });
    }
  }
);

// Create Instant Meet
const createInstantMeetSchema = z.object({
  user: z.object({
    name: z.string(),
    email: z.string().email(),
    image: z.string().optional(),
  }),
  settings: z.object({
    shareScreen: z.boolean(),
    sendChatMessage: z.boolean(),
    sendReaction: z.boolean(),
    turnOnMic: z.boolean(),
    turnOnVideo: z.boolean(),
    hostMustJoinBeforeAll: z.boolean(),
    access: z.enum(["open", "trusted"]),
  }),
});
apis.post(
  "/createInstantMeet",
  validate(createInstantMeetSchema),
  (req: Request, res: Response) => {
    const data: z.infer<typeof createMeetForLeterSchema> = req.body;

    try {
      const id = createRoomId([...Object.keys(meets)]);

      meets[id] = {
        router: null,
        started: false,
        admin: {
          ...data.user,
        },
        allowedPeers: [],
        askingpeers: [],
        raisedPeers: [],
        expire: 1 * 60 * 60 * 1000,
        settings: data.settings,
        peers: [],
      };

      res
        .status(200)
        .json({ data: { id }, success: true, message: "Room Created" });
    } catch (error) {
      res
        .status(500)
        .json({ data: { error }, success: false, message: "Server Error" });
    }
  }
);

// Get The Meet Details
apis.get("/getMeetDetails", (req: Request, res: Response) => {
  const query = req.query as { roomId: string };

  try {
    if (!query.roomId)
      return res
        .status(200)
        .json({ data: null, success: false, message: "Params Error" });

    if (meets[query.roomId]) {
      res.json({ success: true, message: "Found", data: meets[query.roomId] });
    } else res.json({ success: false, message: "No Meet Found", data: null });
  } catch (error) {
    res
      .status(500)
      .json({ data: { error }, success: false, message: "Server Error" });
  }
});

// Is Meet Exist
apis.get("/isMeetExist", (req: Request, res: Response) => {
  const query = req.query as { roomId: string };

  try {
    if (!query.roomId)
      return res
        .status(200)
        .json({ data: null, success: false, message: "Params Error" });
    if (meets[query.roomId])
      return res
        .status(200)
        .json({ success: true, message: "Found", data: true });
    else res.json({ success: true, message: "No Meet Found", data: false });
  } catch (error) {
    res
      .status(500)
      .json({ data: { error }, success: false, message: "Server Error" });
  }
});
