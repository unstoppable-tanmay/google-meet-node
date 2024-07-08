import { Socket } from "socket.io";
import { meets } from "../data/data";
import { Namespace } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import {
  MeetTransactType,
  MeetType,
  PeerDetailsType,
  RoomSettings,
  UserType,
} from "../types/types";

export const manageEvents = (
  socket: Socket,
  connections: Namespace<
    DefaultEventsMap,
    DefaultEventsMap,
    DefaultEventsMap,
    any
  >
) => {
  // Asking For Join Event
  socket.on(
    "ask-join",
    async (data: { user: UserType; roomName: string }, callback) => {
      const admins = meets[data.roomName].peers
        .filter((e) => e.email == meets[data.roomName].admin.email)
        .filter((e) => e.socketId)
        .map((e) => e.socketId!);

      console.log("ask-join");

      connections
        .to(admins)
        .timeout(30000)
        .emit(
          "asking-join",
          { user: data.user },
          (err: any, responses: any) => {
            console.log(responses[0]);
          }
        );
    }
  );

  // Message Event
  socket.on("message", (data: { user: PeerDetailsType; roomName: string }) => {
    connections.to(data.roomName).emit("message", data);
  });

  // Room Settings Update
  socket.on(
    "room-update",
    ({ room, roomName }: { room: MeetTransactType; roomName: string }) => {
      meets[roomName] = { ...meets[roomName], ...room };
    }
  );

  
};
