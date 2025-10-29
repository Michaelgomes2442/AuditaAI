import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import type { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getServerSession(req, res, authOptions);
  res.status(200).json(session || {});
};