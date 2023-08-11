const express = require("express");
const mongoose = require("mongoose");
const Order = require("./Order");
const amqp = require("amqplib");

const app = express();
const PORT = process.env.PORT_TWO || 9090;
let connection, channel;

app.use(express.json());
mongoose
  .connect("mongodb://192.168.56.9:27017/product-service", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Order-service DB started"))
  .catch((error) => console.log(error));

function createOrder(products, userEmail) {
  let total = 0;

  products.forEach((product) => {
    total += product.price;
  });

  const newOrder = new Order({
    products,
    user: userEmail,
    total_price: total,
  });

  newOrder.save();
  return newOrder;
}

async function connect() {
  try {
    const amqpServer = "amqp://192.168.56.9:5672";
    connection = await amqp.connect(amqpServer);

    channel = await connection.createChannel();
    await channel.assertQueue("ORDER");

    channel.consume("ORDER", (data) => {
      const { products, userEmail } = JSON.parse(data.content);
      let order = createOrder(products, userEmail);
      channel.ack(data);

      channel.assertQueue("PRODUCT", Buffer.from(JSON.stringify({ order })));
    });
  } catch (error) {
    console.error("Error consuming PRODUCT", error);
  }
}
connect();
app.listen(PORT, () => {
  console.log(`Order-service at ${PORT}`);
});
