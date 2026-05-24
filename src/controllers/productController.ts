import { Request, Response } from 'express';
import Product from '../models/Product';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    // Map camelCase to snake_case for frontend
    const mappedProducts = products.map(p => ({
      ...p.toObject(),
      id: p.id,
      cost_price: p.costPrice || "",
      image_url: p.imageUrl || "",
      image_urls: p.imageUrls || [],
    }));
    res.json(mappedProducts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // Map camelCase to snake_case for frontend
    res.json({
      ...p.toObject(),
      id: p.id,
      cost_price: p.costPrice || "",
      image_url: p.imageUrl || "",
      image_urls: p.imageUrls || [],
      category: p.category,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  const { name, category, price, cost_price, color, quantity, description } = req.body;
  
  const imageUrls: string[] = [];
  if (req.files && Array.isArray(req.files)) {
    req.files.forEach((file: any) => {
      imageUrls.push(file.location || `/uploads/${file.filename}`);
    });
  }
  const imageUrl = imageUrls.length > 0 ? imageUrls[0] : "";

  try {
    const p = await Product.create({
      name,
      category,
      price,
      costPrice: cost_price,
      color,
      quantity: quantity || 0,
      imageUrl,
      imageUrls,
      description,
    });
    
    res.status(201).json({
      ...p.toObject(),
      id: p.id,
      cost_price: p.costPrice || "",
      image_url: p.imageUrl || "",
      image_urls: p.imageUrls || [],
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updateData: any = { ...req.body };
    // Map snake_case to camelCase for DB
    if (req.body.cost_price !== undefined) updateData.costPrice = req.body.cost_price;

    let finalImageUrls: string[] = [];
    if (req.body.existing_images !== undefined) {
      try {
        finalImageUrls = typeof req.body.existing_images === 'string'
          ? JSON.parse(req.body.existing_images)
          : req.body.existing_images;
      } catch (e) {
        finalImageUrls = Array.isArray(req.body.existing_images)
          ? req.body.existing_images
          : [req.body.existing_images];
      }
    } else {
      finalImageUrls = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : (product.imageUrl ? [product.imageUrl] : []);
    }

    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file: any) => {
        finalImageUrls.push(file.location || `/uploads/${file.filename}`);
      });
    }

    updateData.imageUrls = finalImageUrls;
    updateData.imageUrl = finalImageUrls.length > 0 ? finalImageUrls[0] : "";

    if (req.body.quantity !== undefined) {
      const adjustment = parseFloat(req.body.quantity);
      if (adjustment < 0) {
        updateData.quantity = product.quantity + adjustment;
      } else {
        updateData.quantity = adjustment;
      }
    }

    const p = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!p) return res.status(404).json({ message: 'Product not found' });

    res.json({
      ...p.toObject(),
      id: p.id,
      cost_price: p.costPrice || "",
      image_url: p.imageUrl || "",
      image_urls: p.imageUrls || [],
    });
  } catch (error: any) {
    console.error('Update Product Error:', error);
    res.status(400).json({ message: error.message || 'Error updating product' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    await product.deleteOne();
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
