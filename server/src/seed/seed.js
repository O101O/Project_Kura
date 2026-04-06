import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Message from '../models/Message.js';

dotenv.config({ path: '.env' });

const runSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await Message.deleteMany({});
    await User.deleteMany({});

    const password = await bcrypt.hash('password123', 10);

    const [alice, bob, clara] = await User.create([
      {
        username: 'Alice Cooper',
        email: 'alice@kura.dev',
        password,
        bio: 'Product designer and coffee enthusiast.',
        friends: []
      },
      {
        username: 'Bob Martin',
        email: 'bob@kura.dev',
        password,
        bio: 'Frontend engineer. Loves clean UI.',
        friends: []
      },
      {
        username: 'Clara Smith',
        email: 'clara@kura.dev',
        password,
        bio: 'Backend developer and API nerd.',
        friends: []
      }
    ]);

    alice.friends = [bob._id];
    bob.friends = [alice._id];
    clara.friendRequests = [alice._id];
    alice.sentRequests = [clara._id];

    await alice.save();
    await bob.save();
    await clara.save();

    await Message.create([
      {
        sender: alice._id,
        receiver: bob._id,
        text: 'Hey Bob, welcome to Kura!'
      },
      {
        sender: bob._id,
        receiver: alice._id,
        text: 'Thanks Alice. The UI looks awesome.'
      }
    ]);

    console.log('Seed data created');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

runSeed();
