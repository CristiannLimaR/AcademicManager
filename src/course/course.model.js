import { Schema, model } from "mongoose";

const CourseSchema = Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    status: {
        type: Boolean,
        default: true
    },
    students: [
        {
            type: Schema.Types.ObjectId,
            ref: 'user'
        }
    ],
    teacher: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    }
},
    {
        timestamps: true,
        versionKey: false
    }
);

export default model('Course', CourseSchema);