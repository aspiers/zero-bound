import type { NextApiRequest, NextApiResponse } from 'next'
import { google } from 'googleapis';
import { getRyanairDetails, getLufthansaDetails, getKlmDetails } from '../../extractors';
import { FlightDetails } from '../../extractors/types';

const httpMethod = 'GET'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === httpMethod) {
    const auth = req.headers.authorization

    const gmail = google.gmail({ version: 'v1', headers: { Authorization: `Bearer ${auth}` } });
    const messages: Array<FlightDetails> = [];

    try {
      const { data: { messages: list } } = await gmail.users.messages.list({
        userId: 'me',
        q: 'subject: ryanair' // from: klm | ryanair
      });

      if (list?.length) {
        for (const { id } of list) {
          const { data: { payload } } = await gmail.users.messages.get({
            userId: 'me',
            id: id ?? ''
          });

          const data = ((payload?.parts?.length ? payload.parts?.[1]?.body?.data : payload?.body?.data) ?? '')
          const decodedBody = Buffer.from(data, 'base64').toString();

          const response = getRyanairDetails(decodedBody);
          // const response = getLufthansaDetails(decodedBody);
          // const response = getKlmDetails(decodedBody);

          messages.push(response);
        }
      }
    } catch (err: any) {
      console.log('Backend ==> ', err);

      return res.status(400).json({
        message: (err as Error).message
      })
    }

    return res.status(200).json({ data: messages })
  }

  return res.json({})
}