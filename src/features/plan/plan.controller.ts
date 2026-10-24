import { type Response, type Request } from 'express';

import { ApiError } from '../../errors/ApiError.js';
import { getCurrency } from '../../lib/geo.js';
import { prisma } from '../../lib/prisma.js';
import { sendResponse } from '../../utils/response.js';

const getCreditPackages = async (req: Request, res: Response) => {
  const currency = await getCurrency(req);

  const packages = await prisma.creditPlan.findMany({
    include: {
      price: {
        where: {
          currency,
        },
        select: {
          amountMinor: true,
          currency: true,
        },
      },
    },
  });

  if (!packages) throw new ApiError('Error occurred while retrieving the credit packages', 500);

  sendResponse(res, 200, 'Retrieved Credit packages successfully', {
    packages,
  });
};

const getSubscriptionPlans = async (req: Request, res: Response) => {
  const currency = await getCurrency(req);

  const plans = await prisma.subscriptionPlan.findMany({
    include: {
      price: {
        where: {
          currency,
        },
        select: {
          amountMinor: true,
          currency: true,
        },
      },
    },
  });

  if (!plans) throw new ApiError('Error occurred while retrieving the subscription plans', 500);

  sendResponse(res, 200, 'Retrieved Subscription plans successfully', {
    plans,
  });
};

export { getCreditPackages, getSubscriptionPlans };
