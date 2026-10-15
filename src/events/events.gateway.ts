import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  notifySlotBooked(slotId: string, bookingId: string) {
    this.server.emit('slot.booked', {
      slotId,
      bookingId,
      available: false,
    });
  }

  notifySlotReleased(slotId: string, bookingId: string) {
    this.server.emit('slot.released', {
      slotId,
      bookingId,
      available: true,
    });
  }
}
