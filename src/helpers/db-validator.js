import Role from '../role/role.model.js'
import User from '../user/user.model.js'

export const isRoleValid = async (role = '') => {
    const existRole = await Role.findOne({ role });

    if (!existRole) {
        throw new Error(`Role ${role} does not exist in the database`);
    }

    return true;
};


export const existsEmail = async (email = '') => {
    const existEmail = await User.findOne({ email })

    if (existEmail) {
        throw new Error(`Email ${email} already exists in the database`);

    }
}

export const existsUserById = async (id = ``) => {
    const existsUser = await User.findById(id);
    if (!existsUser) {
        throw new Error(`The ID ${id} does not exist in the database`);

    }
}