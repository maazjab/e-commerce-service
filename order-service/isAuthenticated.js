const jwt = require("jsonwebtoken");

module.exports = async function isAuthenticated(req, res, next) {
  const token = req.headers["authorization"].split(" ")[1];

  jwt.verify(token, "secret", (err, token) => {
    if (err) {
      return res.status(400).json({ message: err });
    } else {
      req.user = token;
      next();
    }
  });
};
