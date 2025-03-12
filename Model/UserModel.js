const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  userName: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true, unique: true },
  whatsappNumber: { type: String, required: false },
  address: { type: String, required: true },
  verificationToken: { type: String },
  verificationCode: { type: String },
  verificationTokenExpires: { type: Date },
  isVerified: { type: Boolean, default: false }, // This field will indicate if the email is verified
  city: {
    type: String,
    enum: [
      "Karachi",
      "Lahore",
      "Islamabad",
      "Rawalpindi",
      "Faisalabad",
      "Peshawar",
      "Quetta",
      "Multan",
      "Sialkot",
      "Gujranwala",
      "Bahawalpur",
      "Hyderabad",
      "Sargodha",
      "Sukkur",
      "Mardan",
      "Abbottabad",
      "Swat",
      "Larkana",
      "Sheikhupura",
      "Multan",
    ],
    required: true,
  },
  userField: {
    type: String,

    enum: ["buyer", "seller"],
    required: true, // Jab register ho to yeh zaroor select ho
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  password: { type: String, required: true },
  // Seller ke extra fields
  sellerDetails: {
    shopLocation: {
      type: String,
     
      required: function () {
        return this.userField === "seller";
      },
    },
    deliveryRange: {
      type: Number,
      
      enum: [1, 2, 3],
      required: function () {
        return this.userField === "seller";
      },
    },
    dairySource: {
      type: String,
 
      enum: ["self Dariry shop", "Buy from market"],
      required: function () {
        return this.userField === "seller";
      },
    },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("users", userSchema);
