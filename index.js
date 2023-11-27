const express = require('express');
const cors = require('cors');
// var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express()
const port = process.env.PORT || 5000;


// middlewares
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zku3u3r.mongodb.net/?retryWrites=true&w=majority`;

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

    const database = client.db("petCareDB");
    const petCollection = database.collection("pets")

    // get pets waiting for adopt
    app.get('/pets', async (req, res) => {
        const category  = req.query.category;
        const searchValue = req.query.search; 
        console.log(category, searchValue)  
        const query = {
            category: category,
            adopted: false,
            name: {$regex: searchValue, $options: 'i'}
        }
        const options = {
            sort: { adoption_date: -1, doption_time: -1 },
        }
        const result = await petCollection.find(query, options).toArray()
        res.send(result)
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Pet Care Server is running')
})

app.listen(port, () => {
    console.log(`Pet Care is running on port ${port}`)
})
