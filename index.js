const express=require('express');
const cors=require('cors');
const app=express();
const port=process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

require('dotenv').config()

app.use(cors())
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_password}@cluster0.cgi21.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Send a ping to confirm a successful connection

    const database=client.db('HotelRoomDB');
    const Rooms=database.collection('Rooms');
    const user_review=database.collection('user_review');
    const MyBooking=database.collection('MyBooking');


    app.get('/Room',async(req,res)=>
    {
      const Cursor=Rooms.find();
      const result=await Cursor.toArray();
      console.log(result)
      res.send(result)

    })


    app.get('/Room/:id',async(req,res)=>
    {
      const id=req.params.id;
      // console.log(id)
      const query={_id : new ObjectId(id)}
      // console.log(query)
      const result=await Rooms.findOne(query)
      // console.log(result)
      res.send(result)

    })

    app.put('/Room-update/:id',async(req,res)=>
    {

      console.log(req.params)
      const {id}=req.params;
      console.log(id)
      const updateUser=req.body;
      console.log(updateUser )
      console.log(updateUser.buyer_email)
      const filter={_id : new ObjectId(id)}
      const Option={upsert:true}
      const update=
      {
        $set:{

          
          availability:updateUser.availability,
          date : updateUser.date, 
          buyer_email:updateUser.buyer_email

        }
      }

      const result= await Rooms.updateOne(filter,update,Option);
      res.send( result)
        
    })
    app.post('/MyBookedRoom',async(req,res)=>
      {
        const reviewData=req.body;
        console.log(reviewData)
    
        const result= await MyBooking.insertOne(reviewData)
        res.send(result)
      })


 
   app.patch('/MyBookedRoom/:id',async(req,res)=>
  {
    
    console.log(req.params)
    const {id}=req.params;
    console.log(id)
    const updateUser=req.body;
    console.log(updateUser )
    console.log(updateUser.date)
    const filter={_id : new ObjectId(id)}
    
    const update=
    {
      $set:{

        
        
        date : new Date(updateUser.date), 
        

      }
    }

    const result= await MyBooking.updateOne(filter,update);
    console.log(result)
    res.send( result)
      

  })

  app.delete('/MyBookedRoom/RoomCancel/:id',async(req,res)=>{
    console.log(req.params)
    const {id}=req.params;
    console.log(id)
    const query={_id : new ObjectId(id)}
    console.log('query',query)

    const result=await MyBooking.deleteOne(query)
    console.log(result)
    res.send(result)

  })

  app.get('/RoomReview',async(req,res)=>
    {
      
      const Cursor= user_review.find();
      const result=await Cursor.toArray();
      console.log(result)
      res.send(result)

    })


  app.get('/MyBookedRoom',async(req,res)=>
    {
      console.log(req.query.email)
      const email=req.query.email;
      if(!email){
       return res.status(400).send({message:"email is required!"})
      }
 
      const filter={"buyer_email":email}
 
      const result= await MyBooking.find(filter).toArray();
      res.send(result)
    })

   app.post('/UserReview',async(req,res)=>
  {
    const reviewData=req.body;
    console.log(reviewData)

    const result= await user_review.insertOne(reviewData)
    res.send(result)
  })
  
  // app.patch('/UpdateRoomDetails/:id',async(req,res)=>
  // {
  //   const id=req.params.id;
  //   console.log(id)
  //   const filter={_id : new ObjectId(id)}
  //   const updateUser=req.body;
  //   const update=
  //   {
  //     $set:{

        
       
  //       date : updateUser.date, 
       

  //     }
  //   }
  // })





    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>
{
  res.send('Managing hotel project')
})

app.listen(port,()=>
{
    console.log(`managing hotel at ${port}`)
})