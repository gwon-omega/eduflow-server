import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";

export class SocketService {
  private io: SocketIOServer | null = null;
  private userSocketMap: Map<string, string[]> = new Map();

  /**
   * Initialize Socket.IO with a given HTTP server
   */
  init(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*", // Standardized to match app.ts CORS policies in production
        methods: ["GET", "POST"]
      },
      pingInterval: 25000, // 25 seconds
      pingTimeout: 5000,   // 5 seconds - detect mobile drops faster
      connectTimeout: 10000 // 10 seconds
    });

    this.io.on("connection", (socket: Socket) => {
      const userId = socket.handshake.auth.userId;

      if (userId) {
        console.log(`[Socket] User ${userId} connected (${socket.id})`);
        this.addSocketToUser(userId, socket.id);

        socket.on("disconnect", () => {
          console.log(`[Socket] User ${userId} disconnected (${socket.id})`);
          this.removeSocketFromUser(userId, socket.id);
        });

        // Resilience: Handle ping/pong or other events if needed
      } else {
        console.warn(`[Socket] Connection attempt without userId (${socket.id})`);
        socket.disconnect();
      }
    });

    console.log("✅ Socket.IO service initialized");
  }

  private addSocketToUser(userId: string, socketId: string) {
    const existing = this.userSocketMap.get(userId) || [];
    this.userSocketMap.set(userId, [...existing, socketId]);
  }

  private removeSocketFromUser(userId: string, socketId: string) {
    const existing = this.userSocketMap.get(userId) || [];
    const filtered = existing.filter(id => id !== socketId);
    if (filtered.length === 0) {
      this.userSocketMap.delete(userId);
    } else {
      this.userSocketMap.set(userId, filtered);
    }
  }

  /**
   * Emit an event to a specific user across all their active sessions/tabs
   */
  emitToUser(userId: string, event: string, data: any) {
    const sockets = this.userSocketMap.get(userId);
    if (sockets && this.io) {
      sockets.forEach(socketId => {
        this.io?.to(socketId).emit(event, data);
      });
      return true;
    }
    return false;
  }

  /**
   * Broadcast an event to all connected clients
   */
  broadcast(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }
}

export default new SocketService();
