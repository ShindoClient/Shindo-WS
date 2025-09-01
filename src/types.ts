export type AccountType = "MICROSOFT" | "OFFLINE";

export type ClientToServer =
    | { type: "auth"; uuid: string; name: string; accountType: AccountType; roles?: string[] }
    | { type: "ping" };

export type ServerToClient =
    | { type: "auth.ok"; uuid: string }
    | { type: "user.join"; uuid: string; name: string; accountType: AccountType }
    | { type: "user.leave"; uuid: string }
    | { type: "pong" };

export interface ConnectionState {
    uuid: string;
    name: string;
    roles: string[];
    accountType: AccountType;
    lastSeen: number;
    isAlive: boolean;
}
