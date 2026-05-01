// models/userModel.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

// Auto-drop the stale "username_1" index that causes E11000 on null values.
(async () => {
  try {
    await mongoose.connection.asPromise();
    const indexes = await User.collection.indexes();
    if (indexes.some((i) => i.name === "username_1")) {
      await User.collection.dropIndex("username_1");
      console.log("[userModel] Dropped stale index: username_1");
    }
  } catch (_) {}
})();

export default User;