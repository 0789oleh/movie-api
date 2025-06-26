const jwt = require('jsonwebtoken');

const payload = {
  userId: 1,
  email: "test@example.com"
};

const secret = 'ваш_новый_секрет';

// Генерация с текущим временем
const token = jwt.sign(payload, secret, {
  algorithm: 'HS256',
  expiresIn: '1d' // Используем настройку из .env
});

console.log('Generated token:', token);

try {
  const decoded = jwt.verify(token, secret);
  console.log('Verification success!');
} catch (err) {
  console.error('Verification failed:', err);
}

