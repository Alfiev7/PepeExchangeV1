const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "https://alfalfiev7-migs.vercel.app",
      "https://pepeexchangev1-1.onrender.com",
      "https://www.pepeexchange.io",
    ],
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

app.use(cors());
app.use(express.json());

const socketToUser = new Map();

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("authenticate", (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socketToUser.set(socket.id, decoded._id);
      console.log(`Socket ${socket.id} authenticated for user ${decoded._id}`);
      io.emit("onlineUsersUpdate", socketToUser.size);
    } catch (error) {
      console.error("Authentication error:", error);
    }
  });

  socket.on("disconnect", () => {
    socketToUser.delete(socket.id);
    console.log("Client disconnected");
    io.emit("onlineUsersUpdate", socketToUser.size);
  });
});

const emitUserUpdate = (userId, userData) => {
  const userSockets = Array.from(socketToUser.entries())
    .filter(([_, id]) => id.toString() === userId.toString())
    .map(([socketId, _]) => socketId);

  userSockets.forEach((socketId) => {
    io.to(socketId).emit("userUpdate", userData);
  });
};

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    initializeDatabase();
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// User model
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  balance: Number,
  holdings: {
    type: Map,
    of: Number,
    default: () => new Map(),
  },
});

userSchema.set("toJSON", {
  transform: (doc, ret) => {
    if (ret.holdings instanceof Map) {
      ret.holdings = Object.fromEntries(ret.holdings);
    } else if (typeof ret.holdings === "object" && ret.holdings !== null) {
      ret.holdings = { ...ret.holdings };
    } else {
      ret.holdings = {};
    }
    return ret;
  },
});

const User = mongoose.model("User", userSchema);

// Coin model
const Coin = mongoose.model("Coin", {
  name: String,
  symbol: String,
  price: Number,
  supply: Number,
  priceHistory: Array,
  priceChange24h: Number,
});

// Transaction model
const Transaction = mongoose.model("Transaction", {
  userId: mongoose.Schema.Types.ObjectId,
  coinId: String,
  type: String,
  amount: Number,
  price: Number,
  timestamp: Date,
});

// Initialize database with some coins
async function initializeDatabase() {
  const coinsCount = await Coin.countDocuments();
  if (coinsCount === 0) {
    const initialCoins = [
      { name: "Bitcoin", symbol: "BTC", price: 50000, supply: 21000000 },
      { name: "Ethereum", symbol: "ETH", price: 3000, supply: 100000000 },
      { name: "Litecoin", symbol: "LTC", price: 150, supply: 84000000 },
    ];

    for (let coin of initialCoins) {
      const newCoin = new Coin({
        ...coin,
        priceHistory: [{ price: coin.price, timestamp: new Date() }],
        priceChange24h: 0,
      });
      await newCoin.save();
    }
    console.log("Initial coins created");
  }
}

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) {
    console.log("No token provided");
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log("Token verification failed:", err.message);
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

// Routes
app.post("/api/signup", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      password: hashedPassword,
      balance: 10000,
      holdings: new Map(),
    });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Error registering user" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (user == null) {
      return res.status(400).json({ message: "Cannot find user" });
    }
    if (await bcrypt.compare(req.body.password, user.password)) {
      const accessToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
      res.json({ accessToken: accessToken, userID: user._id });
    } else {
      res.status(401).json({ message: "Not Allowed" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error logging in" });
  }
});

app.get("/api/user", authenticateToken, async (req, res) => {
  try {
    console.log("Fetching user data for:", req.user._id);
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      console.log("User not found:", req.user._id);
      return res.status(404).json({ message: "User not found" });
    }
    console.log("User data retrieved:", user);
    res.json(user);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res
      .status(500)
      .json({ message: "Error fetching user data", error: error.message });
  }
});

app.get("/api/coins", async (req, res) => {
  try {
    const coins = await Coin.find();
    res.json(coins);
  } catch (error) {
    console.error("Error fetching coins:", error);
    res
      .status(500)
      .json({ message: "Error fetching coins", error: error.message });
  }
});

// const generatePriceFluctuation = () => {
//   const min = -0.01;
//   const max = 0.01;
//   return Math.random() * (max - min) + min;
// };

const updateCoinPrice = async (coin, type, amount) => {
  const priceImpact = 0.00001 * amount;
  const multiplier = type === "buy" ? 1 + priceImpact : 1 - priceImpact;
  coin.price *= multiplier;

  const newPrice = coin.price * (1 + generatePriceFluctuation());
  coin.priceHistory.push({ price: newPrice, timestamp: new Date() });

  if (coin.priceHistory.length > 1440) {
    coin.priceHistory.shift();
  }

  const oldPrice = coin.priceHistory[0].price;
  const priceChange24h = ((newPrice - oldPrice) / oldPrice) * 100;

  coin.priceChange24h = priceChange24h;

  await Coin.findOneAndUpdate(
    { _id: coin._id },
    {
      $set: {
        price: coin.price,
        priceHistory: coin.priceHistory,
        priceChange24h: priceChange24h,
      },
    },
    { upsert: true }
  );

  io.emit("priceUpdate", {
    _id: coin._id,
    symbol: coin.symbol,
    price: coin.price,
    priceChange24h: coin.priceChange24h,
  });
};

// const startPriceUpdates = () => {
//   priceUpdateInterval = setInterval(async () => {
//     try {
//       const coins = await Coin.find();
//       for (let coin of coins) {
//         const priceChange = generatePriceFluctuation();
//         const newPrice = coin.price * (1 + priceChange);

//         coin.priceHistory.push({ price: newPrice, timestamp: new Date() });
//         if (coin.priceHistory.length > 1440) {
//           coin.priceHistory.shift();
//         }

