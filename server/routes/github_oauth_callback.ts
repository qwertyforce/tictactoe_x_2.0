/* eslint-disable @typescript-eslint/no-non-null-assertion */
import db_ops from './../helpers/db_ops';
import config from '../../config/config';
import axios from 'axios';
import {Request, Response} from 'express';
async function github_oauth_callback(req:Request, res:Response) {
    const code = req.query.code;
    try {
        const result = await axios({
            method: 'post',
            url: `https://github.com/login/oauth/access_token?client_id=${config.GITHUB_CLIENT_ID}&client_secret=${config.GITHUB_CLIENT_SECRET}&code=${code}`,
            headers: {
                accept: 'application/json'
            }
        })
        const access_token = result.data.access_token
        console.log(result.data.access_token)

        const result2 = await axios({
            method: 'get',
            url: 'https://api.github.com/user',
            headers: {
                accept: 'application/json',
                Authorization: 'token ' + access_token
            }
        })
        const oauth_id = result2.data.id
        console.log(oauth_id)
        const users = await db_ops.activated_user.find_user_by_oauth_id(oauth_id)
        if (users.length === 0) {
            const usr_id = await db_ops.activated_user.create_new_user_activated_github(oauth_id)
            req.session!.user_id = usr_id;
        } else {
            req.session!.user_id = users[0].id;
        }
        req.session!.authed = true;
        res.redirect(config.domain)
    } catch (e) {
        console.log(e)
    }
}

export default github_oauth_callback;