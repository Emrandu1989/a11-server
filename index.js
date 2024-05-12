const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 7000;



const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    optionSuccessStatus: 200,

}
app.use(cors(
  {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      "https://b9-a11-b91e3.web.app",
      "https://b9-a11-b91e3.web.app"
     ],
    credentials: true,
    optionSuccessStatus: 200,
  }
));
app.use(express.json());
app.use(cookieParser())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_pass}@cluster0.mzwb7mf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// const uri = "mongodb+srv://<username>:<password>@cluster0.mzwb7mf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// middlewares

const logger = (req, res, next) =>{
    console.log('log: info', req.method, req.url);
       
    next()
}

const verifyToken = (req, res, next) =>{
     const token = req.cookies?.token;
    //  console.log('token in the middleware', token);
      
    //  no token available
    if(!token){
        return  res.status(401).send({message: 'unauthorized access'})
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
        if(err){
            return res.status(401).send({message:'unauthorized access'})
        }
        req.user = decoded;

        next()
    })

    //  next()
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
      
     const foodCollection = client.db("foodBD").collection("foods");
     const requestedFoodCollection = client.db("foodDb").collection('requestedFood')

    //  auth related api
     
      app.post('/jwt',logger, async(req, res)=>{
          const user = req.body;
          console.log('user for token', user);
          const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'1hr'})
          res
          .cookie('token', token,{
              httpOnly:true,
              secure:true,
              sameSite:'none'

          })
          .send({success:true})
      })

      app.post('/logout', async(req, res)=>{
          const user = req.body;
          console.log('logging out', user)
          res.clearCookie('token', {maxAge: 0}).send({success:true})
      })


    //  foods related api

     app.post('/foods', async(req, res)=>{
            const foodData = req.body;
            console.log(foodData);
            const result = await foodCollection.insertOne(foodData);
            res.send(result)
     })
         //  for requested food
    
         app.post('/requestedFoods', async(req, res)=>{
          const requestedFoodData = req.body;
          console.log(requestedFoodData);
          const result = await requestedFoodCollection.insertOne(requestedFoodData);
          res.send(result)
     })
     
    //  for requested food
     app.get('/requestedFoods', async(req, res)=>{
          const result = await requestedFoodCollection.find().toArray();
          res.send(result);
     })

    //  for requested food

    app.get('/requestedFoods/:email', async(req, res)=>{
         const email = req.params.email;
         const query = {donatorEmail: email};
         const result = await requestedFoodCollection.find(query).toArray();
         res.send(result)

    })

  

     app.get('/foods', async(req, res)=>{
           const result = await foodCollection.find().toArray();
           res.send(result)
     })

    //  get foodDetail info by using unique id

     app.get('/foods/:id', async(req, res)=>{
          const id = req.params.id;
           const query = {_id: new ObjectId(id)};
           const result = await foodCollection.findOne(query);
           res.send(result)
     })

    //  get all foods added by a specific user;

    app.get('/food/:email', logger, verifyToken, async(req, res)=>{
        //  console.log('cook cookies', req.cookies)
         const email = req.params.email;
         const query = {donatorEmail: email};
         const result = await foodCollection.find(query).toArray();
         res.send(result)
    })


    // update food info 

    app.put('/food/:id', async(req, res)=>{
         const id = req.params.id;
         const foodData = req.body;
         const query = {_id: new ObjectId(id)};
         const option = {upsert : true};
         const updateDoc = {
            $set: {
                ...foodData
            }
         }
         const result = await foodCollection.updateOne(query, updateDoc,option);
         res.send(result)
    })

    // delete a food data from db

    app.delete('/food/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await foodCollection.deleteOne(query);
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);








app.get('/', (req, res)=>{
    res.send('Server is Running')
})

app.listen(port, ()=>{
 console.log(`Server is running on PORT ${port}`)
})