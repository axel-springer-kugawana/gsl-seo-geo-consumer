
import { ClassifiedPublicationDto, ClassifiedPublicationDtoSchema } from 'dtos/classified-publication.dto';
import { ClassifiedDto, ClassifiedResponseDto, ClassifiedResponseDtoSchema } from 'dtos/classified.dto';
import {
    FastifyInstance,
    FastifyPluginAsync
} from 'fastify';
import fp from 'fastify-plugin';
import { IHeaders } from './headers';
import { ErrorDto, ErrorSchema } from 'dtos/problem-details.dto';

const Classifieds: FastifyPluginAsync = async (server: FastifyInstance) => {
    server.get<{ Params: { id: string }, Headers: IHeaders, Reply: ClassifiedResponseDto | ErrorDto }>("/classified/:id", {
        schema: {
            tags: ["Default"],
            response: {
                200: ClassifiedResponseDtoSchema,
                401: ErrorSchema
            },
            params: {
                id: { type: 'string' }
            }
        },
        handler: async (req, res) => {
            const { id } = req.params;
            return { id }

        },

    });

    server.delete<{ Params: { id: string }, Reply: ClassifiedDto | {} }>("/classified/:id", {
        schema: {
            tags: ["Default"],
            response: {
                201: {

                }
            },
            params: {
                id: { type: 'string' }
            }
        },
        handler: (req, res) => {

            const { id } = req.params

            res.send({ id });
        },

    });

    server.put<{ Params: { id: string }, Body: ClassifiedPublicationDto, Reply: ClassifiedDto | {} }>("/classified/:id/publication", {
        schema: {
            tags: ["Default"],
            body: ClassifiedPublicationDtoSchema,
            response: {
                201: {

                }
            },
            params: {
                id: { type: 'string' }
            }
        },
        handler: (req, res) => {

            const { id } = req.params

            res.send({ id });
        },

    });


};
export const classifiedsRoute = fp(Classifieds);