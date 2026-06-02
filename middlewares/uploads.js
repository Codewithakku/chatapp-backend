const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create 'uploads' folder if not exists
const uploadDir = path.join(__dirname, '..', 'uploads');  //make path for upload folder

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Set up Multer storage
const storage = multer.diskStorage({          
    destination: function (req, file, cb) {             //destination : for Folder where files are saved
        cb(null, uploadDir); 
    },
    filename: function (req, file, cb) {                //filename : for rename a filename
        const ext = path.extname(file.originalname);
        const filename = `profile-${Date.now()}${ext}`;
        cb(null, filename);                             // CB : Callback
    }
});

// Filter image files
const fileFilter = (req, file, cb) => {         //fileFilter for  accept or reject uploaded files like uploaded filr must be this types
    const allowedTypes = /jpeg|jpg|png|gif/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);

     if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }

  if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }

  if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
};

//main function here
const upload = multer({
    storage: storage,                      //destination : for Folder where files are saved
    fileFilter: fileFilter,                //fileFilter for  accept or reject uploaded files like uploaded filr must be this types
    limits: { fileSize: 2 * 1024 * 1024 }  // 2MB
});

module.exports = upload;
