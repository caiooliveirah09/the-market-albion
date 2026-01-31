import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';
import priceRoutes from './routes/prices';
import opportunityRoutes from './routes/opportunities';
import itemRoutes from './routes/items';
import { initDatabase } from './db/init';

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;
app.use(express.json({ limit: '100mb' }));


app.use('/api/prices', priceRoutes);

console.log("ola")
// Middleware
app.use(cors());
app.use(express.json({ limit: '10000mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/items', itemRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket setup for real-time notifications
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Export WebSocket server for broadcasting updates
export { wss };

// Initialize database and start server
async function start() {
  try {
    await initDatabase();
    console.log('✓ Database initialized');
    
    server.listen(PORT, () => {
      console.log(`✓ Backend server running on http://localhost:${PORT}`);
      console.log(`✓ WebSocket server available at ws://localhost:${PORT}/ws`);
    });
    
    // Start polling AODP API in background
    // startAODPPoller();
    console.log('✓ AODP API poller started');
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
