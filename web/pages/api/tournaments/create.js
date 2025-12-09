export default async function handler(req,res){
  if(req.method !== 'POST') return res.status(405).end();
  // This endpoint should be implemented server-side to create tournaments
  res.json({ ok:true, message: 'Create tournament endpoint (stub)' });
}
