const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://volunteer-management-b22ec.web.app",
      "https://volunteer-management-b22ec.firebaseapp.com"
    ],
    credentials: true,
  })
);

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};

app.get('/', (req, res) => {
  res.send('Server running......');
})

app.listen(port, () => {
  console.log(`Server running port ${port}`);
})


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lyuai16.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const logger = (req, res, next) => {
  next();
}

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: 'Unauthorized Access' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      // console.log(err);
      return res.status(401).send({ message: 'Unauthorized Access' })
    }
    req.user = decoded;
    next();
  })
}


async function run() {
  try {

    const volunteerCollection = client.db("volunteers_management").collection("volunteers_post");
    const beVolunteerCollection = client.db("volunteers_management").collection("be_volunteers_post");


    // Auth related api
    app.post('/jwt', logger, async (req, res) => {
      try {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,
          {
            expiresIn: '1h'
          });
        res.cookie('token', token, cookieOptions)
          .send({ success: true });
      }
      catch {
        res.send({
          status: true,
          error: error.message,
        })
      }
    })

    app.post('/logout', async (req, res) => {

      const user = req.body
      res.clearCookie('token', {
          maxAge: 0,
          secure: process.env.NODE_ENV === 'production' ? true : false,
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ status: true })
    })

    // Add Volunteers post api
    app.post('/addVolunteersPost', async (req, res) => {
      const volunteersPostData = req.body;
      const result = await volunteerCollection.insertOne(volunteersPostData);
      res.send(result);
      // console.log(data);
    })

    // Get Volunteers post api for home page
    app.get('/volunteersPostHome', async (req, res) => {
      const data = await volunteerCollection.find().sort({ deadline: 1 }).limit(6).toArray();
      res.send(data);
    })

    // Get All volunteers post api
    app.get('/volunteersPost', async (req, res) => {
      const data = await volunteerCollection.find().sort({ deadline: 1 }).toArray();
      res.send(data);
    })

    // Volunteers details api 
    app.get('/volunteersDetails/:id', async (req, res) => {
      const id = new ObjectId(req.params.id);
      const data = await volunteerCollection.find({ '_id': id }).toArray();
      res.send(data);
    })

    //  My volunteer post
    app.get('/myvolunteerpost', verifyToken, async (req, res) => {
      const email = req.query.email;
      if (req.user.email !== req.query.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      const data = await volunteerCollection.find({ email: email }).sort({ _id: -1 }).toArray();
      res.send(data);
    })

    // My volunteer post delete
    app.delete('/myvolunteerpost/:id', async (req, res) => {
      const id = new ObjectId(req.params.id);
      const query = { _id: id };
      const result = await volunteerCollection.deleteOne(query);
      res.send(result);
    })

    // Update post
    app.put('/update-post/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateData = {
        $set: req.body
      };
      const result = await volunteerCollection.updateOne(filter, updateData, options);
      console.log(`A document was inserted with the _id: ${result}`);
      res.send(result);
    })

    // Be Volunteer api
    app.post('/be-volunteer', async (req, res) => {
      const beVolunteerData = req.body;
      const result = await beVolunteerCollection.insertOne(beVolunteerData);
      res.send(result);
    })

    // Update No of Volunteer after request be Vounteer
    app.put('/be-volunteer/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const data = req.body.updateNoOfVolunteer;
      const updateData = { $set: { 'noOfVolunteersNeeded': data } };
      const result = await volunteerCollection.updateOne(filter, updateData);
      res.send(result);
    })

    // My Volunteer Request Post
    app.get('/my-request-volunteer-post', verifyToken, async (req, res) => {
      const email = req.query.email;
      const data = await beVolunteerCollection.find({ 'user_email': email }).sort({ _id: -1 }).toArray();
      res.send(data);
    })

    // Request post cancel
    app.delete('/my-request-volunteer-post-cancel/:id', async (req, res) => {
      const id = new ObjectId(req.params.id);
      const query = { _id: id };
      const result = await beVolunteerCollection.deleteOne(query);
      res.send(result);
    })


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

