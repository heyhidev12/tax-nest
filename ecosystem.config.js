module.exports = {
    apps: [
      {
        name: 'tax-nest-api',
        script: 'dist/main.js',
  
        instances: 1,
        exec_mode: 'fork',
  
        // Default (development)
        env: {
          NODE_ENV: 'development',
          PORT: 3000
        },
  
        // Production mode
        env_production: {
          NODE_ENV: 'production',
          PORT: 3000
        },
  
        // Auto restart settings
        autorestart: true,
        max_memory_restart: '800M',
  
        // Logs
        error_file: './logs/pm2-error.log',
        out_file: './logs/pm2-out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,
  
        kill_timeout: 5000
      }
    ]
  };
  