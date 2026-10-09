import path from "path";
import express from "express";
import app from "./artifacts/api-server/src/app";

const publicDir = path.join(process.cwd(), "public");

app.use(express.static(publicDir, { index: false }));

app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.sendFile(path.join(publicDir, "index.html"), (err) => {
    if (err) {
      res.status(500).send("Portfolio build is missing");
    }
  });
});

export default app;
