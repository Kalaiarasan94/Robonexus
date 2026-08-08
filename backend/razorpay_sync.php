<?php
// razorpay_sync.php - Read payments straight from Razorpay and reconcile them
// against what RoboNexus has recorded.
//
// This is the safety net. Everything else in the payment path can fail — the
// customer's browser, the gateway callback, the network — but Razorpay is the
// system of record for money actually taken. Comparing against it directly is
// the only way to be certain nobody paid without being registered.
//
// Read-only: it never creates, refunds or modifies anything at Razorpay.

require_once __DIR__ . '/db.php';

if (!function_exists('rzpCredentials')) {
    function rzpCredentials() {
        $id     = isset($_ENV['RAZORPAY_KEY_ID']) ? trim($_ENV['RAZORPAY_KEY_ID']) : '';
        $secret = isset($_ENV['RAZORPAY_KEY_SECRET']) ? trim($_ENV['RAZORPAY_KEY_SECRET']) : '';
        return ($id === '' || $secret === '') ? null : [$id, $secret];
    }
}

if (!function_exists('fetchRazorpayPayments')) {
    /**
     * Most recent payments from the Razorpay API.
     *
     * @return array{ok:bool, items:array, error:string}
     */
    function fetchRazorpayPayments($count = 50) {
        $creds = rzpCredentials();
        if ($creds === null) {
            return ['ok' => false, 'items' => [], 'error' => 'Razorpay keys are not configured in backend/.env.'];
        }
        list($id, $secret) = $creds;

        $count = max(1, min(100, (int) $count)); // Razorpay caps this at 100
        $ch = curl_init('https://api.razorpay.com/v1/payments?count=' . $count);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_USERPWD        => $id . ':' . $secret,
            CURLOPT_TIMEOUT        => 20,
            CURLOPT_CONNECTTIMEOUT => 8,
        ]);
        $body = curl_exec($ch);
        $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $cErr = curl_error($ch);
        curl_close($ch);

        if ($body === false) {
            return ['ok' => false, 'items' => [], 'error' => 'Could not reach Razorpay: ' . $cErr];
        }
        if ($http === 401) {
            return ['ok' => false, 'items' => [], 'error' => 'Razorpay rejected the API key (401). Check RAZORPAY_KEY_ID / SECRET.'];
        }
        if ($http < 200 || $http >= 300) {
            return ['ok' => false, 'items' => [], 'error' => 'Razorpay returned HTTP ' . $http . '.'];
        }

        $data = json_decode($body, true);
        if (!is_array($data) || !isset($data['items'])) {
            return ['ok' => false, 'items' => [], 'error' => 'Unexpected response from Razorpay.'];
        }
        return ['ok' => true, 'items' => $data['items'], 'error' => ''];
    }
}

if (!function_exists('reconcileRazorpayPayments')) {
    /**
     * Join Razorpay's list against local records.
     *
     * Each row gets a `state`:
     *   registered   — payment recorded AND a contractor account exists
     *   payment_only — payment recorded but nobody can log in
     *   missing      — Razorpay took the money, RoboNexus has no record at all
     */
    function reconcileRazorpayPayments($pdo, $items) {
        // Local payment ids -> register_id
        $localPayments = [];
        if ($pdo !== null) {
            try {
                foreach ($pdo->query("SELECT `payment_id`, `register_id`, `customer_email` FROM `payments`")
                             ->fetchAll(PDO::FETCH_ASSOC) as $r) {
                    $localPayments[$r['payment_id']] = $r;
                }
            } catch (PDOException $e) {
                error_log("Reconcile payments read failed: " . $e->getMessage());
            }
        }
        if (!$localPayments) {
            $f = __DIR__ . '/payments.json';
            if (file_exists($f)) {
                $d = json_decode(file_get_contents($f), true);
                if (is_array($d)) {
                    foreach ($d as $r) {
                        $localPayments[$r['paymentId'] ?? ''] = [
                            'payment_id' => $r['paymentId'] ?? '',
                            'register_id' => $r['registerId'] ?? '',
                            'customer_email' => $r['email'] ?? '',
                        ];
                    }
                }
            }
        }

        // Known account emails
        $accounts = [];
        if ($pdo !== null) {
            try {
                foreach ($pdo->query("SELECT `email` FROM `users`")->fetchAll(PDO::FETCH_COLUMN) as $e) {
                    $accounts[strtolower($e)] = true;
                }
            } catch (PDOException $e) {
                error_log("Reconcile users read failed: " . $e->getMessage());
            }
        }
        if (!$accounts) {
            $f = __DIR__ . '/users.json';
            if (file_exists($f)) {
                $d = json_decode(file_get_contents($f), true);
                if (is_array($d)) foreach ($d as $u) $accounts[strtolower($u['email'] ?? '')] = true;
            }
        }

        $rows = ['registered' => 0, 'payment_only' => 0, 'missing' => 0, 'items' => []];

        foreach ($items as $it) {
            // Only money actually taken counts. Failed/created attempts are noise.
            $status = $it['status'] ?? '';
            if (!in_array($status, ['captured', 'authorized'], true)) continue;

            $pid   = $it['id'] ?? '';
            $email = strtolower($it['email'] ?? '');
            $local = $localPayments[$pid] ?? null;

            if ($local === null) {
                $state = 'missing';
            } elseif (($local['register_id'] ?? '') !== '' || ($email !== '' && isset($accounts[$email]))) {
                $state = 'registered';
            } else {
                $state = 'payment_only';
            }
            $rows[$state]++;

            $rows['items'][] = [
                'id'        => $pid,
                'orderId'   => $it['order_id'] ?? '',
                'amount'    => number_format(((float) ($it['amount'] ?? 0)) / 100, 2, '.', ''),
                'status'    => $status,
                'method'    => $it['method'] ?? '',
                'email'     => $it['email'] ?? '',
                'contact'   => $it['contact'] ?? '',
                'name'      => $it['notes']['name'] ?? '',
                'createdAt' => isset($it['created_at']) ? date('Y-m-d H:i:s', (int) $it['created_at']) : '',
                'state'     => $state,
                'registerId'=> $local['register_id'] ?? '',
            ];
        }

        return $rows;
    }
}
