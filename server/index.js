import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import path from "path";
import fs from "fs/promises";

const port = process.env.PORT || 3000;

const app = express();
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Content-Type,Accept",
  );
  next();
});
app.use(express.json());

app.get("/api/v1/hello", (req, res) => {
  res.json({ message: "Hello World!" });
});

const httpServer = createServer(app);
const io = new Server(httpServer);

const fogOfWars = {};
let currentImage = "";

io.on("connection", (socket) => {
  console.log("A user connected");
  console.log(fogOfWars, currentImage);
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });

  if (fogOfWars[currentImage]) {
    setTimeout(
      () => socket.emit("fow-broadcast", fogOfWars[currentImage]),
      100,
    );
  }

  socket.on("new-fow", (msg) => {
    fogOfWars[currentImage] = msg;
    io.emit("fow-broadcast", msg);
  });

  socket.on("loaded", () => {
    if (fogOfWars[currentImage]) {
      socket.emit("fow-broadcast", fogOfWars[currentImage]);
    }
  });
});

app.post("/api/new-image", async (req, res) => {
  const newImage = req.body.path;
  currentImage = newImage;

  try {
    await fs.copyFile(
      newImage,
      path.join(path.resolve(), assetPath(), "current_image"),
    );
  } catch (e) {
    console.log(e);
  }

  io.emit("new-image", "new image");

  res.json({ body: req.body });
});

const homepageRouter = express.Router();

const environment = process.env.NODE_ENV;
const assetPath = () => (environment === "production" ? "dist" : "public");

homepageRouter.get("/", async (req, res) => {
  const data = {
    environment,
    manifest: await parseManifest(),
  };

  res.render("index.html.ejs", data);
});

homepageRouter.get("/image", async (req, res) => {
  res.sendFile(path.join(path.resolve(), assetPath(), "current_image"));
});

const parseManifest = async () => {
  if (environment !== "production") return {};

  const manifestPath = path.join(path.resolve(), "dist", "manifest.json");
  const manifestFile = await fs.readFile(manifestPath);

  return JSON.parse(manifestFile.join(""));
};

app.use(homepageRouter);

fs.copyFile(
  path.join(path.resolve(), assetPath(), "current_image.bkp"),
  path.join(path.resolve(), assetPath(), "current_image"),
).then(() =>
  httpServer.listen(port, () => {
    console.log("listening on *:3000");
  }),
);
