# Use any Node.js base image that you want (as long as it's Alpine)!
FROM node:22-alpine:3.19

# Set the working directory to /quasar-form-builder
WORKDIR /quasar-form-builder

# Copy the package.json file into the working directory before copying the rest of the files to cache the dependencies
COPY package.json /quasar-form-builder

# Install the dependencies, you might want to use yarn or pnpm instead
RUN pnpm install

# Copy the rest of the files into the working directory
COPY . /quasar-form-builder

# Build the application, again, use yarn or pnpm if you want
RUN pnpm run build

# Start the application. This is the default command for Nuxt 3
CMD ["node", ".output/server/index.mjs"] 
