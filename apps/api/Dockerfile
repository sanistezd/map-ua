FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /workspace

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @root/api... build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /workspace /workspace
EXPOSE 4000
CMD ["pnpm", "--filter", "@root/api", "start"]
