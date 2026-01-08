// src/services/socket.js
import { io } from "socket.io-client";

const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL || "https://ireporter-xafr.onrender.com";

// Create the socket instance but do NOT auto-connect
const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ["websocket"],
  autoConnect: false,
});

// ✅ Connect safely, only once
socket.safeConnect = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export default socket;
