import { Socket } from "socket.io";
import { meets, peers } from "../data/data";
import { Namespace } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { PeerDetailsType, RoomSettings, UserType } from "../types/types";

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
      if (meets[data.roomName]) {
        console.log(data.user, data.roomName);
        const admins = meets[data.roomName].peers
          .filter((e) => e.email == meets[data.roomName].admin.email)
          .filter((e) => e.socketId)
          .map((e) => e.socketId!);

        connections
          .to(admins)
          .timeout(60000)
          .emit(
            "asking-join",
            { user: data.user },
            (err: any, responses: any) => {
              callback(responses[0]);
            }
          );
      }
    }
  );

  // switch to here
  socket.on(
    "switch-here",
    async ({ roomName, socketId }: { roomName: string; socketId: string }) => {
      if (meets[roomName]) {
        const oldSocketId = meets[roomName].peers.find(
          (e) => e.email == meets[roomName].admin.email
        )?.socketId;

        if (oldSocketId) socket.to(oldSocketId).emit("switching-to-another");
      }
    }
  );

  // Message Event
  socket.on(
    "message",
    (data: { user: PeerDetailsType; roomName: string; message: string }) => {
      connections.to(data.roomName).emit("message", data);
    }
  );

  // Room User Update
  socket.on(
    "user-update",
    ({
      socketId,
      roomName,
      data,
    }: {
      socketId: string;
      data: Partial<PeerDetailsType>;
      roomName: string;
    }) => {
      if (socketId && data && roomName) {
        meets[roomName].peers = meets[roomName].peers.map((e) => {
          if (e.socketId == socketId) {
            return { ...e, ...data };
          } else return e;
        });

        socket
          .to(meets[roomName].peers.map((e) => e.socketId!))
          .emit("meet-update", { meet: meets[roomName] });
      }
    }
  );

  // Room Setting Update
  socket.on(
    "setting-update",
    ({ roomName, data }: { data: Partial<RoomSettings>; roomName: string }) => {
      if (data && roomName) {
        meets[roomName].settings = { ...meets[roomName].settings, ...data };

        socket
          .to(meets[roomName].peers.map((e) => e.socketId!))
          .emit("meet-update", { meet: meets[roomName] });
      }
    }
  );
};
