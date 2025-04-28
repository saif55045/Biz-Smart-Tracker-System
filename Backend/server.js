const express=require('express');
const app=express();
const dotenv=require('dotenv');
const cors=require('cors');
const connectDB=require('./config/db');
require('./config/passport'); // load passport config
const authRoutes=require('./routes/authRoutes');
const otpRoutes=require('./routes/otpRoutes');
const productRoutes=require('./routes/productRoutes');
const inventoryFieldRoutes = require('./routes/inventoryFieldRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { checkProductStatus } = require('./controller/notificationController');

dotenv.config();
connectDB();
const Port=process.env.PORT || 5000;
app.use(express.json());
app.use(cors());
app.use('/api/auth',authRoutes);
app.use('/api/auth', otpRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryFieldRoutes);
app.use('/api/notifications', notificationRoutes);

// Check product status every hour
setInterval(checkProductStatus, 1000 * 60 * 60);

app.listen(Port,()=>{
    console.log(`Server is Running on Port ${Port}`);
});