const express = require('express');
const cors = require('cors');
// var jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express()
const port = process.env.PORT || 5000;


// middlewares
app.use(cors())
app.use(express.json())




app.get('/', (req, res) => {
    res.send('Pet Care Server is running')
})

app.listen(port, () => {
    console.log(`Pet Care is running on port ${port}`)
})
