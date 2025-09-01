export type ClientToServer =
  | { type: "auth"; uuid: string; name: string; roles?: string[]; accountType?: string }
  | { type: "ping" };

export type ServerToClient =
  | { type: "auth.ok"; uuid: string }
  | { type: "user.join"; uuid: string; name: string; accountType: string }
  | { type: "user.leave"; uuid: string }
  | { type: "pong" };

export interface ConnectionState {
  uuid: string;
  name: string;
  roles: string[];
  accountType: string;
  lastSeen: number;
  isAlive: boolean;
}
