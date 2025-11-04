const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const documentController = require('../controllers/documentController');
const userAuthMiddleware = require('../middlewares/userAuthMiddleware');
const superAdminMiddleware = require('../middlewares/superAdmin');

const router = express.Router();

// Set up multer for document uploads
const uploadDir = process.env.NODE_ENV === 'production'
  ? '/home/ken/ksucu-uploads/documents/'
  : path.join(__dirname, '../uploads/documents/');

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'document-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types - expanded for common document and image types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, PNG, GIF, WEBP'));
    }
  }
});

// ==================== USER ROUTES (Protected) ====================

// Get user's documents
router.get('/my-docs', userAuthMiddleware, documentController.getUserDocuments);

// Download document
router.get('/download/:documentId', userAuthMiddleware, documentController.downloadDocument);

// View document
router.get('/view/:documentId', userAuthMiddleware, documentController.viewDocument);

// Delete user's own document (view-only restriction in frontend)
router.delete('/:documentId', userAuthMiddleware, documentController.deleteDocument);

// ==================== ADMIN ROUTES (Super Admin Only) ====================

// Category management
router.post('/admin/category', superAdminMiddleware, documentController.createCategory);
router.get('/admin/categories', superAdminMiddleware, documentController.getCategories);

// Admin Dashboard
router.get('/admin/dashboard', superAdminMiddleware, documentController.getAdminDashboard);

// Upload document for a user (admin only)
router.post('/admin/upload', superAdminMiddleware, upload.single('document'), documentController.uploadDocument);

// Get documents for specific user (admin view)
router.get('/admin/user/:userId', superAdminMiddleware, documentController.getUserDocumentsAdmin);

// Get all documents (admin view)
router.get('/admin/all', superAdminMiddleware, documentController.getAllDocumentsAdmin);

// Update document status (admin only)
router.put('/admin/:documentId/status', superAdminMiddleware, documentController.updateDocumentStatus);

// Archive document (admin only)
router.post('/admin/:documentId/archive', superAdminMiddleware, documentController.archiveDocument);

// Delete document (admin only)
router.delete('/admin/:documentId', superAdminMiddleware, documentController.deleteDocumentAdmin);

module.exports = router;
