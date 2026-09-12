process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-please-change";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-please-change";
process.env.DATABASE_URL = process.env.DATABASE_URL ?? "mongodb://localhost:27017/vja_central_test";
process.env.ADMIN_ORIGIN = "http://localhost:5173";

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  // Mirrors src/index.ts: wait for background index builds (e.g. the
  // Grievance text index) before any test runs a query that needs one.
  await mongoose.connection.syncIndexes();
}, 60000);

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
