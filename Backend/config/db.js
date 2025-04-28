const mongoose=require('mongoose');
const dotenv=require('dotenv');
dotenv.config();
const connectDB=async ()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DataBase Connected');
    }
    catch(error){
        console.log(`Error Establishing Connection ${error}`);
    }
};
module.exports=connectDB;
