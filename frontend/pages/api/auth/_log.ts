import type { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // Handle NextAuth _log endpoint for client-side logging
  if (req.method === 'POST') {
    // Accept the log and return success
    res.status(200).json({ ok: true });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};