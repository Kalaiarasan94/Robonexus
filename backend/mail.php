<?php
// mail.php - Native SMTP Email Client for RoboNexus PHP backend
require_once __DIR__ . '/config.php';

/**
 * Send an email using native SMTP socket communication or fallback to built-in mail().
 *
 * @param string $to Recipient email address
 * @param string $subject Email subject
 * @param string $body HTML or Plain text email body
 * @param bool $isHtml Whether the body is HTML (default true)
 * @return bool True if mail was sent successfully, false otherwise
 */
function sendMail($to, $subject, $body, $isHtml = true) {
    $smtpHost = isset($_ENV['SMTP_HOST']) ? trim($_ENV['SMTP_HOST']) : '';
    $smtpPort = isset($_ENV['SMTP_PORT']) ? (int)$_ENV['SMTP_PORT'] : 25;
    $smtpUser = isset($_ENV['SMTP_USER']) ? trim($_ENV['SMTP_USER']) : '';
    $smtpPass = isset($_ENV['SMTP_PASS']) ? trim($_ENV['SMTP_PASS']) : '';
    $smtpSecure = isset($_ENV['SMTP_SECURE']) ? trim(strtolower($_ENV['SMTP_SECURE'])) : ''; // 'tls', 'ssl' or ''
    $fromEmail = isset($_ENV['SMTP_FROM_EMAIL']) ? trim($_ENV['SMTP_FROM_EMAIL']) : 'onboarding@robonexus.com';
    $fromName = isset($_ENV['SMTP_FROM_NAME']) ? trim($_ENV['SMTP_FROM_NAME']) : 'RoboNexus Telemetry';

    // If SMTP host is not configured, fall back to PHP's built-in mail() function
    if (empty($smtpHost)) {
        $headers = [];
        $headers[] = 'MIME-Version: 1.0';
        if ($isHtml) {
            $headers[] = 'Content-type: text/html; charset=utf-8';
        } else {
            $headers[] = 'Content-type: text/plain; charset=utf-8';
        }
        $headers[] = 'From: ' . $fromName . ' <' . $fromEmail . '>';
        
        // Log the fallback action
        error_log("SMTP not configured. Falling back to built-in mail() for $to.");
        return @mail($to, $subject, $body, implode("\r\n", $headers));
    }

    // SMTP Socket Implementation
    try {
        $host = $smtpHost;
        if ($smtpSecure === 'ssl') {
            $host = 'ssl://' . $smtpHost;
        }
        
        $socket = @fsockopen($host, $smtpPort, $errno, $errstr, 15);
        if (!$socket) {
            throw new Exception("Could not connect to SMTP host $host:$smtpPort : $errstr ($errno)");
        }

        $getResponse = function($socket) {
            $response = '';
            while (($line = fgets($socket, 515)) !== false) {
                $response .= $line;
                // SMTP status responses have a space as the 4th character when completed
                if (substr($line, 3, 1) == ' ') {
                    break;
                }
            }
            return $response;
        };

        $sendCommand = function($socket, $cmd) use ($getResponse) {
            fwrite($socket, $cmd . "\r\n");
            return $getResponse($socket);
        };

        $response = $getResponse($socket);
        if (substr($response, 0, 3) !== '220') {
            throw new Exception("Connection greetings failed: " . $response);
        }

        // EHLO
        $response = $sendCommand($socket, "EHLO " . (isset($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : 'localhost'));
        if (substr($response, 0, 3) !== '250') {
            throw new Exception("EHLO failed: " . $response);
        }

        // STARTTLS if configured
        if ($smtpSecure === 'tls') {
            $response = $sendCommand($socket, "STARTTLS");
            if (substr($response, 0, 3) !== '220') {
                throw new Exception("STARTTLS failed: " . $response);
            }
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new Exception("Failed to start encryption (TLS)");
            }
            // Resend EHLO after starting TLS
            $response = $sendCommand($socket, "EHLO " . (isset($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : 'localhost'));
            if (substr($response, 0, 3) !== '250') {
                throw new Exception("EHLO post-TLS failed: " . $response);
            }
        }

        // AUTH LOGIN if credentials are provided
        if (!empty($smtpUser) && !empty($smtpPass)) {
            $response = $sendCommand($socket, "AUTH LOGIN");
            if (substr($response, 0, 3) !== '334') {
                throw new Exception("AUTH LOGIN command rejected: " . $response);
            }
            $response = $sendCommand($socket, base64_encode($smtpUser));
            if (substr($response, 0, 3) !== '334') {
                throw new Exception("SMTP Username authentication failed: " . $response);
            }
            $response = $sendCommand($socket, base64_encode($smtpPass));
            if (substr($response, 0, 3) !== '235') {
                throw new Exception("SMTP Password authentication failed: " . $response);
            }
        }

        // MAIL FROM
        $response = $sendCommand($socket, "MAIL FROM:<" . $fromEmail . ">");
        if (substr($response, 0, 3) !== '250') {
            throw new Exception("MAIL FROM command rejected: " . $response);
        }

        // RCPT TO
        $response = $sendCommand($socket, "RCPT TO:<" . $to . ">");
        if (substr($response, 0, 3) !== '250' && substr($response, 0, 3) !== '251') {
            throw new Exception("RCPT TO command rejected: " . $response);
        }

        // DATA
        $response = $sendCommand($socket, "DATA");
        if (substr($response, 0, 3) !== '354') {
            throw new Exception("DATA command rejected: " . $response);
        }

        // Prepare Headers & Message
        $headers = [];
        $headers[] = "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <" . $fromEmail . ">";
        $headers[] = "To: <" . $to . ">";
        $headers[] = "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=";
        $headers[] = "Date: " . date('r');
        $headers[] = "MIME-Version: 1.0";
        if ($isHtml) {
            $headers[] = "Content-Type: text/html; charset=utf-8";
        } else {
            $headers[] = "Content-Type: text/plain; charset=utf-8";
        }
        $headers[] = "Content-Transfer-Encoding: 8bit";

        $emailData = implode("\r\n", $headers) . "\r\n\r\n" . $body . "\r\n.\r\n";
        fwrite($socket, $emailData);
        
        $response = $getResponse($socket);
        if (substr($response, 0, 3) !== '250') {
            throw new Exception("Sending message body failed: " . $response);
        }

        // QUIT
        $sendCommand($socket, "QUIT");
        fclose($socket);
        return true;
    } catch (Exception $e) {
        error_log("RoboNexus SMTP Mail Error: " . $e->getMessage());
        return false;
    }
}
