import { RequestHandler, Request } from 'express';
import nodemailer from 'nodemailer';
import { ApiResponse } from '../types/shared';
import { object, string } from 'yup';

export interface MailInterface {
  from?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html: string;
}

const mailSchema = object().shape({
  from: string(),
  to: string().required('缺少收件者地址'),
  cc: string(),
  bcc: string(),
  subject: string().required('缺少主旨'),
  text: string(),
  html: string().required('缺少內容'),
});

export class MailServiceController {
  public static transporter: nodemailer.Transporter;

  //SEND MAIL
  public static sendMail: RequestHandler = async (req: Request, res: ApiResponse) => {
    try {
      mailSchema.validateSync(req.body);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).send({
          message: error.message,
          result: {},
        });
      }
    }
    try {
      const { from, to, cc, bcc, subject, text, html } = req.body;
      const info = await MailServiceController.transporter.sendMail({
        from: `"Point-Pro" ${process.env.SMTP_SENDER || from}`,
        to,
        cc,
        bcc,
        subject,
        text,
        html,
      });
      res.status(200).send({
        message: '信件已寄出',
        result: info,
      });
    } catch (error) {
      console.log('catch err:', error);
      res.status(500).json({ message: 'Internal server error', result: error });
    }
  };

  public static verifyConnection: RequestHandler = async (req: Request, res: ApiResponse) => {
    try {
      const isVerify = await MailServiceController.transporter.verify();
      res.status(200).send({
        message: isVerify ? '已連接' : '未連接',
        result: isVerify,
      });
    } catch (error) {
      console.log('catch err:', error);
      res.status(500).json({ message: 'Internal server error', result: error });
    }
  };
}

MailServiceController.transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    type: 'OAuth2',
    user: process.env.GMAIL_ACCOUNT,
    clientId: process.env.GMAIL_API_CLIENT_ID,
    clientSecret: process.env.GMAIL_API_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_API_REFRESH_TOKEN,
    accessToken: process.env.GMAIL_API_ACCESS_TOKEN,
  },
});

export default MailServiceController;
