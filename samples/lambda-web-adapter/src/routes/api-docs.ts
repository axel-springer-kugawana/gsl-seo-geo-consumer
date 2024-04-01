
import {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyPluginAsync
} from 'fastify';
import fp from 'fastify-plugin';

const DocsRoutes: FastifyPluginAsync = async (server: FastifyInstance, options: FastifyPluginOptions) => {
    server.get('/docs', {}, async (request, res) => {
        res.send(server.swagger());

    });

};
export const apiDocsRoutes = fp(DocsRoutes);