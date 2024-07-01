
export const createRoomId = (roomIds: string[] = []): string => {
    let id = Array.from(
      { length: 10 },
      () => "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]
    )
      .map((c, i) => (i === 3 || i === 7 ? "-" + c : c))
      .join("");
  
    if (roomIds.includes(id)) return createRoomId(roomIds);
    else return id;
  };