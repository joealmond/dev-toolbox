module.exports = {
  apps: [{
    name: 'dev-toolbox',
    script: './scripts/watcher.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    // Enable watch mode for automatic restart on code changes
    watch: true,
    // Ignore patterns to avoid unnecessary restarts
    ignore_watch: [
      'node_modules',
      '.git',
      'logs',
      'backlog',
      'repos',
      '*.log',
      '*.md',
      '.devcontainer'
    ],
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    // Logging configuration
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    time: true,
    merge_logs: true,
    // Process lifecycle settings
    kill_timeout: 5000,
    // Disable wait_ready since watcher.js doesn't send process.send('ready')
    wait_ready: false,
    listen_timeout: 10000,
    // Restart delay to avoid rapid restart loops
    restart_delay: 1000,
    // Max restart attempts in a window
    max_restarts: 10,
    min_uptime: 5000
  }]
};
