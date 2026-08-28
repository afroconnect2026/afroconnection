module.exports = {
  apps: [{
    name: 'afroconnect',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3000',
    instances: 2, // Use 2 instances for better performance
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    min_uptime: '10s',
    max_restarts: 10,
    kill_timeout: 5000
  }]
}
