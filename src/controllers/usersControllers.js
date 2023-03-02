const { hash, compare } = require("bcryptjs");
const knex = require("../database/knex");
const AppError = require("../utils/AppError");

class UserController {
    async create(request, response) {
        const {name, email, password} = request.body;

        const checkUserExists = await knex("users")
        .where({email: email});

        if(checkUserExists[0]) {
            throw new AppError("This e-mail already in use.");
        }

        const hashedPassword = await hash(password, 8);

        await knex("users").insert({
            name,
            email,
            password: hashedPassword
        })

        return response.status(201).json();
    }

    async update(request, response) {
        const { name, email, password, old_password } = request.body;
        const user_id = request.user.id;

        const user = await knex("users")
        .where({ id: user_id });

        if(!user[0]) {
            throw new AppError("User not found.")
        };
        const userWithUpdatedEmail = await knex("users")
        .where({email: email});
        if(userWithUpdatedEmail[0] && userWithUpdatedEmail[0].id != user_id) {
            throw new AppError("E-mail already in use.")
        };

        user.name = name ?? user.name;
        user.email = email ?? user.email;

        if(password && !old_password) {
            throw new AppError("You need to inform the old password to redefine the password.");
        };
        if(password && old_password) {
            
            const checkOldPassword = await compare(old_password, user[0].password);
            if(!checkOldPassword) {
                throw new AppError("The old password is incorrect.");
            }
            user.password = await hash(password, 8);
        };

        await knex("users")
        .where({ id: user_id })
        .update({
            name: user.name,
            email: user.email,
            password: user.password,
            updated_at: knex.fn.now()
        });
        return response.json();
    }
}

module.exports = UserController;