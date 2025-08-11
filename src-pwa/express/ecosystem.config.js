module.exports = {
  apps: [
    {
      name: 'rafi-server',
      script: 'index.js',
      cwd: '/opt/rafi-server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_file: '.env',
      log_file: '/var/log/rafi-server/combined.log',
      out_file: '/var/log/rafi-server/out.log',
      error_file: '/var/log/rafi-server/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Restart policy
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      // Error handling
      kill_timeout: 5000,
      listen_timeout: 8000,
      // Monitoring
      pmx: true,
      // Health check
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
    },
  ],
};
