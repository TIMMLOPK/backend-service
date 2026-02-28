FROM oven/bun:1

WORKDIR /app

# Install dependencies (cached layer)
COPY package.json bun.lock* ./
RUN bun install

# Copy all config files needed by the dev server
COPY tsconfig.json next.config* postcss.config* ./

EXPOSE 3000

CMD ["bun", "run", "dev", "--hostname", "0.0.0.0"]
