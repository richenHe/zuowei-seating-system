module.exports = {
  apps: [{
    name: 'zuowei-seating-system',
    script: 'dist-server/server/index.js',
    cwd: '/home/devbox/project/zuowei-seating-system',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
