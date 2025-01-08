import express from 'express';
import cookieParser from 'cookie-parser';
import coreRouter from './routes/core.js';
import lessonRouter from './routes/lesson.js';

const app = express();

app.use(cookieParser());
app.use(express.json()); 

app.use("/api/core", coreRouter);
app.use("/api", lessonRouter);

const server = app.listen(process.env.PORT);

process.on("unhandledRejection", (error, promise) => {
    console.log(`Error occurred: ${error.message}`);
    server.close(() => {
        process.exit(1);
    });
});

process.on("uncaughtException", (error) => {
    console.log(`Uncaught exception: ${error.message}`);
    server.close(() => {
        process.exit(1);
    });
});
