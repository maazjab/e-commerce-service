const express = require("express");
const mongoose = require("mongoose");
const Product = require("../product-service/Product");
const amqp = require("amqplib");
const isAuthenticated = require("./isAuthenticated");
const Buffer = require("buffer");

const app = express();
const PORT = process.env.PORT_TWO || 8080;
var channel, connection;
let order;
app.use(express.json());
mongoose
  .connect("mongodb://192.168.56.9:27017/product-service", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Product-service DB started"));

async function connect() {
  const amqpServer = "amqp://192.168.56.9:5672";
  connection = await amqp.connect(amqpServer);

  channel = await connection.createChannel();
  await channel.assertQueue("PRODUCT");
}
connect();

//Create new product
//Buy a product
app.post("/product/create", isAuthenticated, async (req, res) => {
  const { name, description, price } = req.body;

  const newProduct = new Product({
    name,
    description,
    price,
  });

  await newProduct.save();

  return res.status(201).json(newProduct);
});

// User sends a list of product's IDs to buy
// Creating an order with those products and total value of sum of product's prices
app.post("/product/buy", isAuthenticated, async (req, res) => {
  const { ids } = req.body;

  const products = await Product.find({ _id: { $in: ids } });

  channel.sendToQueue(
    "ORDER",
    Buffer.Buffer.from(
      JSON.stringify({
        products,
        userEmail: req.user.email,
      })
    )
  );

  channel.consume("PRODUCT", (data) => {
    console.log("Consuming PRODUCT queue");
    order = JSON.parse(data.content);
    channel.ack(data);
  });

  return res.json(order);
});
app.listen(PORT, () => {
  console.log(`Product-service at ${PORT}`);
});
