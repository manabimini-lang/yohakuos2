import { NextApiRequest, NextApiResponse } from 'next';
import { StrategyLearningService } from '@/lib/lifeos/strategy-learning-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  
  const userId = req.headers['x-user-id'] as string || 'test-user-id';

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const profile = await StrategyLearningService.generateUserStrategyProfile(userId);
    return res.status(200).json(profile);
  } catch (error) {
    console.error('Error generating user strategy profile:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}