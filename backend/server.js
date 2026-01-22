const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");

// 🔹 Import Supabase-connected pool
const supabase = require("./supabaseClient");

dotenv.config();

/* -------------------- Routes -------------------- */
const authRoutes = require("./routes/auth");
const reportRoutes = require("./routes/reportRoutes");
const notificationRoutes = require("./routes/notifications");
const userRoutes = require("./routes/users");

const app = express();

/* -------------------- Upload folders -------------------- */
["uploads/images", "uploads/videos", "uploads/others"].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

/* -------------------- CORS -------------------- */
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://ireporter-phi.vercel.app",
  "https://ireporter-xafr.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow server-to-server

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);


/* -------------------- Middleware -------------------- */
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* -------------------- API Routes -------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);

/* -------------------- Health check -------------------- */
app.get("/", (_, res) => {
  res.send("API running... Socket.IO ready ✅");
});

/* ==================== SOCKET.IO ==================== */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  },
});


// Utility to log all rooms and users
const logActiveRooms = () => {
  const rooms = Array.from(io.sockets.adapter.rooms.entries())
    .filter(([room, sockets]) => !io.sockets.sockets.has(room)) // filter out individual sockets
    .map(([room, sockets]) => ({ room, sockets: Array.from(sockets) }));
  console.log("📡 Active Socket.IO rooms:", rooms);
};

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  // Register user to a room
  socket.on("register", (legacyId) => {
    if (!legacyId) return;

    const room = String(legacyId);
    socket.join(room);

    console.log(`🟢 User ${room} joined room (${socket.id})`);
    logActiveRooms(); // Show all active rooms
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
    logActiveRooms(); // Show remaining active rooms
  });
});

// Make io available in controllers
app.set("io", io);

/* -------------------- Supabase connection check -------------------- */
(async () => {
  const tables = ["users", "notifications", "reports"];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select("*").limit(1); // just fetch 1 row to test

    if (error) {
      console.error(
        `❌ Supabase connection failed for table '${table}':`,
        error.message
      );
    } else {
      console.log(
        `✅ Supabase connected successfully to '${table}', sample data:`,
        data
      );
    }
  }
})();

/* -------------------- Start server -------------------- */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
