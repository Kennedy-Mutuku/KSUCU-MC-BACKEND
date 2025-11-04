const Document = require('../models/documents');
const DocumentCategory = require('../models/documentCategory');
const User = require('../models/user');
const fs = require('fs');
const path = require('path');

// Create document category (Admin only)
exports.createCategory = async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const createdById = req.user?._id || req.user?.id;
    if (!createdById) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if category already exists
    const existingCategory = await DocumentCategory.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new DocumentCategory({
      name,
      description: description || '',
      color: color || '#00c6ff',
      icon: icon || '📄',
      createdBy: createdById
    });

    await category.save();

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

// Get all document categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await DocumentCategory.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 });

    res.json({
      message: 'Categories retrieved successfully',
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

// Upload document for a specific user (Admin only)
exports.uploadDocument = async (req, res) => {
  try {
    const { userId, description, categoryId, categoryName, expiryDate, notes } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      // Clean up uploaded file
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: 'User not found' });
    }

    // Get the current admin/uploader ID from the token
    const uploadedById = req.user?._id || req.user?.id;
    if (!uploadedById) {
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Create document record
    const document = new Document({
      userId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: uploadedById,
      description: description || '',
      category: categoryId || null,
      categoryName: categoryName || 'Uncategorized',
      uploadedByAdmin: true,
      expiryDate: expiryDate || null,
      notes: notes || ''
    });

    await document.save();
    await document.populate('uploadedBy', 'username email');

    res.status(201).json({
      message: 'Document uploaded successfully',
      document
    });
  } catch (error) {
    // Clean up file if error occurs
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Error deleting file:', e);
      }
    }
    console.error('Error uploading document:', error);
    res.status(500).json({ message: 'Error uploading document', error: error.message });
  }
};

// Get documents for logged-in user
exports.getUserDocuments = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const documents = await Document.find({ userId, isActive: true })
      .populate('uploadedBy', 'username email')
      .sort({ uploadedAt: -1 });

    res.json({
      message: 'Documents retrieved successfully',
      documents
    });
  } catch (error) {
    console.error('Error fetching user documents:', error);
    res.status(500).json({ message: 'Error fetching documents', error: error.message });
  }
};

// Download document
exports.downloadDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user?._id || req.user?.id;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user owns the document
    if (document.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Update download metadata
    document.downloadedAt = new Date();
    document.downloadCount = (document.downloadCount || 0) + 1;
    await document.save();

    // Send file
    res.download(document.filePath, document.originalName, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
      }
    });
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ message: 'Error downloading document', error: error.message });
  }
};

// View document (return file content)
exports.viewDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user?._id || req.user?.id;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user owns the document
    if (document.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Send file with inline disposition (for viewing)
    res.sendFile(document.filePath, {
      headers: {
        'Content-Type': document.mimeType
      }
    });
  } catch (error) {
    console.error('Error viewing document:', error);
    res.status(500).json({ message: 'Error viewing document', error: error.message });
  }
};

// Delete document (user or admin)
exports.deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user?._id || req.user?.id;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user owns the document or is admin
    const isOwner = document.userId.toString() === userId.toString();
    const isAdmin = req.user?.role === 'admin' || req.headers.authorization?.includes('sadmin');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete file from disk
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete document record
    await Document.findByIdAndDelete(documentId);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Error deleting document', error: error.message });
  }
};

// Get all documents for a specific user (Admin only)
exports.getUserDocumentsAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const documents = await Document.find({ userId })
      .populate('userId', 'username email')
      .populate('uploadedBy', 'username email')
      .sort({ uploadedAt: -1 });

    res.json({
      message: 'User documents retrieved successfully',
      documents
    });
  } catch (error) {
    console.error('Error fetching user documents (admin):', error);
    res.status(500).json({ message: 'Error fetching documents', error: error.message });
  }
};

// Get all documents (Admin only)
exports.getAllDocumentsAdmin = async (req, res) => {
  try {
    const documents = await Document.find()
      .populate('userId', 'username email reg course yos')
      .populate('uploadedBy', 'username email')
      .sort({ uploadedAt: -1 });

    res.json({
      message: 'All documents retrieved successfully',
      documents,
      total: documents.length
    });
  } catch (error) {
    console.error('Error fetching all documents:', error);
    res.status(500).json({ message: 'Error fetching documents', error: error.message });
  }
};

// Delete document as admin
exports.deleteDocumentAdmin = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete file from disk
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete document record
    await Document.findByIdAndDelete(documentId);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document (admin):', error);
    res.status(500).json({ message: 'Error deleting document', error: error.message });
  }
};

// Get admin dashboard with all documents and users
exports.getAdminDashboard = async (req, res) => {
  try {
    const { searchTerm, categoryId, status, sortBy } = req.query;

    // Build filter object
    let filter = {};

    if (categoryId) {
      filter.category = categoryId;
    }

    if (status) {
      filter.status = status;
    }

    let documents = await Document.find(filter)
      .populate('userId', 'username email phone reg course yos et ministry')
      .populate('uploadedBy', 'username email')
      .populate('category', 'name color icon');

    // Apply search filter
    if (searchTerm) {
      documents = documents.filter(doc =>
        doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.userId.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.userId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    if (sortBy === 'name') {
      documents.sort((a, b) => a.originalName.localeCompare(b.originalName));
    } else if (sortBy === 'size') {
      documents.sort((a, b) => b.fileSize - a.fileSize);
    } else if (sortBy === 'date') {
      documents.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    } else {
      // Default: sort by date descending
      documents.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    }

    // Get categories for filter
    const categories = await DocumentCategory.find({ isActive: true }).sort({ order: 1 });

    // Get statistics
    const stats = {
      totalDocuments: documents.length,
      totalUsers: [...new Set(documents.map(d => d.userId._id.toString()))].length,
      totalCategories: categories.length,
      byStatus: {
        active: documents.filter(d => d.status === 'active').length,
        archived: documents.filter(d => d.status === 'archived').length,
        expired: documents.filter(d => d.status === 'expired').length
      }
    };

    res.json({
      message: 'Dashboard data retrieved successfully',
      documents,
      categories,
      stats
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ message: 'Error fetching dashboard', error: error.message });
  }
};

// Update document status (Admin only)
exports.updateDocumentStatus = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { status } = req.body;

    if (!['active', 'archived', 'expired'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const document = await Document.findByIdAndUpdate(
      documentId,
      { status },
      { new: true }
    )
      .populate('userId', 'username email')
      .populate('uploadedBy', 'username email')
      .populate('category', 'name color icon');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json({
      message: 'Document status updated successfully',
      document
    });
  } catch (error) {
    console.error('Error updating document status:', error);
    res.status(500).json({ message: 'Error updating document status', error: error.message });
  }
};

// Archive document (Admin only)
exports.archiveDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findByIdAndUpdate(
      documentId,
      { status: 'archived' },
      { new: true }
    )
      .populate('userId', 'username email')
      .populate('uploadedBy', 'username email');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json({
      message: 'Document archived successfully',
      document
    });
  } catch (error) {
    console.error('Error archiving document:', error);
    res.status(500).json({ message: 'Error archiving document', error: error.message });
  }
};
