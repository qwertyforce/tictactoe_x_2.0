import config from '../../config/config';
import {Request,Response} from 'express';
function google_oauth_redirect (_req:Request,res:Response){
	const authorizeUrl = `https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email&response_type=code&client_id=${config.GOOGLE_CLIENT_ID}&redirect_uri=${config.GOOGLE_REDIRECT_URI}`;
    res.redirect(authorizeUrl);
}

export default google_oauth_redirect;