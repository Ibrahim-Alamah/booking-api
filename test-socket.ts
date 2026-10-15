import { io } from 'socket.io-client';

const socket = io('http://localhost:4000');

socket.on('connect', () => {
  console.log('Connected to WebSocket server:', socket.id);
});

socket.on('slot.booked', (data) => {
  console.log('\n[EVENT RECEIVED] slot.booked:');
  console.log(data);
});

socket.on('slot.released', (data) => {
  console.log('\n[EVENT RECEIVED] slot.released:');
  console.log(data);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

console.log('Listening for Socket.io events...');
