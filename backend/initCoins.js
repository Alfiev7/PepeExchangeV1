require("dotenv").config();
const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const coinSchema = new mongoose.Schema({
  id: String,
  name: String,
  symbol: String,
  price: {
    type: Number,
    required: true,
  },
  minPrice: {
    type: Number,
    required: true,
  },
  supply: Number,
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

const Coin = mongoose.model("Coin", coinSchema);

const initializeCoins = async () => {
  const coins = [
    {
      id: "crn",
      name: "Cryptone",
      symbol: "CRN",
      price: 175,
      minPrice: 165, // Set minimum price to default price
      supply: 2000000000,
    },
    {
      id: "sol",
      name: "Solara",
      symbol: "SOL",
      price: 250,
      minPrice: 240, // Set minimum price to default price
      supply: 2000000000,
    },
    {
      id: "zrx",
      name: "ZeroX",
      symbol: "ZRX",
      price: 1.25,
      minPrice: 1.1, // Set minimum price to default price
      supply: 2000000000,
    },
    {
      id: "mnt",
      name: "Mintium",
      symbol: "MNT",
      price: 5,
      minPrice: 4,
      supply: 2000000000,
    },
    {
      id: "dot",
      name: "Polaris",
      symbol: "DOT",
      price: 35,
      minPrice: 33, // Set minimum price to default price
      supply: 2000000000,
    },
  ];

  await Coin.deleteMany({});

  for (let coin of coins) {
    const existingCoin = await Coin.findOne({ id: coin.id });
    if (!existingCoin) {
      await Coin.create(coin);
      console.log(`Initialized ${coin.name}`);
    } else {
      console.log(`${coin.name} already exists`);
    }
  }
  console.log("Coin initialization check completed");
  mongoose.connection.close();
};

initializeCoins();
