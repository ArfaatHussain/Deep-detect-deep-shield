
import { asyncHandler } from "../utils/asyncHandler.js"
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find()
    res.status(200).json({
        users
    })
})

export {getAllUsers}