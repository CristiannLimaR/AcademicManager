import { response, request } from "express";
import User from "./user.model.js";



export const getUsers = async (req = request, res = response) => {
    try {
        const { limit = 10, offset = 0 } = req.query;
        const query = { state: true };

        const [total, users] = await Promise.all([
            User.countDocuments(query),
            User.find(query).skip(Number(offset)).limit(Number(limit)),
        ]);

        res.status(200).json({
            success: true,
            total,
            users,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            msg: "Error al obtener usuarios",
            error,
        });
    }
};


export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(400).json({
                success: false,
                msg: "Usuario no encontrado",
            });
        }

        res.status(200).json({
            succes: true,
            user,
        });
    } catch (error) {
        req.status(500).json({
            success: false,
            msg: "Error al obtener Usuario",
            error,
        });
    }
};

export const updateUser = async (req, res = response) => {
    try {
        const { id } = req.params;
        const { _id, password, ...data } = req.body;
        if (password) {
            data.password = await hash(password);
        }
        const user = await User.findByIdAndUpdate(id, data, { new: true });

        res.status(200).json({
            success: true,
            msg: "Usuario actualizado",
            user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            msg: "Error al actualizar usuario",
            error,
        });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const authenticatedUser = req.user;

        
        if (authenticatedUser.id !== id) {
            return res.status(403).json({
                success: false,
                msg: "You can only delete your own account",
            });
        }

        
        const user = await Usuario.findByIdAndUpdate(
            id,
            { state: false },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                msg: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            msg: "User deactivated successfully",
            user,
            authenticatedUser,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            msg: "Error deactivating user",
            error,
        });
    }
};

