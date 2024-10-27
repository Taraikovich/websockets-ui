type Room = {
  roomId: string;
  roomUsers: { name: string; index: string }[];
};

export const rooms: Room[] = [];