//         const oldPrice = coin.priceHistory[0].price;
//         const priceChange24h = ((newPrice - oldPrice) / oldPrice) * 100;

//         await Coin.findOneAndUpdate(
//           { _id: coin._id },
//           {
//             $set: {
//               price: newPrice,
//               priceHistory: coin.priceHistory,
//               priceChange24h: priceChange24h,
//             },
//           },
//           { upsert: true }
//         );

//         io.emit("priceUpdate", {
//           _id: coin._id,
//           symbol: coin.symbol,
//           price: newPrice,
//           priceChange24h: priceChange24h,
//         });
//         console.log(`Updated ${coin.name} price to $${newPrice}`);
//       }
//     } catch (error) {
//       console.error("Error updating coin prices:", error);
//     }
//   }, 5000);
// };

// const stopPriceUpdates = () => {
//   if (priceUpdateInterval) {
//     clearInterval(priceUpdateInterval);
//   }
// };

app.post("/api/transaction", authenticateToken, async (req, res) => {
  let user = null;
  let originalBalance = 0;
  let originalHoldings = null;
  // stopPriceUpdates();

  try {
    const { coinId, type, amount } = req.body;
    const userId = req.user._id;

    console.log("Transaction request:", { userId, coinId, type, amount });

    if (!coinId || !type || amount <= 0) {
      return res.status(400).json({
        message: "Invalid input: coinId, type, and amount (> 0) are required",
      });
    }

    user = await User.findById(userId);
    const coin = await Coin.findOne({ symbol: coinId });

    if (!user || !coin) {
      return res.status(404).json({ message: "User or Coin not found" });
    }

    console.log("User and coin found:", { userId: user._id, coinId: coin._id });

    const totalPrice = amount * coin.price;
    originalBalance = user.balance;
    originalHoldings = new Map(user.holdings);

    if (type === "buy") {
      if (user.balance < totalPrice) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      user.balance -= totalPrice;
      const currentHolding = user.holdings.get(coin.symbol) || 0;
      user.holdings.set(coin.symbol, currentHolding + amount);
    } else if (type === "sell") {
      const currentHolding = user.holdings.get(coin.symbol) || 0;
      if (currentHolding < amount) {
        return res.status(400).json({ message: "Insufficient coin balance" });
      }
      user.balance += totalPrice;
      user.holdings.set(coin.symbol, currentHolding - amount);
      if (user.holdings.get(coin.symbol) === 0) {
        user.holdings.delete(coin.symbol);
      }
    } else {
      return res.status(400).json({ message: "Invalid transaction type" });
    }
    user.balance = Math.max(user.balance, 0);

    await user.save();

    const updatedUser = await User.findById(userId);
    if (updatedUser.balance !== user.balance) {
      throw new Error("Balance inconsistency detected");
    }

    for (const [symbol, amount] of user.holdings) {
      if (updatedUser.holdings.get(symbol) !== amount) {
        throw new Error("Holdings inconsistency detected");
      }
    }

    await updateCoinPrice(coin, type, amount);

    const transaction = new Transaction({
      userId: user._id,
      coinId: coin._id,
      type,
      amount,
      price: coin.price,
      timestamp: new Date(),
    });

    await transaction.save();

    console.log("Transaction successful:", transaction);
    console.log("Updated user data:", updatedUser);

    emitUserUpdate(updatedUser._id.toString(), updatedUser);

    res
      .status(200)
      .json({ message: "Transaction successful", user: updatedUser });
  } catch (error) {
    console.error("Transaction error:", error);

    if (user && originalBalance !== null && originalHoldings !== null) {
      try {
        user.balance = originalBalance;
        user.holdings = originalHoldings;
        await user.save();
        console.log("Changes rolled back due to error");
      } catch (rollbackError) {
        console.error("Error during rollback:", rollbackError);
      }
    }

    res.status(500).json({
      message: "An error occurred during the transaction. Please try again.",
    });
  }
});

app.get("/api/transactions", authenticateToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .limit(5);
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res
      .status(500)
      .json({ message: "Error fetching transactions", error: error.message });
  }
});

// Function to generate random price fluctuations
function generatePriceFluctuation() {
  return (Math.random() * 0.6 - 0.3) / 100; // Random number between -0.3% and 0.3%
}

app.get("/api/admin/online-users", (req, res) => {
  const onlineUsersCount = socketToUser.size;
  res.json({ onlineUsers: onlineUsersCount });
});

// Admin route to get total users count
app.get(
  "/api/admin/total-users",

  async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();
      res.json({ totalUsers });
    } catch (error) {
      console.error("Error fetching total users:", error);
      res.status(500).json({ message: "Error fetching total users" });
    }
  }
);

// Admin route to get user list with portfolio values
app.get(
  "/api/admin/user-list",

  async (req, res) => {
    try {
      const users = await User.find().select("-password");
      const coins = await Coin.find();

      const userList = await Promise.all(
        users.map(async (user) => {
          let totalAssetValue = 0;
          for (const [symbol, amount] of user.holdings) {
            const coin = coins.find((c) => c.symbol === symbol);
            if (coin) {
              totalAssetValue += coin.price * amount;
            }
          }
          const portfolioValue = user.balance + totalAssetValue;

          return {
            username: user.username,
            portfolioValue: portfolioValue.toFixed(2),
          };
        })
      );

      res.json(userList);
    } catch (error) {
      console.error("Error fetching user list:", error);
      res.status(500).json({ message: "Error fetching user list" });
    }
  }
);

const PORT = process.env.PORT || 5000;
server.listen(
  PORT,
  () => console.log(`Server running on port ${PORT}`)
  // startPriceUpdates()
);

app.get("/", (req, res) => {
  res.send("Crypto Trading API");
});
