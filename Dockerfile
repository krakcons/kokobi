FROM oven/bun

COPY . .

RUN bun install --frozen-lockfile

EXPOSE 3000

CMD ["bun", "start"]
