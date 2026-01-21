import multer from 'multer';

const storage = multer.diskStorage({
    destination : (req, file, cb) => {  // cb = callback
        cb(null, "./public");
    },

    filename : (req, file, cb) => { // to change the file name
        cb(null, file.originalname);
    },
});

export const upload = multer({ storage });