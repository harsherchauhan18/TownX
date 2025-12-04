import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
   path: "./.env"
}) // load port variable

const PORT = process.env.PORT || 4000

connectDB()
.then(() => {
   app.listen(PORT,() => {
    console.log(`Server is running on ${PORT}`)
})
})
.catch((err) => {
   console.log("Mongodb conection error",err)
})


