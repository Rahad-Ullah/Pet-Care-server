const express = require('express');
const cors = require('cors');
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

// custom middlewares
// verify token middle ware
const verifyToken = (req, res, next) =>{
  // send error if token doesn't exist
  if(!req.headers.authorization){
    return res.status(401).send({message: 'fobidden access'})
  }
  // verify token if exist
  const token = req.headers.authorization.split(' ')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
    if(err){
      return res.status(401).send({message: 'fobidden access'})
    }
    req.decoded = decoded;
    next()
  })
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const database = client.db("petCareDB");
    const petCollection = database.collection("pets")
    const adoptionRequests = database.collection("adoptionRequests")
    const campaignCollection = database.collection("campaigns")
    const userCollection = database.collection("users")

    // generate jwt token
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
      console.log(token)
      res.send({token})
    })

    // get users
    app.get('/users', async (req, res) => {
      const result = await userCollection.find().toArray()
      res.send(result)
    })

    // create user 
    app.post('/users', async (req, res) =>{
      const user = req.body;
      const result = await userCollection.insertOne(user)
      res.send(result)
    })

    // get all pets waiting for adopt with filtering
    app.get('/pets', async (req, res) => {
        const category  = req.query.category;
        const searchValue = req.query.search;   
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

    // add pet to pet list
    app.post('/pets', async (req, res) => {
      const petData = req.body;
      const result = await petCollection.insertOne(petData);
      res.send(result)
    })


    // get single pet data
    app.get('/pet', async (req, res) => {
      const petId = req.query.id;
      const query = {_id: new ObjectId(petId)}
      const result = await petCollection.findOne(query)
      res.send(result)
    })

    // get all donation campaigns
    app.get('/all-campaigns', async (req, res) => {
      const result = await campaignCollection.find().toArray()
      res.send(result)
    })

    // create donation campaign
    app.post('/campaigns', async (req, res) => {
      const campaignData = req.body;
      const result = await campaignCollection.insertOne(campaignData)
      res.send(result)
    })

    // get all donation campaigns on specific user
    app.get('/campaigns', async (req, res) => {
      const user = req.query.email;
      const query = {userEmail: user}
      const result = await campaignCollection.find(query).toArray()
      res.send(result)
    })

    // update campaign info
    app.patch('/campaigns', async (req, res) => {
      const id = req.query.id;
      const filter = {_id: new ObjectId(id)}
      const campaign = req.body;
      const {name, maxAmount, lastDate, image, short_description, long_description} = campaign;
      const doc = {
        $set:{
          name,
          image,
          maxAmount,
          lastDate,
          short_description,
          long_description
        }
      }
      const result = await campaignCollection.updateOne(filter, doc)
      res.send(result)
    })

    // get single donation campaigns on specific user
    app.get('/single-campaign', async (req, res) => {
      const id = req.query.id;
      const query = {_id: new ObjectId(id)}
      const result = await campaignCollection.findOne(query)
      res.send(result)
    })

    // update campaign status
    app.patch('/campaign-status', async (req, res) => {
      const updatedStatus = req.body.status;
      const id = req.query.id;
      const filter = {_id: new ObjectId(id)}
      const doc = {
        $set:{
          status: updatedStatus,
        }
      }
      const result = await campaignCollection.updateOne(filter, doc)
      res.send(result)
    })

    //! create adoption request
    app.post('/adoption', async (req, res) => {
      const request = req.body;
      const data = {
        name: request.name,
        category: request.category,
        image: request.image,
        adopterName: request.adopterName,
        adopterEmail: request.adopterEmail,
        phone: request.phone,
        address: request.address,
        requestDate: request.requestDate, 
      }

      // check if already requested
      const query = {name: request.name, adopterEmail: request.adopterEmail}
      const isRequested = await adoptionRequests.findOne(query)
      if(isRequested){
        res.send({message: 'failed'})
        return;
      }else{
        const result = await adoptionRequests.insertOne(data)
        // update adopted if insertion success
        const filter = {name: request.name, category: request.category}
        const updateDoc = {
          $set: {adopted: true}
        }
        if(result.insertedId){
          const updateResult = await petCollection.updateOne(filter, updateDoc)
          if(updateResult.modifiedCount){
            res.send({message: 'success'})
          }
        }

      }

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
