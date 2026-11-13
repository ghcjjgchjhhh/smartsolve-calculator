import learnHandler from '../learn';

export default async function handler(req: any, res: any) {
  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  req.body = { ...body, action: 'formula_questions' };
  return learnHandler(req, res);
}
