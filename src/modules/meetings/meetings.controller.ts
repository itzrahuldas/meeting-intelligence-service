import { Request, Response, NextFunction } from 'express';
import { meetingsService } from './meetings.service';
import { sendSuccess } from '../../utils/response';

export class MeetingsController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const meeting = await meetingsService.createMeeting(req.user!.userId, req.body);
      sendSuccess(res, meeting, 201);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await meetingsService.listMeetings(req.user!.userId, req.query as any);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const meeting = await meetingsService.getMeetingById(req.user!.userId, req.params.id as string);
      sendSuccess(res, meeting);
    } catch (error) {
      next(error);
    }
  }

  async analyze(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analysis = await meetingsService.analyzeMeeting(req.user!.userId, req.params.id as string);
      sendSuccess(res, analysis);
    } catch (error) {
      next(error);
    }
  }
}

export const meetingsController = new MeetingsController();
