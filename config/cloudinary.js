// config/cloudinary.js
import {v2 as cloudinary} from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: "dyvpxtoqc",
  api_key: "253766466748743",
  api_secret: "JRe3INr0nESG2S7FAMxjHKHsfVc",
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'aaua-parking',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

export  { cloudinary, storage };