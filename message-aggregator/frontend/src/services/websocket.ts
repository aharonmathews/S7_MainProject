// This file manages WebSocket connections for real-time message updates.

import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:8000'; // Replace with your backend URL

const socket = io(SOCKET_SERVER_URL);

export const subscribeToMessages = (callback) => {
    socket.on('message', (message) => {
        callback(message);
    });
};

export const sendMessage = (message) => {
    socket.emit('message', message);
};

export const disconnect = () => {
    socket.disconnect();
};