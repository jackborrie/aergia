// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import User                                from 'App/Models/User';
import { hasGroup, hasGroup as _hasGroup } from 'App/Shared/shared';
import Hash                                from '@ioc:Adonis/Core/Hash';
import { DateTime }                        from 'luxon';
import Logger                              from '@ioc:Adonis/Core/Logger';

export default class UsersController {
    public async index ({ auth, request, response }) {
        let userId = auth.use ('api').user.id;

        Logger.info (`User-Index: Attempting to get all users using account ${ userId }`);

        let user = await User.query ().where ('user_id', userId).preload ('userGroups').first ();

        if (!user) {
            Logger.warn (`User-Index: Current user does not exist.`);
            return response.unauthorized ();
        }

        if (!_hasGroup (user.userGroups, ['admin_read', 'admin_write'])) {
            Logger.warn (`User-Index: Current user is not an admin user.`);
            return response.unauthorized ('User not an admin');
        }

        // Boring old pagination stuff.
        let offset         = request.header ('offset') || 1;
        let perPage        = request.header ('perPage') || 10;
        let orderBy        = request.header ('orderBy') || 'username';
        let orderDirection = request.header ('orderDirection') || 'asc';

        return await User.query ()
                         .preload ('userGroups')
                         .orderBy (orderBy, orderDirection)
                         .paginate (offset, perPage);
    }

    public async read ({ auth, request, response }) {
        let currentUserId = auth.use ('api').user.id;

        Logger.info ('testing that this is actually');

        let currentUser = await User.query ().where ('user_id', currentUserId).preload ('userGroups').first ();

        if (!currentUser) {
            return response.unauthorized ();
        }

        let requestUserId = request.params ().id;

        if (!await currentUser.hasAdminRead () && currentUserId !== requestUserId) {
            return response.unauthorized ();
        }

        let requestUser = await User.find (requestUserId);

        if (!requestUser) {
            return response.notFound ();
        }

        return requestUser;
    }

    public async update ({ auth, request, response }) {
        let currentUserId = auth.use ('api').user.id;
        let requestUserId = request.params ().id;

        let currentUser = await User.query ().where ('user_id', currentUserId).preload ('userGroups').first ();

        if (!currentUser) {
            return response.unauthorized ();
        }

        if (!hasGroup (currentUser.userGroups, 'admin_write') && currentUserId !== requestUserId) {
            return response.unauthorized ();
        }

        let requestUser = await User.find (requestUserId);

        if (!requestUser) {
            return response.notFound ();
        }

        let email    = request.body.email;
        let username = request.body.username;
        let password = request.body.password;

        requestUser.email     = email ?? requestUser.email;
        requestUser.username  = username ?? requestUser.username;
        requestUser.password  = password ? await Hash.make (password) : requestUser.password;
        requestUser.updatedAt = DateTime.now ();

        try {
            await requestUser.save ();
        } catch (e) {
            return response.internalServerError (e);
        }

        return requestUser;
    }

    public async delete ({ auth, request, response }) {
        let currentUserId = auth.use ('api').user.id;

        let currentUser = await User.query ().where ('user_id', currentUserId).preload ('userGroups').first ();

        if (!currentUser) {
            return response.unauthorized ();
        }

        let requestUserId = request.params ().id;

        if (!hasGroup (currentUser.userGroups, 'admin_write') && requestUserId !== currentUserId) {
            return response.unauthorized ();
        }

        let requestUser = await User.find (requestUserId);

        if (!requestUser) {
            return response.notFound ();
        }

        try {
            await requestUser.delete ();
        } catch (e) {
            return response.internalServerError (e);
        }

        return requestUser;
    }

}
