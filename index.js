const express = require('express');
const jwt = require('jsonwebtoken')
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x8pzcmr.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    const membercollection = client.db("metromony").collection("members");


    const verifyToken = (req,res,next)=>{
     
      if(!req.headers.authorization){
        return res.status(401).send({message:'forbidden access'})
      }
      console.log('insite token',req.headers.authorization)
      const token = req.headers.authorization.split(' ')[1]
      console.log(37,process.env.ACCESS_TOKEN_SECRET)
      jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
       if(err){
        return res.status(401).send({message:'forbidden access'})
       } 
       req.decoded = decoded
       next()
      })
    }
    app.get('/members/admin/:email',verifyToken ,async(req,res)=>{
      const email = req.params.email
      console.log(email,req.decoded.contactEmail)
      if(email !==req.decoded.contactEmail){
        return res.status(403).send({message:'unauthrized access'})
      }
const query = {contactEmail: email}
const user = await membercollection.findOne(query) 
let admin = false
if(user){
  admin = user?.role === 'admin'
}
res.send({admin})
    })
    app.get('/biodatas', async (req, res) => {
      let query = {};
      
      if (req.query.email) {
          // Adjust the query based on your database field names
          query = { contactEmail: req.query.email };
      }
  
      try {
          const result = await membercollection.find(query).toArray();
          res.json(result);
      } catch (error) {
          console.error('Error retrieving data from MongoDB:', error);
          res.status(500).json({ error: 'Internal Server Error' });
      }
  });
  app.get('/current', async (req, res) => {
    let query = {};

    // Check if req.query.email exists
    if (req.query.email) {
        // Adjust the query based on your database field names
        query = { contactEmail: req.query.email };
    } else {
        // Handle the case where req.query.email doesn't exist
        res.status(400).json({ error: 'Email parameter is required' });
        return;
    }

    try {
        const result = await membercollection.find(query).toArray();
        res.json(result);
    } catch (error) {
        console.error('Error retrieving data from MongoDB:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

  
    app.get('/members/premium/:email',verifyToken,async(req,res)=>{
      const email = req.params.email
      console.log(email,req.decoded.contactEmail)
      if(email !==req.decoded.contactEmail){
        return res.status(403).send({message:'unauthrized access'})
      }
const query = {contactEmail: email}
const user = await membercollection.findOne(query) 
let premium = false
if(user){
  premium = user?.role2 === 'premium'
}
res.send({premium})
    })
  //   app.get('/biodatas', async (req, res) => {
  //     let query = {};
      
  //     if (req.query.email) {
  //         // Adjust the query based on your database field names
  //         query = { contactEmail: req.query.email };
  //     }
  
  //     try {
  //         const result = await membercollection.find(query).toArray();
  //         res.json(result);
  //     } catch (error) {
  //         console.error('Error retrieving data from MongoDB:', error);
  //         res.status(500).json({ error: 'Internal Server Error' });
  //     }
  // });
  

    app.get('/members',  async (req, res) => {
      const result = await membercollection.find().toArray();
      res.send(result);
    });

    app.post('/members', async (req, res) => {
      const lastBiodata = await membercollection
        .find({}, { sort: { biodataId: -1 }, limit: 1 })
        .toArray();

      let newBiodataId = 1;
      if (lastBiodata.length > 0) {
        newBiodataId = lastBiodata[0].biodataId + 1;
      }

      const members = req.body;
      members.biodataId = newBiodataId;

      try {
        const result = await membercollection.insertOne(members);
        res.json({ success: true, message: 'Biodata added successfully', result });
      } catch (error) {
        res.status(500).json({ success: false, message: 'Error adding biodata', error });
      }
    });

    app.get('/members', async (req, res) => {
      console.log(req.headers)
      let query = {};
      if (req.query?.biodataId) {
        query = { biodataId: parseInt(req.query.biodataId) }; // Convert to integer
      }
      const result = await membercollection.find(query).toArray();
      res.send(result);
    });
    app.get('/members/:id', async (req, res) => {
      const id = req.params.id;
    
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid ObjectId' });
      }
    
      const query = { _id: new ObjectId(id) };
      const members = await membercollection.findOne(query);
      res.send(members);
    });

    app.patch('/members/premium/:id', async (req, res) => {
      const id = req.params.id;
  
      if (!ObjectId.isValid(id)) {
          return res.status(400).json({ success: false, message: 'Invalid ObjectId' });
      }
  
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
          $set: {
              role2: 'premium'
          }
      };
  
      try {
          const result = await membercollection.updateOne(filter, updatedDoc);
  
          if (result.modifiedCount > 0) {
              res.json({
                  acknowledge: true,
                  modifiedCount: result.modifiedCount
              });
          } else {
              res.json({
                  acknowledge: false,
                  modifiedCount: 0
              });
          }
      } catch (error) {
          console.error('Error updating user to premium:', error);
          res.status(500).json({
              acknowledge: false,
              modifiedCount: 0
          });
      }
  });
  


    app.patch('/members/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
          $set: {
              role: 'admin'
          }
      };
  
      try {
          const result = await membercollection.updateOne(filter, updatedDoc);
  
          if (result.modifiedCount > 0) {
              res.json({
                  acknowledge: true,
                  modifiedCount: result.modifiedCount
              });
          } else {
              res.json({
                  acknowledge: false,
                  modifiedCount: 0
              });
          }
      } catch (error) {
          console.error('Error updating user to admin:', error);
          res.status(500).json({
              acknowledge: false,
              modifiedCount: 0
          });
      }
  });

  app.post('/jwt',async(req,res)=>{
    const user = req.body
    const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})
    res.send({token})
  })

 

    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensure that the client will close when you finish/error
    // You might want to add client.close() here if necessary
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('server is running');
});

app.listen(port, () => {
  console.log(`Metromony is running on port ${port}`);
});
