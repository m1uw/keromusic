const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// Keep-alive endpoint
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

const server = http.createServer(app);

// Initialize Socket.io with CORS enabled for any frontend client
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store active parties
const parties = new Map();
// parties[partyId] = { host: socketId, members: [socketIds], state: { isPlaying, currentTrack, progress, timestamp } }

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create a new Party
  socket.on('create_party', () => {
    const partyId = Math.random().toString(36).substring(2, 8).toUpperCase();
    parties.set(partyId, {
      host: socket.id,
      members: [socket.id],
      state: {
        isPlaying: false,
        currentTrack: null,
        progress: 0,
        timestamp: Date.now()
      }
    });
    socket.join(partyId);
    socket.emit('party_created', { partyId });
    console.log(`Party ${partyId} created by ${socket.id}`);
  });

  // Join an existing Party
  socket.on('join_party', (partyId) => {
    const party = parties.get(partyId);
    if (party) {
      if (party.members.length >= 8) {
        socket.emit('error', { message: 'The party is full (max 8 people).' });
        return;
      }
      party.members.push(socket.id);
      socket.join(partyId);
      
      // Notify everyone
      io.to(partyId).emit('member_joined', { membersCount: party.members.length });
      
      // Sync the new member with the current host state
      socket.emit('sync_state', party.state);
      console.log(`User ${socket.id} joined party ${partyId}`);
    } else {
      socket.emit('error', { message: 'Party not found or expired.' });
    }
  });

  // Host updates the playback state
  socket.on('update_state', ({ partyId, state }) => {
    const party = parties.get(partyId);
    if (party && party.host === socket.id) {
      party.state = { ...state, timestamp: Date.now() };
      // Broadcast to everyone else in the room
      socket.to(partyId).emit('sync_state', party.state);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Find if user was in any party
    parties.forEach((party, partyId) => {
      if (party.members.includes(socket.id)) {
        party.members = party.members.filter(id => id !== socket.id);
        
        if (party.host === socket.id) {
          // Host left, disband party
          io.to(partyId).emit('party_disbanded');
          parties.delete(partyId);
          console.log(`Party ${partyId} disbanded because host left.`);
        } else {
          // Guest left
          io.to(partyId).emit('member_left', { membersCount: party.members.length });
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Listen Together Server running on port ${PORT}`);
});
