import {v2 as cloudinary} from "cloudinary";
import fs from "fs";


// Configuration
cloudinary.config({ 
    cloud_name: "dyxkaoyzf", 
    api_key: "181221316439283", 
    api_secret: "xsdqfEWS8p0cvhEXbF4uIKdGGDo"
});


const uploadonCloudinary = async (localfilePath) => {
    try{
        if(!localfilePath) return null;
        const response = await cloudinary.uploader.upload(localfilePath, {
            resource_type: "auto"
        })
        // file has been uploaded to cloudinary
        console.log("file has been uploaded to cloudinary: ", response.url)
        fs.unlinkSync(localfilePath)
        return response;
    } catch(error){
        fs.unlinkSync(localfilePath) // delete the file from local storage
        console.log("Error: ", error);
        return null;
    }
}

export default uploadonCloudinary