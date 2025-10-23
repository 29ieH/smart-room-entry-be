FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]


FROM node:18-alpine

WORKDIR /app

# # Copy package.json & package-lock.json
# COPY package*.json ./
# COPY prisma ./prisma
# RUN npx prisma generate
# RUN npm install --production
# COPY dist ./dist
# COPY src/locales ./src/locales
# # Copy views & public
# COPY views ./views
# COPY public ./public
# COPY public/vendor ./public/vendor
# COPY src/mail/templates ./src/mail/templates
# # Expose port
# EXPOSE 3000

# ENV NODE_ENV=production

# # Chạy app
# CMD ["node", "dist/src/main.js"]
