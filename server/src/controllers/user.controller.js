
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find()
    res.status(200).json({
        users
    })
})

export {getAllUsers}