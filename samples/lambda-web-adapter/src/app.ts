import Fastify from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import fastifySwagger from '@fastify/swagger';
import { apiDocsRoutes } from 'routes/api-docs';
import { classifiedsRoute } from 'routes/owner-classifieds';

const app = Fastify({}).withTypeProvider<TypeBoxTypeProvider>();
const swaggerOptions = {
    openapi: {
        info: {
            title: 'Test swagger',
            description: 'testing the fastify swagger api',
            version: '0.1.0'
        },
        servers: [{
            url: 'http://localhost'
        }],
        tags: [
            { name: 'Default' }
        ],
    },
    hideUntagged: true,
    exposeRoute: true
};


app.register(fastifySwagger, swaggerOptions);

app.register(apiDocsRoutes);
app.register(classifiedsRoute);

export default app;
