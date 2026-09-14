const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://karinganastudio23:VIbemongodb@cluster0.oe0akin.mongodb.net/wehostheredb?retryWrites=true&w=majority';

async function inspectEmail() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('wehostheredb');
    const users = db.collection('users');

    const allUsers = await users.find({}).toArray();
    console.log('=== TODOS OS UTILIZADORES NA BD ===');
    allUsers.forEach(u => {
      console.log({
        _id: u._id,
        id: u.id,
        email: JSON.stringify(u.email),
        role: u.role,
        status: u.status,
        plan: u.plan
      });
    });
  } finally {
    await client.close();
  }
}

inspectEmail().catch(console.error);
