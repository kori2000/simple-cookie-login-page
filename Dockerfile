FROM node:lts-slim

# Expose Port from OC Template
ARG expose_port

# Create Application directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --loglevel=error

# Copy all files | Only if needed
COPY . .

# Setup all Folder Permissions
RUN chown -R :0 src \
    && chmod -R a+w src \
    && chown -R :0 src/public \
    && chmod -R a+w src/public

# Application exposed port from OC Template
EXPOSE ${expose_port} 

# Application start script ignored
CMD [ "npm", "start" ]
