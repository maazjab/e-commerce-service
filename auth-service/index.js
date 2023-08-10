const express = require("express");
const mongoose = require("mongoose");
const User = require("./User");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT_ONE || 7070;

mongoose
  .connect("mongodb://127.0.0.1:27017/auth-service", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Auth-service DB started"));

app.use(express.json());

app.post("/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  const userExist = User.findOne({ email });

  if (userExist)
    return res.status(400).json({ message: "User already exists" });

  const user = new User({
    name,
    email,
    password,
  });

  user.save();

  return res.json(user);
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) return res.json({ message: "User doesn't exist" });

  if (password != user.password)
    return res.status(400).json({ message: "Password don't match." });

  const payload = {
    email,
    name: user.name,
  };

  jwt.sign(payload, "secret", (err, token) => {
    if (err) {
      console.error(err);
    } else {
      return res.json({ token });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Auth-service at ${PORT}`);
});
