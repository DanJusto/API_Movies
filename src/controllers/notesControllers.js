const knex = require("../database/knex");
const AppError = require("../utils/AppError");

class NotesController {
    async create(request, response) {
        const { title, description, rating, tags } = request.body;
        const { user_id } = request.params;

        const checkTitleExists = await knex("notes")
        .where({ title });
        if(checkTitleExists[0]) {
            throw new AppError("This movie has already been added.");
        }

        if(rating < 1 || rating > 5) {
            throw new AppError("Enter a value from 1 to 5.")
        };

        const note_id = await knex("notes").insert({
            title,
            description,
            rating,
            user_id
        });

        const tagsInsert = tags.split(',').map(name => {
            return {
                note_id,
                user_id,
                name
            }
        });
        await knex("tags").insert(tagsInsert);



        return response.status(201).json();
    }

    async update(request, response) {
        const { description, rating } = request.body;
        const { id } = request.params;

        if(rating < 1 || rating > 5) {
            throw new AppError("Enter a value from 1 to 5.")
        };

        const note = await knex("notes").where({id: id});

        note.description = description ?? note.description;
        note.rating = rating ?? note.rating;

        await knex("notes")
        .where({id})
        .update({
            description: note.description,
            rating: note.rating
        });

        return response.json();
    }

    async show(request, response) {
        const { id } = request.params;

        const note = await knex("notes").where({id}).first();
        const tags = await knex("tags").where({note_id: id}).orderBy("name");

        return response.json({
            ...note,
            tags
        });
    }

    async delete(request, response) {
        const { id } = request.params;

        await knex("notes").where({ id }).delete();

        return response.json();
    }

    async index(request, response) {
        const { title, user_id, tags } = request.query;

        let notes;

        if(tags) {
            const filterTags = tags.split(',').map(tag => tag.trim());

            notes = await knex("tags")
            .select([
                "notes.id",
                "notes.title",
                "notes.user_id",
            ])
            .where("notes.user_id", user_id)
            .whereLike("notes.title", `%${title}%`)
            .whereIn("tags.name", filterTags)
            .innerJoin("notes", "notes.id", "tags.note_id")
            .orderBy("notes.title");
        } else {
            notes = await knex("notes")
            .where({ user_id })
            .whereLike("title", `%${title}%`)
            .orderBy("title");
        }
        const userTags = await knex("tags").where({ user_id });
        const notesWithTags = notes.map(note => {
            const noteTags = userTags.filter(tag => tag.note_id === note.id)
            return {
                ...note,
                tags: noteTags
            }
        })

        return response.json(notesWithTags)
    }
}

module.exports = NotesController