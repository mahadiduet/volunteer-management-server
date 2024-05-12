const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Server running......');
})

app.listen(port, () => {
  console.log(`Server running port ${port}`);
})


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://mahadi_volunteers:p0s0gEu9zGZ4fiUw@cluster0.lyuai16.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

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

    const volunteerCollection = client.db("volunteers_management").collection("volunteers_post");

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
    app.get('/myvolunteerpost', async (req, res) => {
      const email = req.query.email;
      // console.log(email);
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
      // console.log(req.body);
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateData = {
        $set: req.body
      };
      const result = await volunteerCollection.updateOne(filter, updateData, options);
      console.log(`A document was inserted with the _id: ${result}`);
      res.send(result);
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

