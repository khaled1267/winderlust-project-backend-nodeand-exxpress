require('dotenv').config()
const dns = require("node:dns");


dns.setServers(["8.8.8.8", "8.8.4.4"]);


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const cors = require('cors')
const express = require('express');
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");


const uri = process.env.MONGO_URI;

const app = express()
const port = process.env.PORT
const allowedOrigins = [
  'http://localhost:3000',
  "https://wanderlush-project-server.vercel.app"
]

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json())
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const JWKS = createRemoteJWKSet(
      new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
    )

const varifytoken = async(req, res, next)=>{
      const headers = req.headers.authorization
      if(!headers){
        return res.status(401).send("unauthorized")
      }


      const token = headers.split(" ")[1]
      if(!token){
        return res.status(401).send("unauthorized")
      }
       
        try {
          const { payload } = await jwtVerify(token, JWKS)
          console.log(payload)
          next()
        } catch (error) {
          return res.status(403).json({
            message: "forbidden"
          })
        }
     
    }

async function run() {
  try {
    // await client.connect();

    const db= client.db("wanderlust")
    const dbcollection = db.collection("dastinations")
    const bookingcollection = db.collection("bookings")

   app.get ('/dastinations', async(req, res) => {
      
     const result = await dbcollection.find({}).toArray()
     res.send(result)

      
    })
    

    app.post ('/dastinations', async(req, res) => {
      console.log(req.body, "req.body")
      const newDastination =  req.body
     const result = await dbcollection.insertOne(newDastination)
     res.send(result)

      
    })

    app.get ("/featured", async(req, res) => {
      const result = await dbcollection.find().limit(4).toArray()
      console.log(result)
      res.json(result)
    })

    app.get ('/dastinations/:id', varifytoken , async(req, res) => {
      const {id} = req.params
      console.log(id)
      
      const result = await dbcollection.findOne({_id: new ObjectId(id)})
      res.send(result)
    })
    
    app.patch('/dastinations/:id', async(req, res) => {
      const {id} = req.params
      const updateDastination = req.body
      console.log(updateDastination)
      const result = await dbcollection.updateOne({_id: new ObjectId(id)}, {$set: updateDastination})
      res.send(result)
    })

    app.delete('/dastinations/:id', async(req, res) => {
      const {id} = req.params
      const result = await dbcollection.deleteOne({_id: new ObjectId(id)})
      res.send(result)
    })

    app.delete('/bookings/:bookingId', async(req, res) => {
      const {bookingId} = req.params
      const result = await bookingcollection.deleteOne({_id: new ObjectId(bookingId)})
      res.json(result)
    })


    app.get('/bookings/:userId', async(req, res) => {
      const {userId} = req.params
      const result = await bookingcollection.find({"bookingdata.userId":userId}).toArray()
      res.json(result)
    })
    

    app.post('/bookings',varifytoken, async(req, res) => {
      const booking = req.body
      const result = await bookingcollection.insertOne(booking)
      res.json(result) 
    })


    
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);
app.get('/', (req, res) => {
  res.send('hello api is running')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
