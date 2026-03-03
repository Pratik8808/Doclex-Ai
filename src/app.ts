import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import documentRoutes from "./routes/ document.routes";
import aiRoutes from "./routes/ai.routes"
import path from "path";
import { authenticate } from "./middleware/ auth.middleware";

const app = express();

app.use(cors());
app.use(express.json());

app.use(
  "/uploads",
  authenticate,
  express.static(path.join(__dirname, "../uploads"))
);

app.use("/api/auth", authRoutes);
app.use("/documents", documentRoutes);
app.use('/api/documents',aiRoutes)


app.get('/', (req, res) => {
  res.send('Hello World! This is the root URL.');
});


export default app;
  