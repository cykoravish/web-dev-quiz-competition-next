// user.model.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  instaId: string;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    instaId: { type: String },
  },
  { timestamps: true }
);

const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default UserModel;
