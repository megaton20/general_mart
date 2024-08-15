// multerConfig.js
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Ensure the /uploads directory exists
const uploadDir = path.join(__dirname, '..', 'public/uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// File type validation function
const fileFilter = (req,res, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|avif|webp|svg/;
  const isValidType = allowedTypes.test(file.mimetype.toLowerCase());
  if (isValidType) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, jpeg, png, avif, webp, svg) are allowed.'));
    req.flash('error_msg', `invalid file format`)
    return res.redirect('back')
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: fileFilter
});



module.exports = upload;