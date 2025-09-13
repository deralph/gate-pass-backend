import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import authRouter from './routes/auth.js';
import carRouter from './routes/cars.js';
import adminRouter from './routes/admin.js';
import scanRouter from './routes/scans.js';
import userRouter from './routes/user.js';
import notificationRouter from './routes/notifications.js';

dotenv.config();


const app = express();

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());

// Mount routers
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/cars', carRouter);
app.use('/api/admin', adminRouter);
app.use('/api/scans', scanRouter);
app.use('/api/notifications', notificationRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error'
  });
});

// Handle unhandled routes
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

/* error handlers & 404 (unchanged) */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: "error", message: "Something went wrong!" });
});
app.use("*", (req, res) =>
  res.status(404).json({ status: "error", message: "Route not found" })
);

/* connect to mongo & start server (unchanged) */
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/aaua-security-system";
mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});