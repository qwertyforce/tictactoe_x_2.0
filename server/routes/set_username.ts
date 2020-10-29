import db_ops from './../helpers/db_ops'
import { validationResult } from 'express-validator'
import { Request, Response } from 'express';
import { RecaptchaResponseV3 } from 'express-recaptcha/dist/interfaces';

async function set_username(req: Request, res: Response) {
    const recaptcha_score = (req.recaptcha as RecaptchaResponseV3)?.data?.score
    if (req.recaptcha?.error || (typeof recaptcha_score === "number" && recaptcha_score < 0.5)) {
        return res.status(403).json({
            message: "Captcha error"
        });
    }
    const errors = validationResult(req);
    const ERROR_MESSAGE = "Username is not valid";
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: ERROR_MESSAGE
        });
    }
    const regex = /^[A-Za-z0-9]+$/
    const username = req.body.username;

    const user = await db_ops.activated_user.find_user_by_id(req.session?.user_id)
    if (user[0]) { //if exists
        if (user[0].username === "") {
            if (regex.test(username)) {
                const users = await db_ops.activated_user.find_user_by_username(username); //find users with the same username
                if (users.length === 0) { //no users with same username exist
                    req.session!.username=username
                    db_ops.activated_user.set_username(user[0].id, username)
                    res.json({
                        message: "success"
                    })
                    return
                }else{
                    res.status(403).json({
                        message: "The username is already taken"
                    })
                }
            }
        }
    }
    res.status(403).json({
        message: ERROR_MESSAGE
    })

}

export default set_username;