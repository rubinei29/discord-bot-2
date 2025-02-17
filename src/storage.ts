import { Lobby, LobbyMember, QueueMember } from "./shared/schema";

export interface IStorage {
  // Lobby operations
  createLobby(channelId: string): Promise<Lobby>;
  getLobby(id: number): Promise<Lobby | undefined>;
  getActiveLobbyByChannel(channelId: string): Promise<Lobby | undefined>;
  getActiveLobbies(): Promise<Lobby[]>;
  
  // Lobby member operations
  addMemberToLobby(lobbyId: number, userId: string): Promise<LobbyMember>;
  removeMemberFromLobby(lobbyId: number, userId: string): Promise<void>;
  getLobbyMembers(lobbyId: number): Promise<LobbyMember[]>;
  updateMemberTimeout(lobbyId: number, userId: string, expiry: Date): Promise<void>;
  
  // Queue operations
  addToQueue(lobbyId: number, userId: string): Promise<QueueMember>;
  removeFromQueue(lobbyId: number, userId: string): Promise<void>;
  getQueueForLobby(lobbyId: number): Promise<QueueMember[]>;
  updateQueueMemberTimeout(lobbyId: number, userId: string, expiry: Date): Promise<void>;
  rotateQueue(lobbyId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private lobbies: Map<number, Lobby>;
  private lobbyMembers: Map<number, LobbyMember[]>;
  private queueMembers: Map<number, QueueMember[]>;
  private currentId: number;

  constructor() {
    this.lobbies = new Map();
    this.lobbyMembers = new Map();
    this.queueMembers = new Map();
    this.currentId = 1;
  }

  async createLobby(channelId: string): Promise<Lobby> {
    const id = this.currentId++;
    const lobby: Lobby = { id, channelId, active: true };
    this.lobbies.set(id, lobby);
    this.lobbyMembers.set(id, []);
    this.queueMembers.set(id, []);
    return lobby;
  }

  async getLobby(id: number): Promise<Lobby | undefined> {
    return this.lobbies.get(id);
  }

  async getActiveLobbyByChannel(channelId: string): Promise<Lobby | undefined> {
    return Array.from(this.lobbies.values()).find(
      (lobby) => lobby.channelId === channelId && lobby.active
    );
  }

  async getActiveLobbies(): Promise<Lobby[]> {
    return Array.from(this.lobbies.values()).filter((lobby) => lobby.active);
  }

  async addMemberToLobby(lobbyId: number, userId: string): Promise<LobbyMember> {
    const members = this.lobbyMembers.get(lobbyId) || [];
    const member: LobbyMember = { id: this.currentId++, lobbyId, userId, timeoutExpiry: null };
    members.push(member);
    this.lobbyMembers.set(lobbyId, members);
    return member;
  }

  async removeMemberFromLobby(lobbyId: number, userId: string): Promise<void> {
    const members = this.lobbyMembers.get(lobbyId) || [];
    this.lobbyMembers.set(
      lobbyId,
      members.filter((m) => m.userId !== userId)
    );
  }

  async getLobbyMembers(lobbyId: number): Promise<LobbyMember[]> {
    return this.lobbyMembers.get(lobbyId) || [];
  }

  async updateMemberTimeout(lobbyId: number, userId: string, expiry: Date): Promise<void> {
    const members = this.lobbyMembers.get(lobbyId) || [];
    const member = members.find((m) => m.userId === userId);
    if (member) {
      member.timeoutExpiry = expiry;
    }
  }

  async addToQueue(lobbyId: number, userId: string): Promise<QueueMember> {
    const queue = this.queueMembers.get(lobbyId) || [];
    const position = queue.length + 1;
    const member: QueueMember = {
      id: this.currentId++,
      lobbyId,
      userId,
      position,
      timeoutExpiry: null,
    };
    queue.push(member);
    this.queueMembers.set(lobbyId, queue);
    return member;
  }

  async removeFromQueue(lobbyId: number, userId: string): Promise<void> {
    const queue = this.queueMembers.get(lobbyId) || [];
    this.queueMembers.set(
      lobbyId,
      queue.filter((m) => m.userId !== userId)
    );
  }

  async getQueueForLobby(lobbyId: number): Promise<QueueMember[]> {
    return this.queueMembers.get(lobbyId) || [];
  }

  async updateQueueMemberTimeout(lobbyId: number, userId: string, expiry: Date): Promise<void> {
    const queue = this.queueMembers.get(lobbyId) || [];
    const member = queue.find((m) => m.userId === userId);
    if (member) {
      member.timeoutExpiry = expiry;
    }
  }

  async rotateQueue(lobbyId: number): Promise<void> {
    const queue = this.queueMembers.get(lobbyId) || [];
    if (queue.length > 0) {
      queue.shift();
      queue.forEach((member, index) => {
        member.position = index + 1;
      });
      this.queueMembers.set(lobbyId, queue);
    }
  }
}

export const storage = new MemStorage();
