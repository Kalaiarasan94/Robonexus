<?php
// config.php - Environment variables loader for RoboNexus PHP backend

function loadEnv($dir) {
    $path = $dir . '/.env';
    if (!file_exists($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        // Skip comments and empty lines
        if (empty($line) || strpos($line, '#') === 0) {
            continue;
        }

        // Must contain '='
        if (strpos($line, '=') === false) {
            continue;
        }

        // Split by the first '='
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);

        // Strip surrounding quotes
        if (preg_match('/^"(.*)"$/', $value, $matches)) {
            $value = $matches[1];
        } elseif (preg_match('/^\'(.*)\'$/', $value, $matches)) {
            $value = $matches[1];
        }

        // Set variables
        $_ENV[$name] = $value;
        putenv("$name=$value");
    }
}

// Automatically load .env from the backend root folder
loadEnv(__DIR__);
