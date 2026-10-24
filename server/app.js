import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// Render/Proxy aware secure-cookie handling in production
app.set('trust proxy', 1);

const fallbackClientOrigins = ['http://localhost:5173'];
const allowedOrigins = (process.env.CLIENT_URL || fallbackClientOrigins.join(','))
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser clients and same-origin requests with no origin header.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
  });
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Routes
import authRoutes from './routes/authRoutes.js';
import passwordRoutes from './routes/passwordRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/resume', resumeRoutes);

app.use((error, _req, res, _next) => {
  if (error?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'Resume PDF exceeds the 5 MB upload limit.',
    });
  }

  if (error?.message === 'Only PDF files are allowed') {
    return res.status(415).json({
      success: false,
      message: error.message,
    });
  }

  console.error('[http] unhandled request error', {
    errorName: error?.name || 'Error',
    message: error?.message || 'Unknown error',
  });

  return res.status(500).json({
    success: false,
    message: 'Request could not be completed.',
  });
});


export default app;
