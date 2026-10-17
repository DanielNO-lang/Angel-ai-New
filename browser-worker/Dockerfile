FROM mcr.microsoft.com/playwright:v1.55.0-noble
ENV NODE_ENV=production
ENV PORT=8787
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY policy.mjs server.mjs ./
EXPOSE 8787
USER pwuser
CMD ["npm", "start"]
