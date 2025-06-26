# Базовый образ Node.js (выберите версию, совместимую с вашим проектом)
FROM node:jod-slim

# Установите рабочую директорию
WORKDIR /app

# Скопируйте package.json и package-lock.json (или yarn.lock)
COPY package*.json ./

# Установите зависимости
RUN npm install

# Скопируйте исходный код
COPY . .

# Скомпилируйте TypeScript в JavaScript
RUN npm run build

# Укажите порт, который будет использовать приложение
EXPOSE 8050

# Команда для запуска приложения
CMD ["npm", "start"]