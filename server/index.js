const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support big Base64 profile pics

// Memory store for user cloud synchronization
const userSyncData = new Map();

// Cloud sync endpoints
app.post('/api/sync/save', (req, res) => {
  const { googleId, username, profilePic, playlists, hiddenSongs } = req.body;
  if (!googleId) {
    return res.status(400).json({ error: 'Missing googleId' });
  }
  userSyncData.set(googleId, {
    username,
    profilePic,
    playlists,
    hiddenSongs
  });
  res.status(200).json({ success: true });
});

app.get('/api/sync/load/:googleId', (req, res) => {
  const { googleId } = req.params;
  const data = userSyncData.get(googleId) || {};
  res.status(200).json(data);
});

// YouTube Scraping CORS Proxy endpoints for Web visitors
app.get('/api/youtube/search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Missing query' });
  }
  try {
    const targetQuery = q + ' audio';
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(targetQuery)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await response.text();
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/youtube/trending', async (req, res) => {
  try {
    const url = 'https://www.youtube.com/feed/trending?bp=4gINGAEyBHRleHQ%3D';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await response.text();
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve Vite frontend production build statically
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});
app.use(express.static(path.join(__dirname, '../dist')));

// Keep-alive endpoint
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Debug endpoint to list files in dist
app.get('/api/debug-dist', (req, res) => {
  const fs = require('fs');
  const distPath = path.join(__dirname, '../dist');
  try {
    if (!fs.existsSync(distPath)) {
      return res.json({ error: 'dist folder does not exist', path: distPath });
    }
    const files = fs.readdirSync(distPath);
    const assetsPath = path.join(distPath, 'assets');
    let assets = [];
    if (fs.existsSync(assetsPath)) {
      assets = fs.readdirSync(assetsPath);
    }
    res.json({ files, assets, __dirname, resolved: distPath });
  } catch (err) {
    res.json({ error: err.message });
  }
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
  socket.on('create_party', ({ username } = {}) => {
    const partyId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const name = username || 'Guest';
    parties.set(partyId, {
      host: socket.id,
      members: [{ id: socket.id, name }],
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
  socket.on('join_party', ({ partyId, username }) => {
    const party = parties.get(partyId);
    if (party) {
      if (party.members.length >= 8) {
        socket.emit('error', { message: 'The party is full (max 8 people).' });
        return;
      }
      const name = username || 'Guest';
      party.members.push({ id: socket.id, name });
      socket.join(partyId);
      
      // Notify everyone
      io.to(partyId).emit('member_joined', { 
        membersCount: party.members.length,
        members: party.members,
        joinedName: name
      });
      
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
      const memberIndex = party.members.findIndex(m => m.id === socket.id);
      if (memberIndex !== -1) {
        const leftName = party.members[memberIndex].name;
        party.members.splice(memberIndex, 1);
        
        if (party.host === socket.id) {
          // Host left, disband party
          io.to(partyId).emit('party_disbanded');
          parties.delete(partyId);
          console.log(`Party ${partyId} disbanded because host left.`);
        } else {
          // Guest left
          io.to(partyId).emit('member_left', { 
            membersCount: party.members.length,
            members: party.members,
            leftName
          });
        }
      }
    });
  });
});

// Fallback wildcard to support React Routing
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Listen Together Server running on port ${PORT}`);
});
