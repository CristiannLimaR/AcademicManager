import pkg from "bcryptjs"
import User from "../user/user.model.js"
import { generateJWT } from "../helpers/generate-jwt.js"

const {hash, compare} = pkg

export const login = async (req, res) => {
    
    const { email, password, username } = req.body;

    try {

        const user = await User.findOne({
            $or: [{ email }, { username }]
        })

        if (!user) {
            return res.status(400).json({
                msg: "Incorrect credentials, Email does not exist in the database",
            });
        }

        if (!user.state) {
            return res.status(400).json({
                msg: "The user does not exist in the database",
            });
        }

        const validPassword = await compare(password, user.password);


        if (!validPassword) {
            return res.status(400).json({
                msg: 'The password is incorrect'
            })
        }

        const token = await generateJWT(user.id)


        res.status(200).json({
            msg: 'Successful login',
            userDetails: {
                username: user.username,
                token: token,
                profilePicture: user.profilePicture
            }
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: "Server error",
            error: error.message
        });
    }
}

export const register = async (req, res) => {
    try {
        const data = req.body;

        const encryptedPassword = await hash(data.password, 10);
        const user = await User.create({
            name: data.name,
            surname: data.surname,
            username: data.username,
            email: data.email,
            phone: data.phone,
            password: encryptedPassword,
            role: data.role
        })

        return res.status(201).json({
            msg: 'User registered successfully',
            userDetails: {
                user: user.email
            }
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "User registration failed",
            err: error.message
        })
    }
};