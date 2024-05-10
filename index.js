const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 7000;



// const corsOptions = {
//     origin: ['http://localhost:5173', 'http://localhost:5174'],
//     credentials: true,
//     optionSuccessStatus: 200,

// }
app.use(cors());
app.use(express.json());




app.get('/', (req, res)=>{
    res.send('Server is Running')
})

app.listen(port, ()=>{
 console.log(`Server is running on PORT ${port}`)
})