import { RequestHandler } from 'express';
import { ApiResponse } from '../types/shared';
import { prismaClient } from '../helpers';
import { differenceWith } from 'ramda';
import multer from 'multer';
import path from 'path';
import { ImgurClient } from 'imgur';

const client = new ImgurClient({
  clientId: process.env.IMGUR_CLIENTID,
  clientSecret: process.env.IMGUR_CLIENT_SECRET,
  refreshToken: process.env.IMGUR_REFRESH_TOKEN,
});

const upload = multer({
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.jpg' && ext !== '.png' && ext !== '.jpeg') {
      cb(Error('檔案格式錯誤，僅限上傳 jpg、jpeg 與 png 格式。'));
    }
    cb(null, true);
  },
}).any();

class ImgurController {
  public static createImgurHandler: RequestHandler = async (req: any, res: ApiResponse) => {
    // validate input

    try {
      upload(req, res, async () => {
        const response = await client.upload({
          image: req.files[0].buffer.toString('base64'),
          type: 'base64',
          album: process.env.IMGUR_ALBUM_ID,
        });
        return res.status(201).send({
          message: 'successfully update to imgur',
          result: response.data.link,
        });
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).send({
          message: error.message,
          result: null,
        });
      }
    }
  };
  public static deleteImgurHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input
    try {
      const album = await client.getAlbum(process.env.IMGUR_ALBUM_ID as string);
      let albumImages = album.data.images.map((e) => ({
        link: e.link,
        deletehash: e.deletehash,
      }));
      const meals = await prismaClient.meal.findMany();
      let mealImages = meals.map((e) => ({ link: e.coverUrl, deletehash: null }));

      let diff = differenceWith((x, y) => x.link === y.link, albumImages, mealImages);

      album.data.images.forEach((e) => {
        client.deleteImage(e.deletehash as string);
      });

      let result = await Promise.all(diff.map((e) => client.deleteImage(e.deletehash as string)));

      return res.status(204).send({
        message: 'successfully delete a images',
        result,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).send({
          message: error.message,
          result: null,
        });
      }
    }
  };
}

export default ImgurController;
