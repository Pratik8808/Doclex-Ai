import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import Lawayer from "./routes/Lawayer.Routes";
import User  from  "./routes/User.Routes"
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

app.use("/api/documents", User);   // USER
app.use("/api/lawyer", Lawayer);   // LAWYER
app.use("/api/ai", aiRoutes);      // AI


app.get('/', (req, res) => {
  res.send('Hello World! This is the root URL.');
});


export default app;
  