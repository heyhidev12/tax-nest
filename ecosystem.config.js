module.exports = {
    apps: [{
        name: 'tax-nest-api',
        script: './dist/main.js',
        instances: 1,
        exec_mode: 'cluster',
        env: {
            NODE_ENV: 'production',
            PORT: 3000
        },
        // Load environment variables from .env file
        env_file: '.env',
        // Auto-restart on crash
        autorestart: true,
        // Maximum memory before restart (optional)
        max_memory_restart: '1G',
        // Error and output logs
        error_file: './logs/pm2-error.log',
        out_file: './logs/pm2-out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        // Merge logs from all instances
        merge_logs: true,
        // Time to wait before force killing the app
        kill_timeout: 5000
    }]
};
