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
        price: 20,
        requiredCoin: "CRN",
        description: "Exclusive Cryptone Shark Discord Roles",
        image: "/products/cryptone-shark.png",
      },
      {
        name: "Cryptone Whale",
        price: 50,
        requiredCoin: "CRN",
        description: "Exclusive Cryptone Whale Discord Roles",
        image: "/products/cryptone-whale.png",
      },
      {
        name: "Solara Shark",
        price: 20,
        requiredCoin: "SOL",
        description: "Exclusive Solara Shark Discord Roles",
        image: "/products/solara-shark.png",
      },
      {
        name: "Solara Whale",
        price: 50,
        requiredCoin: "SOL",
        description: "Exclusive Solara Whale Discord Roles",
        image: "/products/solara-whale.png",
      },
      {
        name: "ZeroX Shark",
        price: 20,
        requiredCoin: "ZRX",
        description: "Exclusive ZeroX Shark Discord Roles",
        image: "/products/zerox-shark.png",
      },
      {
        name: "ZeroX Whale",
        price: 50,
        requiredCoin: "ZRX",
        description: "Exclusive ZeroX Whale Discord Roles",
        image: "/products/zerox-whale.png",
      },
      {
        name: "Mintium Shark",
        price: 20,
        requiredCoin: "MNT",
        description: "Exclusive Mintium Shark Discord Roles",
        image: "/products/mintium-shark.png",
      },
      {
        name: "Mintium Whale",
        price: 50,
        requiredCoin: "MNT",
        description: "Exclusive Mintium Whale Discord Roles",
        image: "/products/mintium-whale.png",
      },
      {
        name: "Polaris Shark",
        price: 20,
        requiredCoin: "DOT",
        description: "Exclusive Polaris Shark Discord Roles",
        image: "/products/polaris-shark.png",
      },
      {
        name: "Polaris Whale",
        price: 50,
        requiredCoin: "DOT",
        description: "Exclusive Polaris Whale Discord Roles",
        image: "/products/polaris-whale.png",
      },
    ];
    await Product.insertMany(products);
    console.log("Shop products initialized");

    // Generate product codes
    await generateProductCodes();
  }
};

// initializeShopProducts();

module.exports = { Product, ProductCode };
