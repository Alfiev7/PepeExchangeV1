require("dotenv").config();
const mongoose = require("mongoose");

// mongoose
//   .connect(process.env.MONGODB_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log("MongoDB connected"))
//   .catch((err) => console.log(err));

const Product = mongoose.model("Product", {
  name: String,
  price: Number,
  requiredCoin: String, // The coin symbol required to purchase this product
  description: String,
  image: String,
});

// Code Model for storing product codes
const ProductCode = mongoose.model("ProductCode", {
  productName: String,
  code: String,
  isUsed: { type: Boolean, default: false },
});

// Initialize product codes
const generateProductCodes = async () => {
  const productNames = [
    "Cryptone Shark",
    "Cryptone Whale",
    "Solara Shark",
    "Solara Whale",
    "ZeroX Shark",
    "ZeroX Whale",
    "Mintium Shark",
    "Mintium Whale",
    "Polaris Shark",
    "Polaris Whale",
  ];

  for (const productName of productNames) {
    const existingCodes = await ProductCode.countDocuments({ productName });

    if (existingCodes < 400) {
      const codesToGenerate = 400 - existingCodes;

      for (let i = 0; i < codesToGenerate; i++) {
        const code =
          Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15);

        const productCode = new ProductCode({
          productName,
          code,
          isUsed: false,
        });

        await productCode.save();
      }
    }
  }
};

// Initialize products in database
const initializeShopProducts = async () => {
  const productsCount = await Product.countDocuments();

  if (productsCount === 0) {
    const products = [
      {
        name: "Cryptone Shark",
        price: 1000,
        requiredCoin: "CRYPT",
        description: "Exclusive Cryptone Shark NFT",
        image: "/products/cryptone-shark.png",
      },
      {
        name: "Cryptone Whale",
        price: 2000,
        requiredCoin: "CRYPT",
        description: "Exclusive Cryptone Whale NFT",
        image: "/products/cryptone-whale.png",
      },
      {
        name: "Solara Shark",
        price: 1000,
        requiredCoin: "SOL",
        description: "Exclusive Solara Shark NFT",
        image: "/products/solara-shark.png",
      },
      {
        name: "Solara Whale",
        price: 2000,
        requiredCoin: "SOL",
        description: "Exclusive Solara Whale NFT",
        image: "/products/solara-whale.png",
      },
      {
        name: "ZeroX Shark",
        price: 1000,
        requiredCoin: "ZRX",
        description: "Exclusive ZeroX Shark NFT",
        image: "/products/zerox-shark.png",
      },
      {
        name: "ZeroX Whale",
        price: 2000,
        requiredCoin: "ZRX",
        description: "Exclusive ZeroX Whale NFT",
        image: "/products/zerox-whale.png",
      },
      {
        name: "Mintium Shark",
        price: 1000,
        requiredCoin: "MNT",
        description: "Exclusive Mintium Shark NFT",
        image: "/products/mintium-shark.png",
      },
      {
        name: "Mintium Whale",
        price: 2000,
        requiredCoin: "MNT",
        description: "Exclusive Mintium Whale NFT",
        image: "/products/mintium-whale.png",
      },
      {
        name: "Polaris Shark",
        price: 1000,
        requiredCoin: "DOT",
        description: "Exclusive Polaris Shark NFT",
        image: "/products/polaris-shark.png",
      },
      {
        name: "Polaris Whale",
        price: 2000,
        requiredCoin: "DOT",
        description: "Exclusive Polaris Whale NFT",
        image: "/products/polaris-whale.png",
      },
    ];
    await Product.insertMany(products);
    console.log("Shop products initialized");

    // Generate product codes
    await generateProductCodes();
    console.log("Product codes generated");
  }
};

// initializeShopProducts();


module.exports = { Product, ProductCode };