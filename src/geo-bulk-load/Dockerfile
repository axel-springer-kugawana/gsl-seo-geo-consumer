# Build context is ./src
#   docker build -f geo-bulk-load/Dockerfile -t geo-bulk-load .
#
# Fargate runs this on X86_64, so the image has to be amd64: duckdb ships
# per-platform native bindings and there is no fallback.
FROM --platform=linux/amd64 node:22-bookworm-slim AS builder

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY tsconfig.json esbuild.tasks.config.js ./
COPY shared ./shared
COPY models ./models
COPY geo-bulk-load ./geo-bulk-load

RUN npm run build:tasks


FROM --platform=linux/amd64 node:22-bookworm-slim AS runtime

ENV NODE_ENV=production \
    DUCKDB_EXTENSION_DIRECTORY=/opt/duckdb/extensions

WORKDIR /app

# Only duckdb stays out of the bundle, everything else is inlined by esbuild.
# Copied rather than reinstalled: the builder already resolved the linux-x64
# native bindings, and this keeps the runtime layer free of a package manager.
COPY --from=builder /build/node_modules/@duckdb ./node_modules/@duckdb

# httpfs and aws are baked in: an ingestion must not depend on the duckdb
# extension repository being reachable from the data subnets at run time.
RUN mkdir -p ${DUCKDB_EXTENSION_DIRECTORY} \
    && node -e "const {DuckDBInstance}=require('@duckdb/node-api'); \
        (async()=>{ \
          const i=await DuckDBInstance.create(':memory:',{extension_directory:process.env.DUCKDB_EXTENSION_DIRECTORY}); \
          const c=await i.connect(); \
          await c.run('INSTALL httpfs;'); \
          await c.run('INSTALL aws;'); \
          await c.run('INSTALL postgres;'); \
          c.closeSync(); \
        })()" \
    && chmod -R a+rX ${DUCKDB_EXTENSION_DIRECTORY}

COPY --from=builder /build/dist/geo-bulk-load/main.js ./main.js

RUN mkdir -p /tmp/duckdb && chown -R node:node /tmp/duckdb /app

USER node

ENTRYPOINT ["node", "--max-old-space-size=3072", "/app/main.js"]
