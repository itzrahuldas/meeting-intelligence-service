import { Request, Response, NextFunction } from 'express';
import { actionItemsService } from './actionItems.service';
import { sendSuccess } from '../../utils/response';

export class ActionItemsController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actionItem = await actionItemsService.createActionItem(req.user!.userId, req.body);
      sendSuccess(res, actionItem, 201);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await actionItemsService.listActionItems(req.user!.userId, req.query as any);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actionItem = await actionItemsService.getActionItemById(
        req.user!.userId,
        req.params.id as string
      );
      sendSuccess(res, actionItem);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actionItem = await actionItemsService.updateActionItemStatus(
        req.user!.userId,
        req.params.id as string,
        req.body
      );
      sendSuccess(res, actionItem);
    } catch (error) {
      next(error);
    }
  }

  async getOverdue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const overdueItems = await actionItemsService.getOverdueActionItems();
      sendSuccess(res, overdueItems);
    } catch (error) {
      next(error);
    }
  }
}

export const actionItemsController = new ActionItemsController();
