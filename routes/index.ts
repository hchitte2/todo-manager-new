import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  void req;
  res.json({
    message: "Express API server is running",
    frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  });
});

export default router;
