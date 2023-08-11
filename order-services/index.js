const express = require("express");
const mongoose = require("mongoose");
const Order = require("./Order");
const amqp = require("amqplib");
const Buffer = require("buffer");

const app = express();
const PORT = process.env.PORT_TWO || 9090;
var channel, connection;
let order;

app.use(express.json());
mongoose
  .connect("mongodb://192.168.56.9:27017/product-service", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Order-service DB started"));

async function createOrder(products, userEmail) {
  let total = 0;

  products.forEach((product) => {
    total += product.price;
  });

  const newOrder = new Order({
    products,
    user: userEmail,
    total_price: total,
  });

  await newOrder.save();
  return newOrder;
}
async function connect() {
  const amqpServer = "amqp://192.168.56.9:5672";
  connection = await amqp.connect(amqpServer);

  channel = await connection.createChannel();
  await channel.assertQueue("ORDER");
}
connect().then(() => {
  channel.consume("PRODUCT", (data) => {
    const { products, userEmail } = JSON.parse(data.content);
    order = createOrder(products, userEmail);
    channel.ack(data);
    channel.assertQueue(
      "PRODUCT",
      Buffer.Buffer.from(JSON.stringify({ order }))
    );
  });
});

app.listen(PORT, () => {
  console.log(`Order-service at ${PORT}`);
});
