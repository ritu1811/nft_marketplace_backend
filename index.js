const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");

const port = process.env.PORT || 5000

app.use(express.json());
app.use(cors());

//mongodb code
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@demo-nft.asnzfbh.mongodb.net/?retryWrites=true&w=majority&appName=demo-nft`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //create a database and connection
    const db = await client.db("demo-nft");
    const collection = await db.collection("nfts");

    //checkout routes
    app.post("/checkout",async(req,res) => {
    try{
      const {amount} = req.body;
      // const invoice = await createInvoice(amount);
      const invoice = {
        result: {
          order_id: 'order_123456',
          status: 'pending', // You can change to 'paid', 'failed' etc.
          amount: 500,
          created_at: new Date().toISOString()
        }
      }
      const data = {
        ...req.body,
          order_id: invoice.result.order_id,
          payment_status: invoice.result.status,
      };

      const result = await collection.insertOne(data);
       const response = {
          invoice,
          mongodbResult: result,
      };

      res.json(response)

    }catch(error){
    console.error(error);
    res.status(500).send("Server Error");
    }
  });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);



//base url
const cryptomus = axios.create({
  baseURL: "https://api.cryptomus.com/v1",
});

const DEFAULT_CURRENCY = "USD";

//create invoice
const createInvoice = async (amount) => {
  try {
    const data = {
      amount: amount,
      currency: DEFAULT_CURRENCY,
      order_id: crypto.randomBytes(12).toString("hex"),
      url_callback: "https://nft-marketplace-opal-eight.vercel.app/checkout/callback",
      url_success: "https://nft-marketplace-opal-eight.vercel.app",
      lifetime: 300,
    }
    const sign = crypto
      .createHash("md5")
      .update(Buffer.from(JSON.stringify(data)).toString("base64") + process.env.PAYMENT_API_KEY)
      .digest("hex");

      const headers = {
        merchant: process.env.MERCHANT_ID,
        sign,
      };

      const response = await cryptomus.post("/payment", data, {
        headers,
      });
      return response.data;

  } catch (error) {
    console.error(error);
    throw error;
  }
}

app.get('/', (req, res) => {
  res.send('Hello Fuckers! Daddy is back')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})