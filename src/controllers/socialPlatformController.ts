import { Request, Response } from 'express';
import SocialPlatform from '../models/SocialPlatform';

export const getSocialPlatforms = async (req: Request, res: Response) => {
  try {
    const platforms = await SocialPlatform.find({ isActive: true });
    res.json(platforms.map(p => ({
      id: p._id,
      name: p.name,
      url: p.url,
      icon: p.icon,
      handle: p.handle
    })));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createSocialPlatform = async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.icon = (req.file as any).location || `/uploads/${req.file.filename}`;
    }
    const platform = new SocialPlatform(data);
    await platform.save();
    res.status(201).json({
      id: platform._id,
      name: platform.name,
      url: platform.url,
      icon: platform.icon,
      handle: platform.handle
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateSocialPlatform = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    if (req.file) {
      data.icon = (req.file as any).location || `/uploads/${req.file.filename}`;
    }
    const platform = await SocialPlatform.findByIdAndUpdate(id, data, { new: true });
    if (!platform) {
      return res.status(404).json({ message: 'Platform not found' });
    }
    res.json({
      id: platform._id,
      name: platform.name,
      url: platform.url,
      icon: platform.icon,
      handle: platform.handle
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
