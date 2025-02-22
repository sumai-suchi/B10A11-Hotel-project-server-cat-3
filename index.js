const express=require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser');
const cors=require('cors');
const app=express();

const port=process.env.PORT || 5000;


require('dotenv').config()
const jwt=require('jsonwebtoken');
const { error } = require('console');


const corsOptions={
  
    origin:['http://localhost:5173'],
    credentials:true,
    optionsSuccessStatus:200
  
}
app.use(express.json());
app.use(cors(corsOptions))
app.use(cookieParser())

const verifyToken=(req,res,next)=>
  {
    console.log('inside verify token middleware', req?.cookies)
    const token=req?.cookies?.token;
    console.log(token)
    
  
    if(!token)
    {
      return res.status(401).send({message:'Unauthorized access'})
    }
  
    jwt.verify(token,process.env.SECRET_KEY,(err,decoded)=>
    {
      console.log(token)
       if(err)
       {
        console.log(err)
         return res.status(401).send({message:'UnAuthorized '})
       }
  
       req.user=decoded;
  
      console.log(req.user)
      console.log(req.user.email)

      next();
    })
    
  }  
  
  

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

    //json web token
   app.post('/jwt',async(req,res)=>
  {
    const email=req.body;
    console.log(email)
  const token=  jwt.sign(email,process.env.SECRET_KEY,{expiresIn:'365d'})
    console.log(typeof( token))
    res.cookie('token',token,{
      httpOnly:true,
      secure: process.env.NODE_ENV === "production", 
      sameSite:process.env.NODE_ENV === "production" ? "none" : "strict",
    })
    .send({success:true})

  })
  
  app.get('/logOut',async(req,res)=>
  {
    res.clearCookie('token',{
      maxAge:0,
      httpOnly:true,
      secure: process.env.NODE_ENV === "production", 
      sameSite:process.env.NODE_ENV === "production" ? "none" : "strict",
    }).send({success:true})
  })

    app.get('/RoomData',async(req,res)=>
    {
      console.log(req.query)
      const min=req.query?.min;
      const max=req.query?.max;
      console.log(min,max)
      let query={}
      if(min && max)
      {
         query={
        price :{ $gte : parseInt(min),$lte : parseInt(max)}}

        
      }
      console.log(query)

      const Cursor=Rooms.find(query);
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


  
  app.patch('/RoomAvailable/:id',async(req,res)=>
    {
      
      console.log(req.params)
      const {id}=req.params;
      console.log(id)
      const updateUser=req.body;
      console.log(updateUser )
    
      const filter={_id : new ObjectId(id)}
      const Option={upsert:true}
      const update=
      {
        $set:{

          
          availability:updateUser.availability,
        

        }
      }

      const result= await Rooms.updateOne(filter,update,Option);
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
      
      const query={date : -1}
      const Cursor= user_review.find().sort(query);
      const result=await Cursor.toArray();
      console.log(result)
      res.send(result)

    })


  app.get('/MyBookedRoom',verifyToken,async(req,res)=>
    {
      console.log(req.user)
      const decodedEmail=req.user?.email;
      console.log('decoded-->',decodedEmail)
      
      const email=req.query.email;
      console.log(req.query.email)
      if(decodedEmail != email)
      {
        return res.status(401).send({message:'UnAuthorized '})
      }
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
    console.log(typeof(reviewData))
    reviewData.date=new Date()
    console.log(reviewData)
    

    const result= await user_review.insertOne(reviewData)
    res.send(result)
  })


  
  




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