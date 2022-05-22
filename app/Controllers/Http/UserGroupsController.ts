// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import User         from 'App/Models/User';
import { hasGroup } from 'App/Shared/shared';
import { schema }   from '@ioc:Adonis/Core/Validator';
import Group        from 'App/Models/Group';

export default class UserGroupsController {
    public async create ({ auth, request, response }) {
        let currentUserId = auth.use ('api').user.id;

        let currentUser = await User.query ().where ('user_id', currentUserId).preload ('userGroups').first ();

        if (!currentUser) {
            return response.notFound ();
        }

        if (!hasGroup (currentUser.userGroups, 'admin_write')) {
            return response.unauthorized ();
        }

        let userGroupSchema = schema.create ({
            userId:  schema.number (),
            groupId: schema.number (),
        });

        let payload;
        try {
            payload = await request.validate ({ schema: userGroupSchema });
        } catch (e) {
            return response.badRequest ();
        }

        let user  = await User.find (payload.userId);
        let group = await Group.find (payload.groupId);

        if (!user || !group) {
            return response.badRequest ();
        }

        try {
            user.related ('userGroups').attach (payload.groupId);
        } catch (e) {
            return response.internalServerError (e);
        }

        return response.ok ();
    }

    public async delete ({ auth, request, response }) {
        let currentUserId = auth.use ('api').user.id;

        let currentUser = await User.query ().where ('user_id', currentUserId).preload ('userGroups').first ();

        if (!currentUser) {
            return response.notFound ();
        }

        if (!hasGroup (currentUser.userGroups, 'admin_write')) {
            return response.unauthorized ();
        }

        let userGroupSchema = schema.create ({
            userId:  schema.number (),
            groupId: schema.number (),
        });

        let payload;
        try {
            payload = await request.validate ({ schema: userGroupSchema });
        } catch (e) {
            return response.badRequest ();
        }

        let user  = await User.find (payload.userId);
        let group = await Group.find (payload.groupId);

        if (!user || !group) {
            return response.badRequest ();
        }

        try {
            await user.related ('userGroups').detach (payload.groupId);
        } catch (e) {
            return response.internalServerError (e);
        }

        return response.ok ();
    }
}