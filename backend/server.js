
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "https://noir-restaurant-xi.vercel.app",
  })
);

app.use(express.json());

// MongoDB order schema
const orderSchema = new mongoose.Schema(
  {
    customer: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
    },
    orderType: {
      type: String,
      enum: ["delivery", "pickup"],
      required: true,
    },
    address: {
      type: String,
      default: "",
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "pickup"],
      required: true,
    },
    items: [
      {
        dishId: { type: Number, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        qty: { type: Number, required: true, min: 1 },
      },
    ],
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      default: "Pending",
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "NOIR backend is running." });
});

// Preserve the existing menu endpoint
app.get("/api/dishes", (req, res) => {
  res.json({ message: "NOIR menu API is ready." });
});

// Create an order
app.post("/api/orders", async (req, res) => {
  try {
    const {
      customer,
      orderType,
      address,
      paymentMethod,
      items,
    } = req.body;

    if (
      !customer?.name?.trim() ||
      !customer?.email?.trim() ||
      !customer?.phone?.trim()
    ) {
      return res.status(400).json({
        message: "Please provide your name, email and phone number.",
      });
    }

    if (!["delivery", "pickup"].includes(orderType)) {
      return res.status(400).json({
        message: "Please select delivery or pickup.",
      });
    }

    if (
      orderType === "delivery" &&
      !address?.trim()
    ) {
      return res.status(400).json({
        message: "Delivery address is required.",
      });
    }

    if (
      !["cod", "pickup"].includes(paymentMethod) ||
      (orderType === "delivery" && paymentMethod !== "cod") ||
      (orderType === "pickup" && paymentMethod !== "pickup")
    ) {
      return res.status(400).json({
        message: "Please select a valid payment method.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Your cart is empty.",
      });
    }

    // Calculate prices from trusted server-side menu data.
    const menu = [
      { id: 1, name: "Truffle Butter Steak", price: 4200 },
      { id: 2, name: "Velvet Mushroom Risotto", price: 2400 },
      { id: 3, name: "Golden Crusted Salmon", price: 3400 },
      { id: 4, name: "Dark Chocolate Symphony", price: 1600 },
      { id: 5, name: "Burrata Garden Salad", price: 1900 },
      { id: 6, name: "Midnight Tiramisu", price: 1400 },
    ];

    const verifiedItems = [];

    for (const item of items) {
      const dish = menu.find(
        (entry) => entry.id === Number(item.dishId)
      );
      const qty = Number(item.qty);

      if (!dish || !Number.isInteger(qty) || qty < 1 || qty > 50) {
        return res.status(400).json({
          message: "An order item or quantity is invalid.",
        });
      }

      verifiedItems.push({
        dishId: dish.id,
        name: dish.name,
        price: dish.price,
        qty,
      });
    }

    const total = verifiedItems.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );

    const order = await Order.create({
      customer: {
        name: customer.name.trim(),
        email: customer.email.trim(),
        phone: customer.phone.trim(),
      },
      orderType,
      address: orderType === "delivery" ? address.trim() : "",
      paymentMethod,
      items: verifiedItems,
      total,
    });

    return res.status(201).json({
      message: "Your NOIR order has been placed successfully.",
      order: {
        id: order._id,
        total: order.total,
        status: order.status,
      },
    });
  } catch (error) {
    console.error("Order creation failed:", error.message);
    return res.status(500).json({
      message: "Unable to place your order. Please try again.",
    });
  }
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from backend/.env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully.");

    app.listen(PORT, () => {
      console.log(`NOIR backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Backend startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
